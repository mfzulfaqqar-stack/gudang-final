import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';
import NavLinks from '@/app/components/NavLinks';

const MENU = {
  admin: [
    ['/admin', 'Dashboard'],
    ['/produk', 'Produk'],
    ['/transaksi', 'Transaksi'],
    ['/restock', 'Restock'],
    ['/kategori', 'Kategori'],
    ['/admin/supplier', 'Supplier'],
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

const ROLE_LABEL = {
  admin: 'Admin',
  manager: 'Warehouse Manager',
  staff: 'Staff Gudang',
  supplier: 'Supplier',
};

export default async function Navbar() {
  const session = await getSession();
  const links = session ? MENU[session.role] ?? [] : [];

  return (
    <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white">
            G
          </span>
          Gudang
        </Link>

        {links.length > 0 && <NavLinks links={links} />}

        <div className="ml-auto flex items-center gap-3">
          {session ? (
            <>
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-medium text-slate-900">{session.nama}</p>
                <p className="text-xs text-slate-500">{ROLE_LABEL[session.role]}</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 sm:hidden">
                {ROLE_LABEL[session.role]}
              </span>
              <form action={logoutAction}>
                <button className="rounded-lg border bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700">
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                Daftar Supplier
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}