import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { updateCategory } from '@/app/actions/categories';
import CategoryForm from '@/app/components/CategoryForm';

export default async function EditKategoriPage({ params }) {
  await requireRole(['admin', 'manager']);
  const { id } = await params;
  const cid = Number(id);
  if (!Number.isInteger(cid)) notFound();

  const kategori = (await query('SELECT * FROM categories WHERE id = $1', [cid])).rows[0];
  if (!kategori) notFound();

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit kategori</h1>
      <CategoryForm action={updateCategory} defaults={kategori} isEdit />
    </main>
  );
}