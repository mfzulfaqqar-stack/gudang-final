import Link from 'next/link';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import RestockStatusBadge from '@/app/components/RestockStatusBadge';

export const dynamic = 'force-dynamic';

const STATUSES = ['Pending', 'Confirmed', 'Rejected', 'In Transit', 'Received'];

export default async function RestockPage({ searchParams }) {
  const session = await requireRole(['admin', 'manager', 'supplier']);
  const sp = await searchParams;

  const status = STATUSES.includes(sp.status) ? sp.status : '';
  const q = (sp.q ?? '').trim();

  const where = [];
  const params = [];

  // Supplier hanya melihat order miliknya sendiri (dipaksa di server)
  if (session.role === 'supplier') {
    params.push(session.id);
    where.push(`r.supplier_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`r.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    where.push(`(r.no_po ILIKE $${params.length} OR s.nama ILIKE $${params.length})`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = (
    await query(
      `SELECT r.id, r.no_po, r.tgl_order, r.expected_delivery, r.status,
              s.nama AS supplier_nama,
              (SELECT COUNT(*) FROM restock_items ri WHERE ri.restock_id = r.id)::int AS jml_item
       FROM restock_orders r
       JOIN users s ON s.id = r.supplier_id
       ${whereSql}
       ORDER BY r.id DESC
       LIMIT 200`,
      params
    )
  ).rows;

  return (
    <main className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Restock Order</h1>
        {session.role === 'manager' && (
          <Link href="/restock/baru" className="rounded bg-blue-600 px-4 py-2 text-white">
            + Buat restock order
          </Link>
        )}
      </div>

      <form className="grid gap-2 sm:grid-cols-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nomor PO atau supplier"
          className="rounded border p-2"
        />
        <select name="status" defaultValue={status} className="rounded border p-2">
          <option value="">Semua status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="rounded bg-gray-800 p-2 text-white">Terapkan</button>
      </form>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">No. PO</th>
              <th className="p-3">Supplier</th>
              <th className="p-3">Tanggal order</th>
              <th className="p-3">Expected delivery</th>
              <th className="p-3">Item</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Tidak ada restock order.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-mono">{r.no_po}</td>
                <td className="p-3">{r.supplier_nama}</td>
                <td className="p-3">{new Date(r.tgl_order).toLocaleDateString('id-ID')}</td>
                <td className="p-3">{new Date(r.expected_delivery).toLocaleDateString('id-ID')}</td>
                <td className="p-3">{r.jml_item} produk</td>
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
    </main>
  );
}