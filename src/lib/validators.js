import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  nama: z.string().trim().min(1, 'Nama wajib diisi'),
  nim: z.string().trim().min(1, 'NIM wajib diisi'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Format email tidak valid')
    .refine((e) => e.endsWith('.ac.id'), 'Gunakan email kampus (.ac.id)'),
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