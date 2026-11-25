// Status stok dihitung otomatis dari jumlah stok, tidak disimpan sebagai kolom.
// Alias tabel yang dipakai: p = products
export const STATUS_STOK_SQL = `
  CASE
    WHEN p.stok = 0 THEN 'Out of Stock'
    WHEN p.stok <= p.stok_minimum THEN 'Severe'
    WHEN p.stok <= p.stok_low THEN 'Low'
    ELSE 'Normal'
  END
`;

export const STATUS_LIST = ['Out of Stock', 'Severe', 'Low', 'Normal'];

// Dasar query daftar produk. Dibungkus sebagai subquery (alias x) agar
// status_stok bisa dipakai untuk filter dan hitung total.
export const PRODUK_BASE_SQL = `
  SELECT p.id, p.sku, p.nama, p.stok, p.unit, p.lokasi_rak, p.created_at, p.gambar,
         c.id AS category_id, c.nama AS kategori,
         ${STATUS_STOK_SQL} AS status_stok
  FROM products p
  JOIN categories c ON c.id = p.category_id
`;