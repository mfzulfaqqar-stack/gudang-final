import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createRestock } from '@/app/actions/restock';
import RestockForm from '@/app/components/RestockForm';

export const dynamic = 'force-dynamic';

export default async function BaruRestockPage({ searchParams }) {
  await requireRole(['manager']);
  const sp = await searchParams;

  const products = (
    await query('SELECT id, sku, nama, unit, stok FROM products ORDER BY nama')
  ).rows;
  const suppliers = (
    await query(
      `SELECT id, nama FROM users WHERE role = 'supplier' AND status_akun = 'Approved' ORDER BY nama`
    )
  ).rows;

  // Prefill dari halaman detail produk (?produk=ID), hanya jika produknya ada
  const pid = Number(sp.produk);
  const items =
    Number.isInteger(pid) && products.some((p) => p.id === pid)
      ? [{ product_id: String(pid), qty: '' }]
      : [];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Buat restock order</h1>
      <RestockForm
        action={createRestock}
        products={products}
        suppliers={suppliers}
        defaults={{ tgl_order: new Date().toLocaleDateString('en-CA'), items }}
      />
    </main>
  );
}