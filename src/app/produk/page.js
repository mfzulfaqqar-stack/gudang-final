import Link from 'next/link';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { PRODUK_BASE_SQL, STATUS_LIST } from '@/lib/queries';
import StockBadge from '@/app/components/StockBadge';
import DeleteProductButton from '@/app/components/DeleteProductButton';

export const dynamic = 'force-dynamic';

const PER_PAGE = 10;

// Whitelist: nama kolom ORDER BY tidak bisa dijadikan parameter ($n)
const SORT = {
  nama: 'x.nama ASC',
  stok_asc: 'x.stok ASC',
  stok_desc: 'x.stok DESC',
  terbaru: 'x.created_at DESC',
};

export default async function ProdukPage({ searchParams }) {
  const session = await requireRole(['admin', 'manager', 'staff']);
  const canEdit = ['admin', 'manager'].includes(session.role);

  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const kategori = Number(sp.kategori);
  const status = STATUS_LIST.includes(sp.status) ? sp.status : '';
  const sort = SORT[sp.sort] ? sp.sort : 'nama';
  const page = Math.max(1, Number(sp.page) || 1);

  const where = [];
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    where.push(`(x.nama ILIKE $${params.length} OR x.sku ILIKE $${params.length})`);
  }
  if (Number.isInteger(kategori) && kategori > 0) {
    params.push(kategori);
    where.push(`x.category_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`x.status_stok = $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = (
    await query(`SELECT COUNT(*)::int AS n FROM (${PRODUK_BASE_SQL}) x ${whereSql}`, params)
  ).rows[0].n;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const current = Math.min(page, totalPages);

  const rows = (
    await query(
      `SELECT * FROM (${PRODUK_BASE_SQL}) x ${whereSql}
       ORDER BY ${SORT[sort]}, x.id
       LIMIT ${PER_PAGE} OFFSET ${(current - 1) * PER_PAGE}`,
      params
    )
  ).rows;

  const kategoriList = (await query('SELECT id, nama FROM categories ORDER BY nama')).rows;

  // Link pagination yang mempertahankan filter
  const linkTo = (p) => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (kategori) u.set('kategori', kategori);
    if (status) u.set('status', status);
    if (sort !== 'nama') u.set('sort', sort);
    u.set('page', p);
    return `/produk?${u}`;
  };

  return (
    <main className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Produk</h1>
        {canEdit && (
          <Link href="/produk/tambah" className="rounded bg-blue-600 px-4 py-2 text-white">
            + Tambah produk
          </Link>
        )}
      </div>

      {/* Form GET: filter tersimpan di URL */}
      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama atau SKU"
          className="rounded border p-2 lg:col-span-2"
        />
        <select name="kategori" defaultValue={kategori || ''} className="rounded border p-2">
          <option value="">Semua kategori</option>
          {kategoriList.map((k) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="rounded border p-2">
          <option value="">Semua status stok</option>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className="rounded border p-2">
          <option value="nama">Urut: Nama</option>
          <option value="stok_asc">Urut: Stok terendah</option>
          <option value="stok_desc">Urut: Stok tertinggi</option>
          <option value="terbaru">Urut: Terbaru ditambahkan</option>
        </select>
        <button className="rounded bg-gray-800 p-2 text-white sm:col-span-2 lg:col-span-5">
          Terapkan
        </button>
      </form>

      <div className="overflow-x-auto rounded border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">SKU</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Stok</th>
              <th className="p-3">Status</th>
              <th className="p-3">Rak</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Tidak ada produk.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-mono">{p.sku}</td>
                <td className="p-3">{p.nama}</td>
                <td className="p-3">{p.kategori}</td>
                <td className="p-3">{p.stok} {p.unit}</td>
                <td className="p-3"><StockBadge status={p.status_stok} /></td>
                <td className="p-3">{p.lokasi_rak}</td>
                <td className="flex flex-wrap items-start gap-3 p-3">
                  <Link href={`/produk/${p.id}`} className="text-blue-600 underline">
                    Detail
                  </Link>
                  {canEdit && (
                    <>
                      <Link href={`/produk/${p.id}/edit`} className="text-blue-600 underline">
                        Edit
                      </Link>
                      <DeleteProductButton id={p.id} nama={p.nama} stok={p.stok} />
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>{total} produk. Halaman {current} dari {totalPages}</span>
        <div className="flex gap-2">
          {current > 1 && (
            <Link href={linkTo(current - 1)} className="rounded border px-3 py-1">
              Sebelumnya
            </Link>
          )}
          {current < totalPages && (
            <Link href={linkTo(current + 1)} className="rounded border px-3 py-1">
              Berikutnya
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}