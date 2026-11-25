import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';

export default async function Navbar() {
  const session = await getSession();

  return (
    <nav className="flex flex-wrap items-center gap-4 border-b bg-white px-6 py-3">
      <Link href="/" className="font-bold">Perpustakaan</Link>
      <Link href="/katalog">Katalog</Link>

      {session?.role === 'mahasiswa' && <Link href="/mahasiswa">Dashboard</Link>}
      {session?.role === 'pegawai' && <Link href="/pegawai">Dashboard</Link>}
      {session?.role === 'admin' && <Link href="/admin">Dashboard</Link>}

      <div className="ml-auto flex items-center gap-3">
        {session ? (
          <>
            <span className="text-sm text-gray-600">{session.nama} ({session.role})</span>
            <form action={logoutAction}>
              <button className="rounded border px-3 py-1 text-sm">Keluar</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Masuk</Link>
            <Link href="/register" className="rounded bg-blue-600 px-3 py-1 text-white">
              Daftar
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}