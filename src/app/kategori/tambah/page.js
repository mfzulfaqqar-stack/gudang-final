import { requireRole } from '@/lib/auth';
import { createCategory } from '@/app/actions/categories';
import CategoryForm from '@/app/components/CategoryForm';

export default async function TambahKategoriPage() {
  await requireRole(['admin', 'manager']);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Tambah kategori</h1>
      <CategoryForm action={createCategory} />
    </main>
  );
}