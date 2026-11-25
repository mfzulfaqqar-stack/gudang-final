import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createProduct } from '@/app/actions/products';
import ProductForm from '@/app/components/ProductForm';

export default async function TambahProdukPage() {
  await requireRole(['admin', 'manager']);
  const kategori = (await query('SELECT id, nama FROM categories ORDER BY nama')).rows;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Tambah produk</h1>
      <ProductForm action={createProduct} kategori={kategori} />
    </main>
  );
}