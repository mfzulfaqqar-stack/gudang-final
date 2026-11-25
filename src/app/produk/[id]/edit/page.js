import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { updateProduct } from '@/app/actions/products';
import ProductForm from '@/app/components/ProductForm';

export default async function EditProdukPage({ params }) {
  await requireRole(['admin', 'manager']);
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const produk = (await query('SELECT * FROM products WHERE id = $1', [pid])).rows[0];
  if (!produk) notFound();
  const kategori = (await query('SELECT id, nama FROM categories ORDER BY nama')).rows;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit produk</h1>
      <ProductForm action={updateProduct} kategori={kategori} defaults={produk} isEdit />
    </main>
  );
}