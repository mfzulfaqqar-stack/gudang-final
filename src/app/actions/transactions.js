'use server';

import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { query, tx } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { fieldErrors } from '@/lib/validators';

class AppError extends Error {}

const tanggalSchema = z
  .string()
  .trim()
  .min(1, 'Tanggal wajib diisi')
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)), 'Tanggal tidak valid');

const masukSchema = z.object({
  tanggal: tanggalSchema,
  restock_id: z.string().trim().optional(),
  supplier_id: z.string().trim().optional(),
  catatan: z.string().trim().min(1, 'Catatan wajib diisi'),
});

const keluarSchema = z.object({
  tanggal: tanggalSchema,
  customer: z.string().trim().min(1, 'Nama customer/tujuan wajib diisi'),
  catatan: z.string().trim().optional(),
});

// Membaca baris produk dari form (product_id[] dan qty[])
function parseItems(formData) {
  const ids = formData.getAll('product_id');
  const qtys = formData.getAll('qty');
  if (ids.length === 0) return { error: 'Tambahkan minimal satu produk' };

  const items = [];
  const seen = new Set();
  for (let i = 0; i < ids.length; i++) {
    const product_id = Number(ids[i]);
    const qty = Number(qtys[i]);
    if (!Number.isInteger(product_id) || product_id <= 0) {
      return { error: `Baris ${i + 1}: pilih produk` };
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      return { error: `Baris ${i + 1}: quantity harus bilangan bulat lebih dari 0` };
    }
    if (seen.has(product_id)) {
      return { error: `Baris ${i + 1}: produk tidak boleh duplikat` };
    }
    seen.add(product_id);
    items.push({ product_id, qty });
  }
  return { items };
}

// Barang keluar: quantity tidak boleh melebihi stok tersedia.
// "run" adalah fungsi (sql, params) agar bisa dipakai di dalam maupun di luar transaksi.
async function cekStok(run, items) {
  const ids = items.map((i) => i.product_id);
  const { rows } = await run('SELECT id, nama, stok FROM products WHERE id = ANY($1::int[])', [ids]);
  const map = new Map(rows.map((r) => [r.id, r]));
  for (const it of items) {
    const p = map.get(it.product_id);
    if (!p) return 'Produk tidak ditemukan';
    if (it.qty > p.stok) {
      return `Quantity ${p.nama} (${it.qty}) melebihi stok tersedia (${p.stok})`;
    }
  }
  return null;
}

function nomorTransaksi(tipe, tanggal, id) {
  const kode = tipe === 'masuk' ? 'IN' : 'OUT';
  return `TRX-${kode}-${tanggal.replaceAll('-', '')}-${String(id).padStart(4, '0')}`;
}

function refresh(id) {
  revalidatePath('/transaksi');
  if (id) revalidatePath(`/transaksi/${id}`);
  revalidatePath('/produk');
}

