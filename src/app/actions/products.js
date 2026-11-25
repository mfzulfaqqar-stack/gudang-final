'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { productCreateSchema, productEditSchema, fieldErrors } from '@/lib/validators';

const ALLOWED = ['admin', 'manager'];

export async function createProduct(prev, formData) {
  await requireRole(ALLOWED);
  const raw = Object.fromEntries(formData);

  const parsed = productCreateSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  const d = parsed.data;

  try {
    await query(
      `INSERT INTO products
       (sku, nama, category_id, deskripsi, harga_beli, harga_jual,
        stok_minimum, stok_low, stok, unit, lokasi_rak, gambar)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        d.sku, d.nama, d.category_id, d.deskripsi, d.harga_beli, d.harga_jual,
        d.stok_minimum, d.stok_low, d.stok, d.unit, d.lokasi_rak, d.gambar || null,
      ]
    );
  } catch (e) {
    if (e.code === '23505') return { errors: { sku: 'SKU sudah digunakan' }, values: raw };
    if (e.code === '23503') return { errors: { category_id: 'Kategori tidak ditemukan' }, values: raw };
    throw e;
  }

  revalidatePath('/produk');
  redirect('/produk');
}

export async function updateProduct(prev, formData) {
  await requireRole(ALLOWED);
  const raw = Object.fromEntries(formData);
  const id = Number(raw.id);
  if (!Number.isInteger(id)) return { message: 'Produk tidak valid', values: raw };

  const parsed = productEditSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  const d = parsed.data;

  try {
    const res = await query(
      `UPDATE products
       SET nama = $2, category_id = $3, deskripsi = $4, harga_beli = $5,
           harga_jual = $6, stok_minimum = $7, stok_low = $8, stok = $9,
           unit = $10, lokasi_rak = $11, gambar = $12
       WHERE id = $1`,
      [
        id, d.nama, d.category_id, d.deskripsi, d.harga_beli, d.harga_jual,
        d.stok_minimum, d.stok_low, d.stok, d.unit, d.lokasi_rak, d.gambar || null,
      ]
    );
    if (!res.rowCount) return { message: 'Produk tidak ditemukan', values: raw };
  } catch (e) {
    if (e.code === '23503') return { errors: { category_id: 'Kategori tidak ditemukan' }, values: raw };
    throw e;
  }

  revalidatePath('/produk');
  redirect('/produk');
}

export async function deleteProduct(prev, formData) {
  await requireRole(ALLOWED);
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return { message: 'Produk tidak valid' };

  try {
    await query('DELETE FROM products WHERE id = $1', [id]);
  } catch (e) {
    // 23503 = foreign key violation: produk dipakai di transaksi atau restock
    if (e.code === '23503') {
      return { message: 'Produk tidak dapat dihapus karena memiliki riwayat transaksi atau restock.' };
    }
    throw e;
  }

  revalidatePath('/produk');
  redirect('/produk');
}