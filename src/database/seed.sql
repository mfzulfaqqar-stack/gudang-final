-- database/seed.sql
-- Jalankan SETELAH schema.sql. Semua akun berpassword: password123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ USERS ============
-- Admin, Manager, Staff dibuat lewat data awal ini (tidak ada fitur tambah akun)
INSERT INTO users (nama, email, password, role, status_akun) VALUES
('Admin Gudang',      'admin@gudang.com',    crypt('password123', gen_salt('bf', 10)), 'admin',    'Approved'),  -- 1
('Rina Manager',      'manager@gudang.com',  crypt('password123', gen_salt('bf', 10)), 'manager',  'Approved'),  -- 2
('Doni Staff',        'staff@gudang.com',    crypt('password123', gen_salt('bf', 10)), 'staff',    'Approved'),  -- 3
('PT Sumber Makmur',  'sumber@supplier.com', crypt('password123', gen_salt('bf', 10)), 'supplier', 'Approved'),  -- 4
('CV Maju Jaya',      'maju@supplier.com',   crypt('password123', gen_salt('bf', 10)), 'supplier', 'Approved'),  -- 5
('UD Baru Daftar',    'baru@supplier.com',   crypt('password123', gen_salt('bf', 10)), 'supplier', 'Pending'),   -- 6
('PT Ditolak Abadi',  'tolak@supplier.com',  crypt('password123', gen_salt('bf', 10)), 'supplier', 'Rejected');  -- 7

-- ============ CATEGORIES ============
INSERT INTO categories (nama, deskripsi, gambar) VALUES
('Elektronik',        'Perangkat elektronik dan aksesori komputer', NULL),  -- 1
('Alat Tulis',        'Kertas, pulpen, dan perlengkapan kantor',    NULL),  -- 2
('Makanan & Minuman', 'Produk konsumsi dan minuman kemasan',        NULL),  -- 3
('Perkakas',          'Alat kerja dan perkakas tangan',             NULL);  -- 4

-- ============ PRODUCTS ============
-- Kolom: sku, nama, category_id, deskripsi, harga_beli, harga_jual,
--        stok_minimum, stok_low, stok, unit, lokasi_rak, gambar
-- Aturan: stok = 0 Out of Stock | stok <= minimum Severe | stok <= low Low | selain itu Normal
INSERT INTO products
(sku, nama, category_id, deskripsi, harga_beli, harga_jual, stok_minimum, stok_low, stok, unit, lokasi_rak, gambar) VALUES
('ELK-001', 'Mouse Wireless',        1, 'Mouse nirkabel 2.4GHz',            85000,   120000, 10, 20,  50, 'pcs',   'A-01', NULL),  -- 1 Normal
('ELK-002', 'Keyboard Mekanik',      1, 'Keyboard mekanik switch biru',    250000,   350000,  5, 20,  15, 'pcs',   'A-02', NULL),  -- 2 Low
('ELK-003', 'Monitor 24 Inci',       1, 'Monitor IPS Full HD 24 inci',    1200000,  1550000,  5, 10,   4, 'pcs',   'A-03', NULL),  -- 3 Severe
('ATK-001', 'Kertas A4 80gsm',       2, 'Kertas HVS A4 satu rim',           45000,    60000, 20, 50,   0, 'rim',   'B-01', NULL),  -- 4 Out of Stock
('ATK-002', 'Pulpen Hitam',          2, 'Pulpen tinta hitam satu box',      18000,    28000, 30, 60, 120, 'box',   'B-02', NULL),  -- 5 Normal
('MKN-001', 'Air Mineral 600ml',     3, 'Air mineral kemasan satu dus',     38000,    48000, 20, 50,  40, 'dus',   'C-01', NULL),  -- 6 Low
('PRK-001', 'Bor Listrik',           4, 'Bor listrik 500 watt',            320000,   425000,  3,  6,   8, 'pcs',   'D-01', NULL),  -- 7 Normal
('PRK-002', 'Obeng Set',             4, 'Set obeng 12 pcs',                 55000,    85000,  5, 10,   3, 'set',   'D-02', NULL);  -- 8 Severe

