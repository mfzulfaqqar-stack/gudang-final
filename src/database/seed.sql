-- database/seed.sql
-- Jalankan SETELAH schema.sql. Semua akun berpassword: password123
-- Id bergantung pada tabel yang baru dibuat (SERIAL mulai dari 1).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ USERS (id 1-5) ============
INSERT INTO users (nama, email, password, role, nim) VALUES
('Admin Utama',     'admin@kampus.ac.id',   crypt('password123', gen_salt('bf', 10)), 'admin',     'ADM001'),
('Pegawai Satu',    'pegawai@kampus.ac.id', crypt('password123', gen_salt('bf', 10)), 'pegawai',   'PEG001'),
('Budi Santoso',    'budi@kampus.ac.id',    crypt('password123', gen_salt('bf', 10)), 'mahasiswa', '2024001'),
('Siti Aminah',     'siti@kampus.ac.id',    crypt('password123', gen_salt('bf', 10)), 'mahasiswa', '2024002'),
('Andi Pratama',    'andi@kampus.ac.id',    crypt('password123', gen_salt('bf', 10)), 'mahasiswa', '2024003');

-- ============ CATEGORIES (id 1-4) ============
INSERT INTO categories (nama, kode, deskripsi) VALUES
('Teknologi Informasi', 'TI',  'Buku pemrograman, basis data, dan ilmu komputer'),
('Hukum',               'HK',  'Buku hukum dan perundang-undangan'),
('Sastra & Bahasa',     'SB',  'Novel, sastra, dan buku kebahasaan'),
('Kedokteran',          'KD',  'Buku ilmu kedokteran dan kesehatan');

-- ============ BOOKS (id 1-9) ============
-- stok_tersedia = stok_total dikurangi jumlah loan berstatus 'dipinjam'
-- (cover_url dikosongkan; buat fallback gambar di UI)
INSERT INTO books
(isbn, judul, penulis, penerbit, tahun, category_id, stok_total, stok_tersedia, maks_hari_pinjam, denda_per_hari, cover_url) VALUES
('978-0-13-235088-4', 'Clean Code',                                  'Robert C. Martin',     'Prentice Hall',  2008, 1, 5, 4, 14, 1000, NULL),
('978-0-26-204630-5', 'Introduction to Algorithms',                  'Thomas H. Cormen',     'MIT Press',      2009, 1, 3, 3, 14, 1000, NULL),
('978-1-26-084512-3', 'Database System Concepts',                    'Abraham Silberschatz', 'McGraw-Hill',    2019, 1, 4, 3, 14, 1000, NULL),
('978-0-59-651774-8', 'JavaScript: The Good Parts',                  'Douglas Crockford',    'O''Reilly',      2008, 1, 3, 3,  7, 1500, NULL),
('978-979-99-1234-1', 'Pengantar Ilmu Hukum',                        'Peter Mahmud Marzuki', 'Kencana',        2008, 2, 3, 3, 14, 1000, NULL),
('978-979-30-6270-1', 'Laskar Pelangi',                              'Andrea Hirata',        'Bentang Pustaka',2005, 3, 4, 3, 10,  500, NULL),
('978-979-97-3001-2', 'Bumi Manusia',                                'Pramoedya Ananta Toer','Hasta Mitra',    1980, 3, 3, 3, 10,  500, NULL),
('978-0-32-359712-9', 'Guyton and Hall Textbook of Medical Physiology','John E. Hall',        'Elsevier',       2020, 4, 2, 2, 14, 2000, NULL),
('978-1-25-945620-1', 'Basic and Clinical Pharmacology',             'Bertram G. Katzung',   'McGraw-Hill',    2017, 4, 2, 2, 14, 2000, NULL);

