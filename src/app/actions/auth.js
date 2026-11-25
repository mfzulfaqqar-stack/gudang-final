'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createSession, destroySession } from '@/lib/auth';
import { loginSchema, registerSchema, fieldErrors } from '@/lib/validators';

const HOME = {
  admin: '/admin',
  manager: '/manager',
  staff: '/staff',
  supplier: '/supplier',
};

export async function loginAction(prevState, formData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { email, password } = parsed.data;
  const { rows } = await query(
    'SELECT id, nama, password, role, status_akun FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  const user = rows[0];

  // Pesan sama untuk email salah dan password salah (tidak membocorkan email terdaftar)
  const cocok = user && (await bcrypt.compare(password, user.password));
  if (!cocok) return { message: 'Email atau password salah' };

  // Supplier hanya boleh masuk jika sudah di-approve Admin
  if (user.role === 'supplier' && user.status_akun === 'Pending') {
    return { message: 'Akun Anda sedang ditinjau oleh Admin' };
  }
  if (user.role === 'supplier' && user.status_akun === 'Rejected') {
    return { message: 'Pendaftaran akun Anda ditolak' };
  }

  await createSession(user);
  redirect(HOME[user.role]);
}

export async function registerAction(prevState, formData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { nama, email, password } = parsed.data;
  const hash = await bcrypt.hash(password, 10);

  try {
    // Role dan status ditetapkan di server, bukan dari form
    await query(
      `INSERT INTO users (nama, email, password, role, status_akun)
       VALUES ($1, $2, $3, 'supplier', 'Pending')`,
      [nama, email, hash]
    );
  } catch (e) {
    if (e.code === '23505') return { message: 'Email sudah terdaftar' };
    throw e;
  }

  // Tidak ada sesi dan tidak ada redirect: Supplier harus menunggu approval Admin
  return {
    ok: true,
    message: 'Pendaftaran berhasil. Tunggu persetujuan Admin sebelum bisa masuk.',
  };
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}