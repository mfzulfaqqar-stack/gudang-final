import Link from 'next/link';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { PRODUK_BASE_SQL } from '@/lib/queries';
import StatCard from '@/app/components/StatCard';
import StockBadge from '@/app/components/StockBadge';
import RestockStatusBadge from '@/app/components/RestockStatusBadge';

export const dynamic = 'force-dynamic';

export default async function ManagerPage() {
  const session = await requireRole(['manager']);

  const total = (
    await query(
      `SELECT COUNT(*)::int AS produk, COALESCE(SUM(stok), 0)::int AS unit FROM products`
    )
  ).rows[0];

  const counts = Object.fromEntries(
    (
      await query(
        `SELECT status_stok, COUNT(*)::int AS n FROM (${PRODUK_BASE_SQL}) x GROUP BY status_stok`
      )
    ).rows.map((r) => [r.status_stok, r.n])
  );

  const perluRestock = (
    await query(
      `SELECT * FROM (${PRODUK_BASE_SQL}) x
       WHERE x.status_stok IN ('Out of Stock', 'Severe', 'Low')
       ORDER BY x.stok, x.nama
       LIMIT 8`
    )
  ).rows;

  const pendingTrx = (
    await query(
      `SELECT t.id, t.no_transaksi, t.tipe, t.tanggal,
              COALESCE(s.nama, t.customer) AS pihak, uc.nama AS pembuat
       FROM transactions t
       LEFT JOIN users s ON s.id = t.supplier_id
       JOIN users uc ON uc.id = t.created_by
       WHERE t.status = 'Pending'
       ORDER BY t.created_at, t.id`
    )
  ).rows;

  const restock = (
    await query(
      `SELECT r.id, r.no_po, r.status, r.expected_delivery, s.nama AS supplier_nama
       FROM restock_orders r
       JOIN users s ON s.id = r.supplier_id
       WHERE r.status IN ('Pending', 'Confirmed', 'In Transit')
       ORDER BY r.expected_delivery, r.id`
    )
  ).rows;

  return (
    <main className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Manager</h1>
        <p className="text-sm text-gray-600">Selamat datang, {session.nama}.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total produk" value={total.produk} />
        <StatCard label="Total unit di gudang" value={total.unit.toLocaleString('id-ID')} />
        <StatCard label="Stok Low" value={counts.Low ?? 0} tone={counts.Low ? 'warn' : 'default'} />
        <StatCard label="Stok Severe" value={counts.Severe ?? 0} tone={counts.Severe ? 'danger' : 'default'} />
        <StatCard
          label="Out of Stock"
          value={counts['Out of Stock'] ?? 0}
          tone={counts['Out of Stock'] ? 'muted' : 'default'}
        />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Transaksi menunggu approval ({pendingTrx.length})</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">No. transaksi</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Supplier / Customer</th>
                <th className="p-3">Dibuat oleh</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pendingTrx.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Tidak ada transaksi yang menunggu.
                  </td>
                </tr>
              )}
              {pendingTrx.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3 font-mono">{t.no_transaksi}</td>
                  <td className="p-3 capitalize">{t.tipe}</td>
                  <td className="p-3">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="p-3">{t.pihak ?? '-'}</td>
                  <td className="p-3">{t.pembuat}</td>
                  <td className="p-3">
                    <Link href={`/transaksi/${t.id}`} className="text-blue-600 underline">
                      Tinjau
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Restock order berjalan ({restock.length})</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">No. PO</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Expected delivery</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {restock.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Tidak ada restock order yang berjalan.
                  </td>
                </tr>
              )}
              {restock.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-mono">{r.no_po}</td>
                  <td className="p-3">{r.supplier_nama}</td>
                  <td className="p-3">{new Date(r.expected_delivery).toLocaleDateString('id-ID')}</td>
                  <td className="p-3"><RestockStatusBadge status={r.status} /></td>
                  <td className="p-3">
                    <Link href={`/restock/${r.id}`} className="text-blue-600 underline">
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Produk yang perlu direstock</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Produk</th>
                <th className="p-3">Stok</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {perluRestock.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Semua produk berstok normal.
                  </td>
                </tr>
              )}
              {perluRestock.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-mono">{p.sku}</td>
                  <td className="p-3">{p.nama}</td>
                  <td className="p-3">{p.stok} {p.unit}</td>
                  <td className="p-3"><StockBadge status={p.status_stok} /></td>
                  <td className="p-3">
                    <Link href={`/restock/baru?produk=${p.id}`} className="text-orange-600 underline">
                      Buat restock
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}