// ---------- STAFF: buat transaksi ----------
export async function createTransaction(prev, formData) {
  const session = await requireRole(['staff']);
  const tipe = formData.get('tipe');
  if (!['masuk', 'keluar'].includes(tipe)) return { message: 'Tipe transaksi tidak valid' };

  let tanggal, catatan, customer = null, supplierId = null, restockId = null, items;

  if (tipe === 'masuk') {
    const parsed = masukSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const d = parsed.data;
    tanggal = d.tanggal;
    catatan = d.catatan;

    if (d.restock_id) {
      // Dengan PO: supplier dan produk diambil dari PO di server (bukan dari form)
      restockId = Number(d.restock_id);
      const po = (
        await query('SELECT id, supplier_id, status FROM restock_orders WHERE id = $1', [restockId])
      ).rows[0];
      if (!po) return { errors: { restock_id: 'Nomor PO tidak ditemukan' } };
      if (po.status !== 'Received') {
        return { errors: { restock_id: 'PO harus berstatus Received' } };
      }
      const dipakai = await query(
        `SELECT 1 FROM transactions WHERE restock_id = $1 AND status <> 'Rejected'`,
        [restockId]
      );
      if (dipakai.rowCount) {
        return { errors: { restock_id: 'PO ini sudah dipakai transaksi lain' } };
      }
      supplierId = po.supplier_id;
      items = (
        await query('SELECT product_id, qty FROM restock_items WHERE restock_id = $1 ORDER BY id', [restockId])
      ).rows;
      if (items.length === 0) return { message: 'PO tidak memiliki produk' };
    } else {
      supplierId = Number(d.supplier_id);
      if (!Number.isInteger(supplierId) || supplierId <= 0) {
        return { errors: { supplier_id: 'Supplier wajib dipilih' } };
      }
      const sup = await query(
        `SELECT 1 FROM users WHERE id = $1 AND role = 'supplier' AND status_akun = 'Approved'`,
        [supplierId]
      );
      if (!sup.rowCount) return { errors: { supplier_id: 'Supplier tidak valid' } };

      const p = parseItems(formData);
      if (p.error) return { message: p.error };
      items = p.items;
    }
  } else {
    const parsed = keluarSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    tanggal = parsed.data.tanggal;
    customer = parsed.data.customer;
    catatan = parsed.data.catatan || null;

    const p = parseItems(formData);
    if (p.error) return { message: p.error };
    items = p.items;

    const salah = await cekStok(query, items);
    if (salah) return { message: salah };
  }

  try {
    await tx(async (c) => {
      // Nomor sementara dulu, lalu diganti nomor berbasis id agar pasti unik
      const ins = await c.query(
        `INSERT INTO transactions
         (no_transaksi, tipe, tanggal, restock_id, supplier_id, customer, catatan, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [`TMP-${randomUUID().slice(0, 8)}`, tipe, tanggal, restockId, supplierId, customer, catatan, session.id]
      );
      const id = ins.rows[0].id;
      await c.query('UPDATE transactions SET no_transaksi = $2 WHERE id = $1', [
        id,
        nomorTransaksi(tipe, tanggal, id),
      ]);
      for (const it of items) {
        await c.query(
          'INSERT INTO transaction_items (transaction_id, product_id, qty) VALUES ($1,$2,$3)',
          [id, it.product_id, it.qty]
        );
      }
    });
  } catch (e) {
    if (e.code === '23505') return { errors: { restock_id: 'PO ini sudah dipakai transaksi lain' } };
    if (e.code === '23503') return { message: 'Produk atau supplier tidak ditemukan' };
    throw e;
  }

  refresh();
  redirect(`/transaksi?tipe=${tipe}`);
}

// ---------- STAFF (milik sendiri) / MANAGER: edit transaksi Pending ----------
export async function updateTransaction(prev, formData) {
  const session = await requireRole(['staff', 'manager']);
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return { message: 'Transaksi tidak valid' };

  const p = parseItems(formData);
  if (p.error) return { message: p.error };
  const catatan = String(formData.get('catatan') ?? '').trim();

  try {
    await tx(async (c) => {
      const t = (
        await c.query(
          'SELECT id, tipe, status, created_by FROM transactions WHERE id = $1 FOR UPDATE',
          [id]
        )
      ).rows[0];
      if (!t) throw new AppError('Transaksi tidak ditemukan');
      if (t.status !== 'Pending') throw new AppError('Hanya transaksi Pending yang dapat diedit');
      if (session.role === 'staff' && t.created_by !== session.id) {
        throw new AppError('Anda hanya dapat mengedit transaksi yang Anda buat');
      }
      if (t.tipe === 'masuk' && !catatan) throw new AppError('Catatan wajib diisi');
      if (t.tipe === 'keluar') {
        const salah = await cekStok((sql, params) => c.query(sql, params), p.items);
        if (salah) throw new AppError(salah);
      }

      await c.query('DELETE FROM transaction_items WHERE transaction_id = $1', [id]);
      for (const it of p.items) {
        await c.query(
          'INSERT INTO transaction_items (transaction_id, product_id, qty) VALUES ($1,$2,$3)',
          [id, it.product_id, it.qty]
        );
      }
      await c.query('UPDATE transactions SET catatan = $2 WHERE id = $1', [id, catatan || null]);
    });
  } catch (e) {
    if (e instanceof AppError) return { message: e.message };
    if (e.code === '23503') return { message: 'Produk tidak ditemukan' };
    throw e;
  }

  refresh(id);
  redirect(`/transaksi/${id}`);
}

// ---------- Hapus transaksi Pending ----------
export async function deleteTransaction(prev, formData) {
  const session = await requireRole(['staff', 'manager']);
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return { message: 'Transaksi tidak valid' };

  // Staff hanya boleh menghapus transaksi yang dibuatnya sendiri
  const res =
    session.role === 'staff'
      ? await query(
          `DELETE FROM transactions WHERE id = $1 AND status = 'Pending' AND created_by = $2`,
          [id, session.id]
        )
      : await query(`DELETE FROM transactions WHERE id = $1 AND status = 'Pending'`, [id]);

  if (!res.rowCount) {
    return { message: 'Transaksi tidak dapat dihapus (bukan Pending atau bukan milik Anda)' };
  }
  refresh();
  redirect('/transaksi');
}

// ---------- MANAGER: approve (stok berubah di sini) ----------
export async function approveTransaction(prev, formData) {
  const session = await requireRole(['manager']);
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return { message: 'Transaksi tidak valid' };

  try {
    await tx(async (c) => {
      const t = (
        await c.query('SELECT id, tipe, status FROM transactions WHERE id = $1 FOR UPDATE', [id])
      ).rows[0];
      if (!t) throw new AppError('Transaksi tidak ditemukan');
      if (t.status !== 'Pending') throw new AppError('Transaksi sudah diproses');

      const items = (
        await c.query(
          'SELECT product_id, qty FROM transaction_items WHERE transaction_id = $1 ORDER BY product_id',
          [id]
        )
      ).rows;
      if (items.length === 0) throw new AppError('Transaksi tidak memiliki produk');

      // Kunci baris produk (berurutan berdasarkan id agar tidak terjadi deadlock)
      const prods = (
        await c.query(
          'SELECT id, nama, stok FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
          [items.map((i) => i.product_id)]
        )
      ).rows;
      const map = new Map(prods.map((p) => [p.id, p]));

      for (const it of items) {
        const p = map.get(it.product_id);
        if (!p) throw new AppError('Produk tidak ditemukan');
        if (t.tipe === 'keluar' && it.qty > p.stok) {
          throw new AppError(`Stok ${p.nama} tidak mencukupi (tersedia ${p.stok}, diminta ${it.qty})`);
        }
        const delta = t.tipe === 'masuk' ? it.qty : -it.qty;
        await c.query('UPDATE products SET stok = stok + $2 WHERE id = $1', [it.product_id, delta]);
      }

      await c.query(`UPDATE transactions SET status = 'Approved', approved_by = $2 WHERE id = $1`, [
        id,
        session.id,
      ]);
    });
  } catch (e) {
    if (e instanceof AppError) return { message: e.message };
    throw e;
  }

  refresh(id);
  return { ok: true, message: 'Transaksi disetujui dan stok diperbarui' };
}

// ---------- MANAGER: reject (stok tidak berubah) ----------
export async function rejectTransaction(prev, formData) {
  const session = await requireRole(['manager']);
  const id = Number(formData.get('id'));
  const alasan = String(formData.get('alasan') ?? '').trim();
  if (!Number.isInteger(id)) return { message: 'Transaksi tidak valid' };
  if (!alasan) return { message: 'Alasan penolakan wajib diisi' };

  const res = await query(
    `UPDATE transactions SET status = 'Rejected', alasan_tolak = $2, approved_by = $3
     WHERE id = $1 AND status = 'Pending'`,
    [id, alasan, session.id]
  );
  if (!res.rowCount) return { message: 'Transaksi tidak ditemukan atau sudah diproses' };

  refresh(id);
  return { ok: true, message: 'Transaksi ditolak' };
}

// ---------- STAFF: tandai Shipped (tidak mengubah stok) ----------
export async function markShipped(prev, formData) {
  await requireRole(['staff']);
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return { message: 'Transaksi tidak valid' };

  const res = await query(
    `UPDATE transactions SET status = 'Shipped'
     WHERE id = $1 AND tipe = 'keluar' AND status = 'Approved'`,
    [id]
  );
  if (!res.rowCount) return { message: 'Hanya barang keluar berstatus Approved yang dapat dikirim' };

  refresh(id);
  return { ok: true, message: 'Transaksi ditandai Shipped' };
}