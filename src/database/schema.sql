DROP TABLE IF EXISTS reviews, loans, announcements, books CASCADE;
DROP TABLE IF EXISTS transaction_items, transactions, restock_items,
                     restock_orders, products, categories, users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','manager','staff','supplier')),
  status_akun VARCHAR(20) NOT NULL DEFAULT 'Approved'
    CHECK (status_akun IN ('Pending','Approved','Rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  deskripsi TEXT,
  gambar TEXT
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  nama VARCHAR(150) NOT NULL,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  deskripsi TEXT NOT NULL,
  harga_beli NUMERIC(14,2) NOT NULL CHECK (harga_beli >= 0),
  harga_jual NUMERIC(14,2) NOT NULL CHECK (harga_jual >= 0),
  stok_minimum INT NOT NULL CHECK (stok_minimum >= 0),
  stok_low INT NOT NULL,
  stok INT NOT NULL CHECK (stok >= 0),
  unit VARCHAR(20) NOT NULL,
  lokasi_rak VARCHAR(50) NOT NULL,
  gambar TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (stok_low > stok_minimum)
);

CREATE TABLE restock_orders (
  id SERIAL PRIMARY KEY,
  no_po VARCHAR(30) NOT NULL UNIQUE,
  supplier_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  manager_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  tgl_order DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery DATE NOT NULL,
  catatan TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Confirmed','Rejected','In Transit','Received')),
  catatan_status TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE restock_items (
  id SERIAL PRIMARY KEY,
  restock_id INT NOT NULL REFERENCES restock_orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0)
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  no_transaksi VARCHAR(30) NOT NULL UNIQUE,
  tipe VARCHAR(10) NOT NULL CHECK (tipe IN ('masuk','keluar')),
  tanggal DATE NOT NULL,
  restock_id INT REFERENCES restock_orders(id) ON DELETE RESTRICT,
  supplier_id INT REFERENCES users(id) ON DELETE RESTRICT,
  customer VARCHAR(150),
  catatan TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Approved','Rejected','Shipped')),
  alasan_tolak TEXT,
  created_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by INT REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0)
);

-- Satu Restock Order hanya boleh dipakai satu transaksi masuk yang belum Rejected
CREATE UNIQUE INDEX uq_restock_transaksi_aktif
  ON transactions (restock_id)
  WHERE restock_id IS NOT NULL AND status <> 'Rejected';