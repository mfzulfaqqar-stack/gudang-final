DROP TABLE IF EXISTS reviews, loans, announcements, books, categories, users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','pegawai','mahasiswa')),
  nim VARCHAR(30) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  kode VARCHAR(20) NOT NULL UNIQUE,
  deskripsi TEXT
);

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  isbn VARCHAR(20) NOT NULL UNIQUE,
  judul VARCHAR(200) NOT NULL,
  penulis VARCHAR(150) NOT NULL,
  penerbit VARCHAR(150) NOT NULL,
  tahun INT NOT NULL,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  stok_total INT NOT NULL CHECK (stok_total >= 0),
  stok_tersedia INT NOT NULL CHECK (stok_tersedia >= 0),
  maks_hari_pinjam INT NOT NULL CHECK (maks_hari_pinjam > 0),
  denda_per_hari INT NOT NULL CHECK (denda_per_hari >= 0),
  cover_url TEXT
);

CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  book_id INT NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'menunggu'
    CHECK (status IN ('menunggu','dipinjam','ditolak','selesai')),
  perpanjangan VARCHAR(30)
    CHECK (perpanjangan IN ('diajukan','disetujui','ditolak')),
  status_denda VARCHAR(20) NOT NULL DEFAULT 'tidak_ada'
    CHECK (status_denda IN ('tidak_ada','tertunggak','lunas')),
  alasan_tolak TEXT,
  tgl_pengajuan TIMESTAMP NOT NULL DEFAULT NOW(),
  tgl_pinjam DATE,
  jatuh_tempo DATE,
  tgl_kembali DATE
);

CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  judul VARCHAR(200) NOT NULL,
  konten TEXT NOT NULL,
  kategori VARCHAR(20) NOT NULL
    CHECK (kategori IN ('Operasional','Layanan','Acara')),
  tgl_rilis DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft','Published')),
  author_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  book_id INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  loan_id INT NOT NULL UNIQUE REFERENCES loans(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  komentar TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);