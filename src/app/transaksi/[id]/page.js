import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import {
  approveTransaction,
  rejectTransaction,
  markShipped,
  deleteTransaction,
} from '@/app/actions/transactions';
import ActionForm from '@/app/components/ActionForm';
import TxStatusBadge from '@/app/components/TxStatusBadge';

export const dynamic = 'force-dynamic';

export default async function DetailTransaksiPage({ params }) {
  const session = await requireRole(['admin', 'manager', 'staff']);
  const { id } = await params;
  const tid = Number(id);
  if (!Number.isInteger(tid)) notFound();

  const t = (
    await query(
      `SELECT t.*, uc.nama AS pembuat, ua.nama AS penyetuju,
              s.nama AS supplier_nama, r.no_po
       FROM transactions t
       JOIN users uc ON uc.id = t.created_by
       LEFT JOIN users ua ON ua.id = t.approved_by
       LEFT JOIN users s ON s.id = t.supplier_id
       LEFT JOIN restock_orders r ON r.id = t.restock_id
       WHERE t.id = $1`,
      [tid]
    )
  ).rows[0];
  if (!t) notFound();

  const items = (
    await query(
      `SELECT p.sku, p.nama, p.unit, ti.qty
       FROM transaction_items ti
       JOIN products p ON p.id = ti.product_id
       WHERE ti.transaction_id = $1
       ORDER BY ti.id`,
      [tid]
    )
  ).rows;

  const isManager = session.role === 'manager';
  const isStaff = session.role === 'staff';
  const pending = t.status === 'Pending';
  const canEdit = pending && (isManager || (isStaff && t.created_by === session.id));
  const canShip = isStaff && t.tipe === 'keluar' && t.status === 'Approved';

  const info = [
    ['No. transaksi', t.no_transaksi],
    ['Tipe', t.tipe === 'masuk' ? 'Barang masuk' : 'Barang keluar'],
    ['Tanggal', new Date(t.tanggal).toLocaleDateString('id-ID')],
    [t.tipe === 'masuk' ? 'Supplier' : 'Customer', t.tipe === 'masuk' ? t.supplier_nama ?? '-' : t.customer],
    ...(t.no_po ? [['Nomor PO', t.no_po]] : []),
    ['Dibuat oleh', t.pembuat],
    ...(t.penyetuju
      ? [[t.status === 'Rejected' ? 'Ditolak oleh' : 'Disetujui oleh', t.penyetuju]]
      : []),
    ['Catatan', t.catatan || '-'],
    ...(t.alasan_tolak ? [['Alasan penolakan', t.alasan_tolak]] : []),
  ];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href={`/transaksi?tipe=${t.tipe}`} className="text-sm text-blue-600 underline">
        &larr; Kembali
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Detail transaksi</h1>
        <TxStatusBadge status={t.status} />
      </div>

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

      {(isManager && pending) || canEdit || canShip ? (
        <section className="flex flex-wrap items-start gap-3 rounded border bg-gray-50 p-4">
          {isManager && pending && (
            <>
              <ActionForm
                action={approveTransaction}
                fields={{ id: t.id }}
                label="Approve"
                className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              />
              <ActionForm
                action={rejectTransaction}
                fields={{ id: t.id }}
                label="Reject"
                className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                <input
                  name="alasan"
                  placeholder="Alasan penolakan"
                  className="rounded border p-1 text-sm"
                />
              </ActionForm>
            </>
          )}

          {canShip && (
            <ActionForm action={markShipped} fields={{ id: t.id }} label="Tandai Shipped" />
          )}

          {canEdit && (
            <>
              <Link
                href={`/transaksi/${t.id}/edit`}
                className="rounded border bg-white px-3 py-1 text-sm"
              >
                Edit
              </Link>
              <ActionForm
                action={deleteTransaction}
                fields={{ id: t.id }}
                label="Hapus"
                confirmText="Hapus transaksi ini?"
                className="rounded border border-red-600 bg-white px-3 py-1 text-sm text-red-600 disabled:opacity-50"
              />
            </>
          )}
        </section>
      ) : null}
    </main>
  );
}