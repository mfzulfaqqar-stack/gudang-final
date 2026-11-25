import Link from 'next/link';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { confirmRestock, rejectRestock } from '@/app/actions/restock';
import ActionForm from '@/app/components/ActionForm';
import StatCard from '@/app/components/StatCard';
import TxStatusBadge from '@/app/components/TxStatusBadge';

export const dynamic = 'force-dynamic';

export default async function SupplierPage() {
  const session = await requireRole(['supplier']);

  const perlu = (
    await query(
      `SELECT r.id, r.no_po, r.tgl_order, r.expected_delivery,
              (SELECT COUNT(*) FROM restock_items ri WHERE ri.restock_id = r.id)::int AS jml_item
       FROM restock_orders r
       WHERE r.supplier_id = $1 AND r.status = 'Pending'
       ORDER BY r.id`,
      [session.id]
    )
  ).rows;

  const ringkas = Object.fromEntries(
    (
      await query(
        `SELECT status, COUNT(*)::int AS n FROM restock_orders
         WHERE supplier_id = $1 GROUP BY status`,
        [session.id]
      )
    ).rows.map((r) => [r.status, r.n])
  );

  // Riwayat pengiriman ke gudang: transaksi barang masuk dari supplier ini
  const riwayat = (
    await query(
      `SELECT t.id, t.no_transaksi, t.tanggal, t.status, r.no_po,
              (SELECT COALESCE(SUM(ti.qty), 0) FROM transaction_items ti
                 WHERE ti.transaction_id = t.id)::int AS total_qty
       FROM transactions t
       LEFT JOIN restock_orders r ON r.id = t.restock_id
       WHERE t.supplier_id = $1 AND t.tipe = 'masuk'
       ORDER BY t.tanggal DESC, t.id DESC
       LIMIT 10`,
      [session.id]
    )
  ).rows;

  return (
    <main className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Supplier</h1>
        <p className="text-sm text-gray-600">Selamat datang, {session.nama}.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Perlu dikonfirmasi"
          value={ringkas.Pending ?? 0}
          tone={ringkas.Pending ? 'warn' : 'default'}
        />
        <StatCard label="Confirmed" value={ringkas.Confirmed ?? 0} />
        <StatCard label="In Transit" value={ringkas['In Transit'] ?? 0} />
        <StatCard label="Received" value={ringkas.Received ?? 0} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Restock order yang perlu dikonfirmasi</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">No. PO</th>
                <th className="p-3">Tanggal order</th>
                <th className="p-3">Expected delivery</th>
                <th className="p-3">Item</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {perlu.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Tidak ada order yang menunggu konfirmasi.
                  </td>
                </tr>
              )}
              {perlu.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3 font-mono">
                    <Link href={`/restock/${r.id}`} className="text-blue-600 underline">
                      {r.no_po}
                    </Link>
                  </td>
                  <td className="p-3">{new Date(r.tgl_order).toLocaleDateString('id-ID')}</td>
                  <td className="p-3">{new Date(r.expected_delivery).toLocaleDateString('id-ID')}</td>
                  <td className="p-3">{r.jml_item} produk</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-start gap-2">
                      <ActionForm
                        action={confirmRestock}
                        fields={{ id: r.id }}
                        label="Konfirmasi"
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                      />
                      <ActionForm
                        action={rejectRestock}
                        fields={{ id: r.id }}
                        label="Tolak"
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                      >
                        <input
                          name="catatan_status"
                          placeholder="Alasan penolakan"
                          className="rounded border p-1 text-sm"
                        />
                      </ActionForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Riwayat pengiriman ke gudang</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">No. transaksi</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">No. PO</th>
                <th className="p-3">Total qty</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Belum ada riwayat pengiriman.
                  </td>
                </tr>
              )}
              {riwayat.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3 font-mono">{t.no_transaksi}</td>
                  <td className="p-3">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                  <td className="p-3 font-mono">{t.no_po ?? '-'}</td>
                  <td className="p-3">{t.total_qty}</td>
                  <td className="p-3"><TxStatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Status Approved berarti barang sudah diterima dan stok gudang sudah diperbarui.
        </p>
      </section>
    </main>
  );
}