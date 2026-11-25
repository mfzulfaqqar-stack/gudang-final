import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { STATUS_STOK_SQL } from '@/lib/queries';
import StockBadge from '@/app/components/StockBadge';

export const dynamic = 'force-dynamic';

const rp = (n) => `Rp${Number(n).toLocaleString('id-ID')}`;

export default async function DetailProdukPage({ params }) {
  const session = await requireRole(['admin', 'manager', 'staff']);
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const p = (
    await query(
      `SELECT p.*, c.nama AS kategori, ${STATUS_STOK_SQL} AS status_stok
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [pid]
    )
  ).rows[0];
  if (!p) notFound();

  // 5 transaksi terakhir yang melibatkan produk ini
  const riwayat = (
    await query(
      `SELECT t.no_transaksi, t.tipe, t.tanggal, t.status, ti.qty
       FROM transaction_items ti
       JOIN transactions t ON t.id = ti.transaction_id
       WHERE ti.product_id = $1
       ORDER BY t.created_at DESC
       LIMIT 5`,
      [pid]
    )
  ).rows;

  const stokRendah = ['Low', 'Severe', 'Out of Stock'].includes(p.status_stok);

  const info = [
    ['SKU', p.sku],
    ['Kategori', p.kategori],
    ['Harga beli', rp(p.harga_beli)],
    ['Harga jual', rp(p.harga_jual)],
    ['Stok', `${p.stok} ${p.unit}`],
    ['Stok minimum (Severe)', p.stok_minimum],
    ['Stok Low', p.stok_low],
    ['Lokasi rak', p.lokasi_rak],
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/produk" className="text-sm text-blue-600 underline">&larr; Kembali</Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{p.nama}</h1>
        <StockBadge status={p.status_stok} />
      </div>

      <p className="text-gray-700">{p.deskripsi}</p>

      <dl className="grid gap-3 sm:grid-cols-2">
        {info.map(([k, v]) => (
          <div key={k} className="rounded border p-3">
            <dt className="text-xs text-gray-500">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {session.role === 'manager' && stokRendah && (
        <Link
          href={`/restock/baru?produk=${p.id}`}
          className="inline-block rounded bg-orange-600 px-4 py-2 text-white"
        >
          Create Restock Order
        </Link>
      )}

      <section>
        <h2 className="mb-2 text-lg font-bold">Riwayat transaksi (5 terakhir)</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">No. transaksi</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
              {riwayat.map((r) => (
                <tr key={r.no_transaksi} className="border-t">
                  <td className="p-3 font-mono">{r.no_transaksi}</td>
                  <td className="p-3 capitalize">{r.tipe}</td>
                  <td className="p-3">{new Date(r.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="p-3">{r.qty}</td>
                  <td className="p-3">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}