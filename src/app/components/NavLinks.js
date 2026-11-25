'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLinks({ links }) {
  const pathname = usePathname();
  const home = links[0][0];

  return (
    <nav className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
      {links.map(([href, label]) => {
        // Dashboard hanya aktif di halaman persisnya, menu lain aktif untuk semua sub-halaman
        const active =
          href === home ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}