import { notFound, redirect } from 'next/navigation';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { updateTransaction } from '@/app/actions/transactions';
import TransactionForm from '@/app/components/TransactionForm';

export const dynamic = 'force-dynamic';

export default async function EditTransaksiPage({ params }) {
  const session = await requireRole(['staff', 'manager']);
  const { id } = await params;
  const tid = Number(id);
  if (!Number.isInteger(tid)) notFound();

  const t = (
    await query(
      `SELECT t.*, s.nama AS supplier_nama
       FROM transactions t
       LEFT JOIN users s ON s.id = t.supplier_id
       WHERE t.id = $1`,
      [tid]
    )
  ).rows[0];
  if (!t) notFound();

  // Hanya Pending yang boleh diedit; staff hanya miliknya sendiri
  if (t.status !== 'Pending') redirect(`/transaksi/${tid}`);
  if (session.role === 'staff' && t.created_by !== session.id) redirect(`/transaksi/${tid}`);

  const items = (
    await query(
      'SELECT product_id, qty FROM transaction_items WHERE transaction_id = $1 ORDER BY id',
      [tid]
    )
  ).rows;

  const products = (
    await query('SELECT id, sku, nama, unit, stok FROM products ORDER BY nama')
  ).rows;

  const info = [
    ['No. transaksi', t.no_transaksi],
    ['Tipe', t.tipe === 'masuk' ? 'Barang masuk' : 'Barang keluar'],
    ['Tanggal', new Date(t.tanggal).toLocaleDateString('id-ID')],
    [t.tipe === 'masuk' ? 'Supplier' : 'Customer', t.tipe === 'masuk' ? t.supplier_nama ?? '-' : t.customer],
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit transaksi</h1>
      <TransactionForm
        action={updateTransaction}
        tipe={t.tipe}
        products={products}
        defaults={{ id: t.id, catatan: t.catatan, items }}
        isEdit
        info={info}
      />
    </main>
  );
}