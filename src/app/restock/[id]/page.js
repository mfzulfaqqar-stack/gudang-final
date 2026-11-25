import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { confirmRestock, rejectRestock, advanceRestock } from '@/app/actions/restock';
import ActionForm from '@/app/components/ActionForm';
import RestockStatusBadge from '@/app/components/RestockStatusBadge';
import RestockTimeline from '@/app/components/RestockTimeline';

export const dynamic = 'force-dynamic';

export default async function DetailRestockPage({ params }) {
  const session = await requireRole(['admin', 'manager', 'supplier']);
  const { id } = await params;
  const rid = Number(id);
  if (!Number.isInteger(rid)) notFound();

  const r = (
    await query(
      `SELECT r.*, s.nama AS supplier_nama, m.nama AS manager_nama
       FROM restock_orders r
       JOIN users s ON s.id = r.supplier_id
       JOIN users m ON m.id = r.manager_id
       WHERE r.id = $1`,
      [rid]
    )
  ).rows[0];
  if (!r) notFound();

  // Supplier tidak boleh melihat order milik supplier lain
  if (session.role === 'supplier' && r.supplier_id !== session.id) notFound();

  const items = (
    await query(
      `SELECT p.sku, p.nama, p.unit, ri.qty
       FROM restock_items ri
       JOIN products p ON p.id = ri.product_id
       WHERE ri.restock_id = $1
       ORDER BY ri.id`,
      [rid]
    )
  ).rows;

  // Transaksi masuk (belum Rejected) yang memakai PO ini
  const trx = (
    await query(
      `SELECT id, no_transaksi, status FROM transactions
       WHERE restock_id = $1 AND status <> 'Rejected'`,
      [rid]
    )
  ).rows[0];

  const isManager = session.role === 'manager';
  const isSupplier = session.role === 'supplier';

  const info = [
    ['Nomor PO', r.no_po],
    ['Supplier', r.supplier_nama],
    ['Dibuat oleh', r.manager_nama],
    ['Tanggal order', new Date(r.tgl_order).toLocaleDateString('id-ID')],
    ['Expected delivery', new Date(r.expected_delivery).toLocaleDateString('id-ID')],
    ['Catatan', r.catatan || '-'],
    ...(r.catatan_status ? [['Catatan status', r.catatan_status]] : []),
  ];

  const showActions =
    (isSupplier && r.status === 'Pending') ||
    (isManager && ['Confirmed', 'In Transit'].includes(r.status));

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/restock" className="text-sm text-blue-600 underline">&larr; Kembali</Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Restock order</h1>
        <RestockStatusBadge status={r.status} />
      </div>

      <RestockTimeline status={r.status} />

      <dl className="grid gap-3 sm:grid-cols-2">
        {info.map(([k, v]) => (
          <div key={k} className="rounded border p-3">
            <dt className="text-xs text-gray-500">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="mb-2 text-lg font-bold">Produk</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Produk</th>
                <th className="p-3">Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.sku} className="border-t">
                  <td className="p-3 font-mono">{it.sku}</td>
                  <td className="p-3">{it.nama}</td>
                  <td className="p-3">{it.qty} {it.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showActions && (
        <section className="flex flex-wrap items-start gap-3 rounded border bg-gray-50 p-4">
          {isSupplier && r.status === 'Pending' && (
            <>
              <ActionForm
                action={confirmRestock}
                fields={{ id: r.id }}
                label="Konfirmasi order"
                className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              />
              <ActionForm
                action={rejectRestock}
                fields={{ id: r.id }}
                label="Tolak order"
                className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                <input
                  name="catatan_status"
                  placeholder="Alasan penolakan"
                  className="rounded border p-1 text-sm"
                />
              </ActionForm>
            </>
          )}

          {isManager && r.status === 'Confirmed' && (
            <ActionForm
              action={advanceRestock}
              fields={{ id: r.id, status: 'In Transit' }}
              label="Tandai In Transit"
            />
          )}

          {isManager && r.status === 'In Transit' && (
            <ActionForm
              action={advanceRestock}
              fields={{ id: r.id, status: 'Received' }}
              label="Tandai Received"
              confirmText="Tandai order ini sudah diterima gudang?"
              className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
            />
          )}
        </section>
      )}

      {r.status === 'Received' && (
        <p className="rounded border bg-blue-50 p-3 text-sm text-blue-800">
          {trx ? (
            <>
              Barang masuk sudah dicatat pada transaksi{' '}
              <Link href={`/transaksi/${trx.id}`} className="font-mono underline">
                {trx.no_transaksi}
              </Link>{' '}
              ({trx.status}). Stok bertambah setelah transaksi di-approve Manager.
            </>
          ) : (
            'Staff gudang dapat membuat transaksi barang masuk dari PO ini. Stok bertambah setelah transaksi di-approve Manager.'
          )}
        </p>
      )}
    </main>
  );
}