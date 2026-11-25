'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { createSession, destroySession } from '@/lib/auth';
import { loginSchema, registerSchema, fieldErrors } from '@/lib/validators';

const HOME = { admin: '/admin', pegawai: '/pegawai', mahasiswa: '/mahasiswa' };

export async function loginAction(prevState, formData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { email, password } = parsed.data;
  const { rows } = await query(
    'SELECT id, nama, password, role, is_active FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  const user = rows[0];

  // Pesan sama untuk email salah / password salah (tidak membocorkan email terdaftar)
  const cocok = user && (await bcrypt.compare(password, user.password));
  if (!cocok) return { message: 'Email atau password salah' };
  if (!user.is_active) return { message: 'Akun Anda dinonaktifkan' };

  await createSession(user);
  redirect(HOME[user.role]);
}

export async function registerAction(prevState, formData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { nama, nim, email, password } = parsed.data;
  const hash = await bcrypt.hash(password, 10);

  let user;
  try {
    // Role SELALU 'mahasiswa', ditetapkan di server, bukan dari form
    const { rows } = await query(
      `INSERT INTO users (nama, email, password, role, nim)
       VALUES ($1, $2, $3, 'mahasiswa', $4)
       RETURNING id, nama, role`,
      [nama, email, hash, nim]
    );
    user = rows[0];
  } catch (e) {
    if (e.code === '23505') {
      return { message: 'Email atau NIM sudah terdaftar' };
    }
    throw e;
  }

  await createSession(user);
  redirect('/mahasiswa');
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}