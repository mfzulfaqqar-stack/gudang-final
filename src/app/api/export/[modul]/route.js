import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { STATUS_STOK_SQL } from '@/lib/queries';

export const dynamic = 'force-dynamic';

// Hak ekspor sesuai spesifikasi:
// Admin: semua modul | Manager: produk, transaksi, restock | Staff: transaksi miliknya
const MODUL = {
  produk: {
    roles: ['admin', 'manager'],
    build: () => ({
      text: `SELECT p.sku, p.nama, c.nama AS kategori, p.stok, p.unit,
                    ${STATUS_STOK_SQL} AS status_stok, p.stok_minimum, p.stok_low,
                    p.harga_beli, p.harga_jual, p.lokasi_rak
             FROM products p
             JOIN categories c ON c.id = p.category_id
             ORDER BY p.nama`,
      params: [],
    }),
  },
  transaksi: {
    roles: ['admin', 'manager', 'staff'],
    build: (session) => {
      const params = [];
      let where = '';
      // Staff hanya mengekspor transaksi yang dibuatnya sendiri
      if (session.role === 'staff') {
        params.push(session.id);
        where = 'WHERE t.created_by = $1';
      }
      return {
        text: `SELECT t.no_transaksi, t.tipe, t.tanggal, t.status,
                      COALESCE(s.nama, t.customer) AS supplier_customer, r.no_po,
                      p.sku, p.nama AS produk, ti.qty, uc.nama AS dibuat_oleh,
                      t.catatan, t.alasan_tolak
               FROM transactions t
               JOIN transaction_items ti ON ti.transaction_id = t.id
               JOIN products p ON p.id = ti.product_id
               JOIN users uc ON uc.id = t.created_by
               LEFT JOIN users s ON s.id = t.supplier_id
               LEFT JOIN restock_orders r ON r.id = t.restock_id
               ${where}
               ORDER BY t.tanggal DESC, t.id DESC, ti.id`,
        params,
      };
    },
  },
  restock: {
    roles: ['admin', 'manager'],
    build: () => ({
      text: `SELECT r.no_po, s.nama AS supplier, m.nama AS manager, r.tgl_order,
                    r.expected_delivery, r.status, p.sku, p.nama AS produk, ri.qty,
                    r.catatan, r.catatan_status
             FROM restock_orders r
             JOIN users s ON s.id = r.supplier_id
             JOIN users m ON m.id = r.manager_id
             JOIN restock_items ri ON ri.restock_id = r.id
             JOIN products p ON p.id = ri.product_id
             ORDER BY r.id DESC, ri.id`,
      params: [],
    }),
  },
  kategori: {
    roles: ['admin'],
    build: () => ({
      text: `SELECT c.nama, c.deskripsi, COUNT(p.id)::int AS jumlah_produk
             FROM categories c
             LEFT JOIN products p ON p.category_id = c.id
             GROUP BY c.id
             ORDER BY c.nama`,
      params: [],
    }),
  },
  supplier: {
    roles: ['admin'],
    build: () => ({
      text: `SELECT nama, email, status_akun, created_at::date AS tgl_daftar
             FROM users WHERE role = 'supplier' ORDER BY nama`,
      params: [],
    }),
  },
};

function cell(v) {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toLocaleDateString('en-CA') : String(v);
  // Cegah formula injection saat file dibuka di Excel
  if (/^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { modul } = await params;
  const cfg = MODUL[modul];
  if (!cfg) return new Response('Modul tidak ditemukan', { status: 404 });
  if (!cfg.roles.includes(session.role)) return new Response('Forbidden', { status: 403 });

  const { text, params: p } = cfg.build(session);
  const { rows, fields } = await query(text, p);

  const lines = [
    fields.map((f) => cell(f.name)).join(','),
    ...rows.map((r) => fields.map((f) => cell(r[f.name])).join(',')),
  ];
  // BOM agar Excel membaca UTF-8 dengan benar
  const csv = '\uFEFF' + lines.join('\r\n');
  const tanggal = new Date().toLocaleDateString('en-CA');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${modul}-${tanggal}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}