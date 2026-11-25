'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { categorySchema, fieldErrors } from '@/lib/validators';

const ALLOWED = ['admin', 'manager'];

export async function createCategory(prev, formData) {
  await requireRole(ALLOWED);
  const raw = Object.fromEntries(formData);

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  const d = parsed.data;

  // Nama harus unik tanpa membedakan huruf besar/kecil
  const dup = await query('SELECT 1 FROM categories WHERE LOWER(nama) = LOWER($1)', [d.nama]);
  if (dup.rowCount) return { errors: { nama: 'Nama kategori sudah digunakan' }, values: raw };

  try {
    await query('INSERT INTO categories (nama, deskripsi, gambar) VALUES ($1, $2, $3)', [
      d.nama,
      d.deskripsi,
      d.gambar || null,
    ]);
  } catch (e) {
    if (e.code === '23505') return { errors: { nama: 'Nama kategori sudah digunakan' }, values: raw };
    throw e;
  }

  revalidatePath('/kategori');
  redirect('/kategori');
}

export async function updateCategory(prev, formData) {
  await requireRole(ALLOWED);
  const raw = Object.fromEntries(formData);
  const id = Number(raw.id);
  if (!Number.isInteger(id)) return { message: 'Kategori tidak valid', values: raw };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };
  const d = parsed.data;

  const dup = await query(
    'SELECT 1 FROM categories WHERE LOWER(nama) = LOWER($1) AND id <> $2',
    [d.nama, id]
  );
  if (dup.rowCount) return { errors: { nama: 'Nama kategori sudah digunakan' }, values: raw };

  try {
    const res = await query(
      'UPDATE categories SET nama = $2, deskripsi = $3, gambar = $4 WHERE id = $1',
      [id, d.nama, d.deskripsi, d.gambar || null]
    );
    if (!res.rowCount) return { message: 'Kategori tidak ditemukan', values: raw };
  } catch (e) {
    if (e.code === '23505') return { errors: { nama: 'Nama kategori sudah digunakan' }, values: raw };
    throw e;
  }

  revalidatePath('/kategori');
  revalidatePath('/produk');
  redirect('/kategori');
}

export async function deleteCategory(prev, formData) {
  await requireRole(ALLOWED);
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return { message: 'Kategori tidak valid' };

  // Hanya kategori tanpa produk yang boleh dihapus
  const n = (
    await query('SELECT COUNT(*)::int AS n FROM products WHERE category_id = $1', [id])
  ).rows[0].n;
  if (n > 0) {
    return { message: `Kategori tidak dapat dihapus karena masih memiliki ${n} produk.` };
  }

  try {
    await query('DELETE FROM categories WHERE id = $1', [id]);
  } catch (e) {
    // Jaring pengaman jika produk ditambahkan tepat di antara pengecekan dan penghapusan
    if (e.code === '23503') {
      return { message: 'Kategori tidak dapat dihapus karena masih dipakai produk.' };
    }
    throw e;
  }

  revalidatePath('/kategori');
  return { ok: true, message: 'Kategori dihapus' };
}