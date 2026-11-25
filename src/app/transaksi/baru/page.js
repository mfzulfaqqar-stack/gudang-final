import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createTransaction } from '@/app/actions/transactions';
import TransactionForm from '@/app/components/TransactionForm';

export const dynamic = 'force-dynamic';

export default async function BaruTransaksiPage({ searchParams }) {
  await requireRole(['staff']);
  const sp = await searchParams;
  const tipe = sp.tipe === 'keluar' ? 'keluar' : 'masuk';

  const products = (
    await query('SELECT id, sku, nama, unit, stok FROM products ORDER BY nama')
  ).rows;

  let suppliers = [];
  let pos = [];
  if (tipe === 'masuk') {
    suppliers = (
      await query(
        `SELECT id, nama FROM users WHERE role = 'supplier' AND status_akun = 'Approved' ORDER BY nama`
      )
    ).rows;

    // PO berstatus Received yang belum dipakai transaksi masuk aktif
    const poRows = (
      await query(
        `SELECT r.id, r.no_po, r.supplier_id, u.nama AS supplier_nama
         FROM restock_orders r
         JOIN users u ON u.id = r.supplier_id
         WHERE r.status = 'Received'
           AND NOT EXISTS (
             SELECT 1 FROM transactions t
             WHERE t.restock_id = r.id AND t.status <> 'Rejected'
           )
         ORDER BY r.id`
      )
    ).rows;

    const itemRows = (
      await query(
        `SELECT ri.restock_id, ri.product_id, ri.qty, p.sku, p.nama, p.unit
         FROM restock_items ri
         JOIN products p ON p.id = ri.product_id
         WHERE ri.restock_id = ANY($1::int[])
         ORDER BY ri.id`,
        [poRows.map((r) => r.id)]
      )
    ).rows;

    pos = poRows.map((r) => ({
      ...r,
      items: itemRows.filter((i) => i.restock_id === r.id),
    }));
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">
        {tipe === 'masuk' ? 'Barang masuk baru' : 'Barang keluar baru'}
      </h1>
      <TransactionForm
        key={tipe}
        action={createTransaction}
        tipe={tipe}
        products={products}
        suppliers={suppliers}
        pos={pos}
        defaults={{ tanggal: new Date().toLocaleDateString('en-CA') }}
      />
    </main>
  );
}