-- ============ RESTOCK ORDERS ============
-- Kolom: no_po, supplier_id, manager_id, tgl_order, expected_delivery, catatan, status, catatan_status
INSERT INTO restock_orders
(no_po, supplier_id, manager_id, tgl_order, expected_delivery, catatan, status, catatan_status) VALUES
('PO-20261101-001', 4, 2, CURRENT_DATE - 20, CURRENT_DATE - 10, 'Restock monitor dan kertas', 'Received',   NULL),                       -- 1 (sudah dipakai transaksi masuk)
('PO-20261110-002', 4, 2, CURRENT_DATE - 10, CURRENT_DATE - 3,  'Restock keyboard',          'Received',   NULL),                       -- 2 (siap dibuat transaksi masuk)
('PO-20261120-003', 4, 2, CURRENT_DATE - 2,  CURRENT_DATE + 7,  'Restock obeng set',         'Pending',    NULL),                       -- 3 (menunggu konfirmasi supplier)
('PO-20261118-004', 5, 2, CURRENT_DATE - 5,  CURRENT_DATE + 5,  'Restock air mineral',       'Confirmed',  NULL),                       -- 4
('PO-20261115-005', 4, 2, CURRENT_DATE - 8,  CURRENT_DATE + 2,  'Restock bor listrik',       'In Transit', NULL),                       -- 5
('PO-20261112-006', 5, 2, CURRENT_DATE - 12, CURRENT_DATE - 2,  'Restock pulpen',            'Rejected',   'Stok pulpen sedang kosong di gudang kami.'); -- 6

INSERT INTO restock_items (restock_id, product_id, qty) VALUES
(1, 3, 20), (1, 4, 100),   -- PO 1: monitor, kertas
(2, 2, 30),                -- PO 2: keyboard
(3, 8, 25),                -- PO 3: obeng set
(4, 6, 60),                -- PO 4: air mineral
(5, 7, 10),                -- PO 5: bor listrik
(6, 5, 50);                -- PO 6: pulpen

-- ============ TRANSACTIONS ============
-- Kolom: no_transaksi, tipe, tanggal, restock_id, supplier_id, customer, catatan,
--        status, alasan_tolak, created_by, approved_by
INSERT INTO transactions
(no_transaksi, tipe, tanggal, restock_id, supplier_id, customer, catatan, status, alasan_tolak, created_by, approved_by) VALUES
-- Barang masuk
('TRX-IN-20261105-001', 'masuk',  CURRENT_DATE - 9, 1,    4,    NULL, 'Penerimaan dari PO-20261101-001', 'Approved', NULL, 3, 2),  -- 1
('TRX-IN-20261124-002', 'masuk',  CURRENT_DATE,     NULL, 5,    NULL, 'Penerimaan langsung tanpa PO',    'Pending',  NULL, 3, NULL), -- 2
-- Barang keluar
('TRX-OUT-20261118-001', 'keluar', CURRENT_DATE - 7, NULL, NULL, 'Toko Sinar Jaya', 'Pengiriman rutin',        'Approved', NULL, 3, 2),     -- 3
('TRX-OUT-20261120-002', 'keluar', CURRENT_DATE - 5, NULL, NULL, 'PT Mitra Kantor', 'Pesanan kantor',          'Shipped',  NULL, 3, 2),     -- 4
('TRX-OUT-20261124-003', 'keluar', CURRENT_DATE,     NULL, NULL, 'CV Harapan',      'Menunggu persetujuan',    'Pending',  NULL, 3, NULL),  -- 5
('TRX-OUT-20261122-004', 'keluar', CURRENT_DATE - 3, NULL, NULL, 'Toko Maju',       'Jumlah terlalu besar',    'Rejected', 'Stok tidak mencukupi untuk jumlah yang diminta.', 3, 2); -- 6

INSERT INTO transaction_items (transaction_id, product_id, qty) VALUES
(1, 3, 20), (1, 4, 100),   -- masuk dari PO 1
(2, 6, 30),                -- masuk pending
(3, 1, 10), (3, 5, 20),    -- keluar approved
(4, 5, 40),                -- keluar shipped
(5, 2, 5),                 -- keluar pending
(6, 1, 100);               -- keluar rejected

-- Gambar contoh untuk semua produk (placeholder)
UPDATE products SET gambar = 'https://placehold.co/400x400.png?text=' || sku;