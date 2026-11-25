import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';

const MENU = {
  admin: [
    ['/admin', 'Dashboard'],
    ['/produk', 'Produk'],
    ['/transaksi', 'Transaksi'],
    ['/restock', 'Restock'],
    ['/kategori', 'Kategori'],
  ],
  manager: [
    ['/manager', 'Dashboard'],
    ['/produk', 'Produk'],
    ['/transaksi', 'Transaksi'],
    ['/restock', 'Restock'],
    ['/kategori', 'Kategori'],
  ],
  staff: [
    ['/staff', 'Dashboard'],
    ['/produk', 'Produk'],
    ['/transaksi', 'Transaksi'],
  ],
  supplier: [
    ['/supplier', 'Dashboard'],
    ['/restock', 'Restock'],
  ],
};

export default async function Navbar() {
  const session = await getSession();
  const links = session ? MENU[session.role] ?? [] : [];

  return (
    <nav className="flex flex-wrap items-center gap-4 border-b bg-white px-6 py-3">
      <Link href="/" className="font-bold">Gudang</Link>

      {links.map(([href, label]) => (
        <Link key={href} href={href}>{label}</Link>
      ))}

      <div className="ml-auto flex items-center gap-3">
        {session ? (
          <>
            <span className="text-sm text-gray-600">
              {session.nama} ({session.role})
            </span>
            <form action={logoutAction}>
              <button className="rounded border px-3 py-1 text-sm">Keluar</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Masuk</Link>
            <Link href="/register" className="rounded bg-blue-600 px-3 py-1 text-white">
              Daftar Supplier
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}