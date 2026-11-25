import Link from 'next/link';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import TxStatusBadge from '@/app/components/TxStatusBadge';
import ExportButton from '@/app/components/ExportButton';

export const dynamic = 'force-dynamic';

const STATUSES = ['Pending', 'Approved', 'Rejected', 'Shipped'];
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v ?? '');

export default async function TransaksiPage({ searchParams }) {
  const session = await requireRole(['admin', 'manager', 'staff']);
  const sp = await searchParams;

  const tipe = sp.tipe === 'keluar' ? 'keluar' : 'masuk';
  const statusOpts = tipe === 'keluar' ? STATUSES : STATUSES.filter((s) => s !== 'Shipped');
  const status = statusOpts.includes(sp.status) ? sp.status : '';
  const dari = isDate(sp.dari) ? sp.dari : '';
  const sampai = isDate(sp.sampai) ? sp.sampai : '';
  const q = (sp.q ?? '').trim();

  const where = ['t.tipe = $1'];
  const params = [tipe];
  if (status) {
    params.push(status);
    where.push(`t.status = $${params.length}`);
  }
  if (dari) {
    params.push(dari);
    where.push(`t.tanggal >= $${params.length}`);
  }
  if (sampai) {
    params.push(sampai);
    where.push(`t.tanggal <= $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    where.push(`(s.nama ILIKE $${params.length} OR t.customer ILIKE $${params.length})`);
  }

  const rows = (
    await query(
      `SELECT t.id, t.no_transaksi, t.tanggal, t.status, t.customer,
              s.nama AS supplier_nama, uc.nama AS pembuat,
              (SELECT COUNT(*) FROM transaction_items ti WHERE ti.transaction_id = t.id)::int AS jml_item
       FROM transactions t
       LEFT JOIN users s ON s.id = t.supplier_id
       JOIN users uc ON uc.id = t.created_by
       WHERE ${where.join(' AND ')}
       ORDER BY t.tanggal DESC, t.id DESC
       LIMIT 200`,
      params
    )
  ).rows;

  const tab = (t, label) => (
    <Link
      href={`/transaksi?tipe=${t}`}
      className={`rounded-t border px-4 py-2 text-sm ${
        tipe === t ? 'border-b-white bg-white font-semibold' : 'bg-gray-50 text-gray-600'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <main className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Transaksi</h1>
        <div className="flex flex-wrap gap-2">
          <ExportButton modul="transaksi" />
          {session.role === 'staff' && (
            <>
              <Link href="/transaksi/baru?tipe=masuk" className="rounded bg-blue-600 px-4 py-2 text-white">
                + Barang masuk
              </Link>
              <Link href="/transaksi/baru?tipe=keluar" className="rounded bg-green-600 px-4 py-2 text-white">
                + Barang keluar
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        {tab('masuk', 'Barang Masuk')}
        {tab('keluar', 'Barang Keluar')}
      </div>

      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input type="hidden" name="tipe" value={tipe} />
        <input
          name="q"
          defaultValue={q}
          placeholder={tipe === 'masuk' ? 'Cari supplier' : 'Cari customer'}
          className="rounded border p-2"
        />
        <select name="status" defaultValue={status} className="rounded border p-2">
          <option value="">Semua status</option>
          {statusOpts.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input type="date" name="dari" defaultValue={dari} className="rounded border p-2" />
        <input type="date" name="sampai" defaultValue={sampai} className="rounded border p-2" />
        <button className="rounded bg-gray-800 p-2 text-white">Terapkan</button>
      </form>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">No. transaksi</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">{tipe === 'masuk' ? 'Supplier' : 'Customer'}</th>
              <th className="p-3">Item</th>
              <th className="p-3">Status</th>
              <th className="p-3">Dibuat oleh</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Tidak ada transaksi.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-mono">{t.no_transaksi}</td>
                <td className="p-3">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                <td className="p-3">{tipe === 'masuk' ? t.supplier_nama ?? '-' : t.customer}</td>
                <td className="p-3">{t.jml_item} produk</td>
                <td className="p-3"><TxStatusBadge status={t.status} /></td>
                <td className="p-3">{t.pembuat}</td>
                <td className="p-3">
                  <Link href={`/transaksi/${t.id}`} className="text-blue-600 underline">
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