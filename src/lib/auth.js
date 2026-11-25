import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export async function createSession(user) {
  const token = await new SignJWT({ id: user.id, role: user.role, nama: user.nama })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  const store = await cookies();
  store.set('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function getSession() {
  const store = await cookies();
  const token = store.get('session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload; // { id, role, nama }
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete('session');
}

// Pakai di awal SETIAP server action / halaman yang dibatasi
export async function requireRole(roles) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!roles.includes(session.role)) redirect('/');
  return session;
}