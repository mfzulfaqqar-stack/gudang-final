import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  nama: z.string().trim().min(1, 'Nama supplier wajib diisi'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

// Ubah error zod menjadi { namaField: 'pesan' }
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// ---------- Produk ----------
const teks = (label) => z.string().trim().min(1, `${label} wajib diisi`);

const angka = (label, { int = false } = {}) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .transform((v) => Number(v))
    .refine((n) => Number.isFinite(n), `${label} harus berupa angka`)
    .refine((n) => n >= 0, `${label} tidak boleh negatif`)
    .refine((n) => !int || Number.isInteger(n), `${label} harus bilangan bulat`);

const productShape = {
  nama: teks('Nama produk'),
  category_id: z
    .string()
    .trim()
    .min(1, 'Kategori wajib dipilih')
    .transform((v) => Number(v))
    .refine((n) => Number.isInteger(n) && n > 0, 'Kategori tidak valid'),
  deskripsi: teks('Deskripsi'),
  harga_beli: angka('Harga beli'),
  harga_jual: angka('Harga jual'),
  stok_minimum: angka('Stok minimum', { int: true }),
  stok_low: angka('Stok low', { int: true }),
  stok: angka('Jumlah stok', { int: true }),
  unit: teks('Unit'),
  lokasi_rak: teks('Lokasi rak'),
  gambar: z.string().trim().optional(),
};

const pesanStok = {
  message: 'Stok Low harus lebih besar dari stok minimum',
  path: ['stok_low'],
};

export const productCreateSchema = z
  .object({ sku: teks('SKU'), ...productShape })
  .refine((d) => d.stok_low > d.stok_minimum, pesanStok);

// SKU tidak bisa diubah saat edit
export const productEditSchema = z
  .object({ ...productShape })
  .refine((d) => d.stok_low > d.stok_minimum, pesanStok);

  // ---------- Kategori ----------
export const categorySchema = z.object({
  nama: teks('Nama kategori'),
  deskripsi: teks('Deskripsi'),
  gambar: z.string().trim().optional(),
});