-- ============ LOANS (id 1-9) ============
-- Tanggal relatif terhadap hari ini, jadi data keterlambatan selalu valid.
INSERT INTO loans
(user_id, book_id, status, perpanjangan, status_denda, alasan_tolak, tgl_pengajuan, tgl_pinjam, jatuh_tempo, tgl_kembali) VALUES
-- 1: Budi, selesai tepat waktu
(3, 1, 'selesai',  NULL,        'tidak_ada',  NULL, NOW() - INTERVAL '31 days', CURRENT_DATE - 30, CURRENT_DATE - 16, CURRENT_DATE - 18),
-- 2: Budi, selesai terlambat 6 hari, denda sudah lunas
(3, 2, 'selesai',  NULL,        'lunas',      NULL, NOW() - INTERVAL '41 days', CURRENT_DATE - 40, CURRENT_DATE - 26, CURRENT_DATE - 20),
-- 3: Siti, sedang dipinjam, belum jatuh tempo
(4, 1, 'dipinjam', NULL,        'tidak_ada',  NULL, NOW() - INTERVAL '6 days',  CURRENT_DATE - 5,  CURRENT_DATE + 9,  NULL),
-- 4: Siti, sedang dipinjam, mengajukan perpanjangan
(4, 6, 'dipinjam', 'diajukan',  'tidak_ada',  NULL, NOW() - INTERVAL '11 days', CURRENT_DATE - 10, CURRENT_DATE + 0,  NULL),
-- 5: Andi, sedang dipinjam, SUDAH TERLAMBAT 6 hari (denda dihitung runtime)
(5, 3, 'dipinjam', NULL,        'tidak_ada',  NULL, NOW() - INTERVAL '21 days', CURRENT_DATE - 20, CURRENT_DATE - 6,  NULL),
-- 6: Andi, selesai terlambat 6 hari, denda TERTUNGGAK (memblokir pinjam baru)
(5, 4, 'selesai',  NULL,        'tertunggak', NULL, NOW() - INTERVAL '46 days', CURRENT_DATE - 45, CURRENT_DATE - 38, CURRENT_DATE - 32),
-- 7: Budi, menunggu konfirmasi (muncul di antrean Pegawai)
(3, 6, 'menunggu', NULL,        'tidak_ada',  NULL, NOW(),                      NULL,              NULL,              NULL),
-- 8: Siti, ditolak
(4, 7, 'ditolak',  NULL,        'tidak_ada',  'Stok sedang dalam proses inventarisasi.', NOW() - INTERVAL '3 days', NULL, NULL, NULL),
-- 9: Siti, selesai
(4, 2, 'selesai',  NULL,        'tidak_ada',  NULL, NOW() - INTERVAL '26 days', CURRENT_DATE - 25, CURRENT_DATE - 11, CURRENT_DATE - 13);

-- ============ REVIEWS ============
-- Hanya untuk loan berstatus 'selesai', milik user dan buku yang sama
INSERT INTO reviews (user_id, book_id, loan_id, rating, komentar) VALUES
(3, 1, 1, 5, 'Bukunya jelas dan contoh kodenya mudah dipahami.'),
(3, 2, 2, 4, 'Materinya lengkap tetapi cukup berat untuk pemula.'),
(4, 2, 9, 5, 'Referensi wajib untuk mata kuliah algoritma.');

-- ============ ANNOUNCEMENTS ============
INSERT INTO announcements (judul, konten, kategori, tgl_rilis, status, author_id) VALUES
('Jadwal Libur Layanan Akhir Tahun',
 'Perpustakaan tutup pada 24 Desember 2026 sampai 2 Januari 2027. Layanan normal kembali pada 3 Januari 2027.',
 'Operasional', '2026-11-20', 'Published', 2),
('Pengadaan Buku Baru Semester Genap',
 'Koleksi buku Teknologi Informasi dan Kedokteran telah ditambah. Silakan telusuri katalog untuk melihat judul terbaru.',
 'Layanan', '2026-11-22', 'Published', 2),
('Rencana Bedah Buku',
 'Detail acara bedah buku akan diumumkan menyusul.',
 'Acara', '2026-12-01', 'Draft', 2);