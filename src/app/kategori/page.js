import Link from 'next/link';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { deleteCategory } from '@/app/actions/categories';
import ActionForm from '@/app/components/ActionForm';

export const dynamic = 'force-dynamic';

export default async function KategoriPage() {
  await requireRole(['admin', 'manager']);

  const rows = (
    await query(
      `SELECT c.id, c.nama, c.deskripsi, c.gambar, COUNT(p.id)::int AS jml_produk
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.nama`
    )
  ).rows;

  return (
    <main className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kategori</h1>
        <Link href="/kategori/tambah" className="rounded bg-blue-600 px-4 py-2 text-white">
          + Tambah kategori
        </Link>
      </div>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Gambar</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Deskripsi</th>
              <th className="p-3">Produk</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Belum ada kategori.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-t align-top">
                <td className="p-3">
                  {c.gambar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.gambar} alt={c.nama} className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                      -
                    </div>
                  )}
                </td>
                <td className="p-3 font-medium">{c.nama}</td>
                <td className="p-3">{c.deskripsi}</td>
                <td className="p-3">{c.jml_produk}</td>
                <td className="p-3">
                  <div className="flex flex-wrap items-start gap-3">
                    <Link href={`/kategori/${c.id}/edit`} className="text-blue-600 underline">
                      Edit
                    </Link>
                    <ActionForm
                      action={deleteCategory}
                      fields={{ id: c.id }}
                      label="Hapus"
                      confirmText={`Hapus kategori "${c.nama}"?`}
                      className="text-sm text-red-600 underline disabled:opacity-50"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}