import Link from 'next/link';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { PRODUK_BASE_SQL } from '@/lib/queries';
import { setSupplierStatus } from '@/app/actions/suppliers';
import ActionForm from '@/app/components/ActionForm';
import StatCard from '@/app/components/StatCard';
import StockBadge from '@/app/components/StockBadge';

export const dynamic = 'force-dynamic';

const rp = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;

const MODUL = [
  ['/produk', 'Produk'],
  ['/transaksi', 'Transaksi'],
  ['/restock', 'Restock'],
  ['/kategori', 'Kategori'],
  ['/admin/supplier', 'Verifikasi Supplier'],
];

export default async function AdminPage() {
  const session = await requireRole(['admin']);

  const stat = (
    await query(
      `SELECT
         (SELECT COUNT(*) FROM products)::int AS total_produk,
         (SELECT COUNT(*) FROM transactions
            WHERE date_trunc('month', tanggal) = date_trunc('month', CURRENT_DATE))::int AS trx_bulan_ini,
         (SELECT COALESCE(SUM(stok * harga_beli), 0) FROM products) AS nilai_inventori`
    )
  ).rows[0];

  const pending = (
    await query(
      `SELECT id, nama, email FROM users
       WHERE role = 'supplier' AND status_akun = 'Pending'
       ORDER BY created_at, id`
    )
  ).rows;

  const alert = (
    await query(
      `SELECT * FROM (${PRODUK_BASE_SQL}) x
       WHERE x.status_stok IN ('Severe', 'Out of Stock')
       ORDER BY x.stok, x.nama
       LIMIT 10`
    )
  ).rows;

  return (
    <main className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      <p className="-mt-6 text-sm text-gray-600">Selamat datang, {session.nama}.</p>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total produk" value={stat.total_produk} />
        <StatCard label="Transaksi bulan ini" value={stat.trx_bulan_ini} />
        <StatCard label="Nilai inventori (harga beli)" value={rp(stat.nilai_inventori)} />
        <StatCard
          label="Supplier menunggu approval"
          value={pending.length}
          tone={pending.length ? 'warn' : 'default'}
        />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Quick access</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {MODUL.map(([href, label]) => (
            <Link key={href} href={href} className="rounded border bg-white p-3 text-center hover:bg-gray-50">
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Supplier menunggu approval</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Email</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    Tidak ada pendaftaran yang menunggu.
                  </td>
                </tr>
              )}
              {pending.map((s) => (
                <tr key={s.id} className="border-t align-top">
                  <td className="p-3 font-medium">{s.nama}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-start gap-2">
                      <ActionForm
                        action={setSupplierStatus}
                        fields={{ id: s.id, status: 'Approved' }}
                        label="Approve"
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                      />
                      <ActionForm
                        action={setSupplierStatus}
                        fields={{ id: s.id, status: 'Rejected' }}
                        label="Reject"
                        confirmText={`Tolak pendaftaran ${s.nama}?`}
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Alert stok (Severe dan Out of Stock)</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Produk</th>
                <th className="p-3">Stok</th>
                <th className="p-3">Status</th>
                <th className="p-3">Rak</th>
              </tr>
            </thead>
            <tbody>
              {alert.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Tidak ada produk dengan stok kritis.
                  </td>
                </tr>
              )}
              {alert.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-mono">{p.sku}</td>
                  <td className="p-3">
                    <Link href={`/produk/${p.id}`} className="text-blue-600 underline">
                      {p.nama}
                    </Link>
                  </td>
                  <td className="p-3">{p.stok} {p.unit}</td>
                  <td className="p-3"><StockBadge status={p.status_stok} /></td>
                  <td className="p-3">{p.lokasi_rak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}