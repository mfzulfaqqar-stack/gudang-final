'use server';

import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { query, tx } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { fieldErrors } from '@/lib/validators';

const tanggalSchema = z
  .string()
  .trim()
  .min(1, 'Tanggal wajib diisi')
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)), 'Tanggal tidak valid');

const restockSchema = z
  .object({
    supplier_id: z.string().trim().min(1, 'Supplier wajib dipilih'),
    tgl_order: tanggalSchema,
    expected_delivery: tanggalSchema,
    catatan: z.string().trim().min(1, 'Catatan wajib diisi'),
  })
  .refine((d) => d.expected_delivery >= d.tgl_order, {
    message: 'Expected delivery tidak boleh sebelum tanggal order',
    path: ['expected_delivery'],
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

function nomorPO(tanggal, id) {
  return `PO-${tanggal.replaceAll('-', '')}-${String(id).padStart(3, '0')}`;
}

function refresh(id) {
  revalidatePath('/restock');
  if (id) revalidatePath(`/restock/${id}`);
  revalidatePath('/supplier');
  revalidatePath('/manager');
}

// ---------- MANAGER: buat restock order ----------
export async function createRestock(prev, formData) {
  const session = await requireRole(['manager']);

  const parsed = restockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const supplierId = Number(d.supplier_id);
  if (!Number.isInteger(supplierId) || supplierId <= 0) {
    return { errors: { supplier_id: 'Supplier tidak valid' } };
  }
  const sup = await query(
    `SELECT 1 FROM users WHERE id = $1 AND role = 'supplier' AND status_akun = 'Approved'`,
    [supplierId]
  );
  if (!sup.rowCount) return { errors: { supplier_id: 'Supplier tidak valid' } };

  const p = parseItems(formData);
  if (p.error) return { message: p.error };

  let newId;
  try {
    newId = await tx(async (c) => {
      // Nomor sementara dulu, lalu diganti nomor berbasis id agar pasti unik
      const ins = await c.query(
        `INSERT INTO restock_orders
         (no_po, supplier_id, manager_id, tgl_order, expected_delivery, catatan)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [`TMP-${randomUUID().slice(0, 8)}`, supplierId, session.id, d.tgl_order, d.expected_delivery, d.catatan]
      );
      const id = ins.rows[0].id;
      await c.query('UPDATE restock_orders SET no_po = $2 WHERE id = $1', [
        id,
        nomorPO(d.tgl_order, id),
      ]);
      for (const it of p.items) {
        await c.query(
          'INSERT INTO restock_items (restock_id, product_id, qty) VALUES ($1,$2,$3)',
          [id, it.product_id, it.qty]
        );
      }
      return id;
    });
  } catch (e) {
    if (e.code === '23503') return { message: 'Produk atau supplier tidak ditemukan' };
    throw e;
  }

  refresh();
  redirect(`/restock/${newId}`);
}

// ---------- SUPPLIER: konfirmasi ----------
export async function confirmRestock(prev, formData) {
  const session = await requireRole(['supplier']);
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return { message: 'Order tidak valid' };

  // supplier_id = session.id memastikan supplier hanya bisa memproses order miliknya
  const res = await query(
    `UPDATE restock_orders SET status = 'Confirmed'
     WHERE id = $1 AND supplier_id = $2 AND status = 'Pending'`,
    [id, session.id]
  );
  if (!res.rowCount) return { message: 'Order tidak ditemukan atau sudah diproses' };

  refresh(id);
  return { ok: true, message: 'Order dikonfirmasi' };
}

// ---------- SUPPLIER: tolak (alasan wajib) ----------
export async function rejectRestock(prev, formData) {
  const session = await requireRole(['supplier']);
  const id = Number(formData.get('id'));
  const alasan = String(formData.get('catatan_status') ?? '').trim();
  if (!Number.isInteger(id)) return { message: 'Order tidak valid' };
  if (!alasan) return { message: 'Alasan penolakan wajib diisi' };

  const res = await query(
    `UPDATE restock_orders SET status = 'Rejected', catatan_status = $3
     WHERE id = $1 AND supplier_id = $2 AND status = 'Pending'`,
    [id, session.id, alasan]
  );
  if (!res.rowCount) return { message: 'Order tidak ditemukan atau sudah diproses' };

  refresh(id);
  return { ok: true, message: 'Order ditolak' };
}

// ---------- MANAGER: Confirmed -> In Transit -> Received ----------
// Kunci = status tujuan, nilai = status asal yang diizinkan
const DARI = { 'In Transit': 'Confirmed', Received: 'In Transit' };

export async function advanceRestock(prev, formData) {
  await requireRole(['manager']);
  const id = Number(formData.get('id'));
  const target = String(formData.get('status') ?? '');
  const asal = DARI[target];
  if (!Number.isInteger(id) || !asal) return { message: 'Permintaan tidak valid' };

  // Status Received sendiri tidak mengubah stok. Stok bertambah saat
  // Incoming Transaction dari PO ini di-approve Manager.
  const res = await query(
    `UPDATE restock_orders SET status = $2 WHERE id = $1 AND status = $3`,
    [id, target, asal]
  );
  if (!res.rowCount) return { message: `Status order harus ${asal} untuk diubah ke ${target}` };

  refresh(id);
  return { ok: true, message: `Status diubah menjadi ${target}` };
}