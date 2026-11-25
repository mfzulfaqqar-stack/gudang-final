import Link from 'next/link';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { getTransactionFormData } from '@/lib/formData';
import { createTransaction } from '@/app/actions/transactions';
import TransactionForm from '@/app/components/TransactionForm';
import TxStatusBadge from '@/app/components/TxStatusBadge';

export const dynamic = 'force-dynamic';

export default async function StaffPage({ searchParams }) {
  const session = await requireRole(['staff']);
  const sp = await searchParams;
  const tipe = sp.tipe === 'keluar' ? 'keluar' : 'masuk';

  const { products, suppliers, pos } = await getTransactionFormData(tipe);

  const hariIni = (
    await query(
      `SELECT t.id, t.no_transaksi, t.tipe, t.status,
              COALESCE(s.nama, t.customer) AS pihak, uc.nama AS pembuat
       FROM transactions t
       LEFT JOIN users s ON s.id = t.supplier_id
       JOIN users uc ON uc.id = t.created_by
       WHERE t.tanggal = CURRENT_DATE
       ORDER BY t.id DESC`
    )
  ).rows;

  const tab = (t, label) => (
    <Link
      href={`/staff?tipe=${t}`}
      className={`rounded-t border px-4 py-2 text-sm ${
        tipe === t ? 'border-b-white bg-white font-semibold' : 'bg-gray-50 text-gray-600'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Staff Gudang</h1>
        <p className="text-sm text-gray-600">Selamat datang, {session.nama}.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-bold">Quick entry transaksi</h2>
          <div className="mb-3 flex gap-1">
            {tab('masuk', 'Barang Masuk')}
            {tab('keluar', 'Barang Keluar')}
          </div>
          <div className="rounded border p-4">
            <TransactionForm
              key={tipe}
              action={createTransaction}
              tipe={tipe}
              products={products}
              suppliers={suppliers}
              pos={pos}
              defaults={{ tanggal: new Date().toLocaleDateString('en-CA') }}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold">Transaksi hari ini ({hariIni.length})</h2>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">No. transaksi</th>
                  <th className="p-3">Tipe</th>
                  <th className="p-3">Supplier / Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {hariIni.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      Belum ada transaksi hari ini.
                    </td>
                  </tr>
                )}
                {hariIni.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3 font-mono">{t.no_transaksi}</td>
                    <td className="p-3 capitalize">{t.tipe}</td>
                    <td className="p-3">{t.pihak ?? '-'}</td>
                    <td className="p-3"><TxStatusBadge status={t.status} /></td>
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
        </section>
      </div>
    </main>
  );
}