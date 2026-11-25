# Sistem Manajemen Gudang

Tugas Final Praktikum Pemrograman Web 2026, Individual Project 6: Manajemen Gudang.

Aplikasi manajemen gudang untuk mengelola inventori, transaksi barang masuk dan keluar, serta restock ke supplier. Dibangun dengan **Next.js 16 (JSX, App Router)**, **Tailwind CSS**, dan **PostgreSQL** menggunakan **raw SQL** (library `pg`, tanpa ORM).

## Teknologi

- Next.js 16 (App Router, Server Actions, Route Handler)
- Tailwind CSS v4
- PostgreSQL dengan library `pg`
- `jose` (JWT) dan `bcryptjs` (hash password)
- `zod` (validasi input)

## Cara menjalankan

Prasyarat: Node.js, PostgreSQL, dan pgAdmin.

1. Install dependensi:
   ```
   npm install
   ```
2. Buat database PostgreSQL kosong di pgAdmin, misalnya `gudang`.
3. Buka **Query Tool** pada database tersebut, lalu jalankan file SQL dengan urutan:
   1. `src/database/schema.sql`
   2. `src/database/seed.sql`

   Catatan: `seed.sql` memakai ekstensi `pgcrypto` untuk membuat hash password, sehingga perlu dijalankan dengan user yang memiliki hak superuser (misalnya `postgres`). Menjalankan `schema.sql` ulang akan mengosongkan semua tabel, jadi selalu jalankan `schema.sql` sebelum `seed.sql`.
4. Salin `.env.example` menjadi `.env.local`, lalu isi:
   ```
   DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/gudang
   JWT_SECRET=isi-string-acak-minimal-32-karakter
   ```
5. Jalankan aplikasi:
   ```
   npm run dev
   ```
   Buka http://localhost:3000

Untuk build produksi: `npm run build` lalu `npm start`.

## Akun demo

Password semua akun: `password123`

| Role | Email | Keterangan |
|---|---|---|
| Admin | admin@gudang.com | |
| Warehouse Manager | manager@gudang.com | |
| Staff Gudang | staff@gudang.com | |
| Supplier | sumber@supplier.com | Approved |
| Supplier | maju@supplier.com | Approved |
| Supplier | baru@supplier.com | Pending (belum bisa login) |
| Supplier | tolak@supplier.com | Rejected (tidak bisa login) |

Akun Admin, Manager, dan Staff dibuat melalui data awal (`seed.sql`), tanpa fitur tambah akun. Supplier mendaftar sendiri lewat halaman Register dan baru bisa login setelah di-approve Admin.

## Hak akses per role

| Modul | Admin | Manager | Staff | Supplier |
|---|---|---|---|---|
| Produk (lihat) | ✓ | ✓ | ✓ | - |
| Produk (tambah, edit, hapus) | ✓ | ✓ | - | - |
| Kategori (CRUD) | ✓ | ✓ | - | - |
| Transaksi (lihat) | ✓ | ✓ | ✓ | - |
| Transaksi (buat, tandai Shipped) | - | - | ✓ | - |
| Transaksi (edit dan hapus yang Pending) | - | ✓ | ✓ (milik sendiri) | - |
| Transaksi (Approve dan Reject) | - | ✓ | - | - |
| Restock (lihat) | ✓ | ✓ | - | ✓ (milik sendiri) |
| Restock (buat PO, ubah status) | - | ✓ | - | - |
| Restock (konfirmasi dan tolak) | - | - | - | ✓ |
| Verifikasi Supplier | ✓ | - | - | - |
| Ekspor CSV | Semua modul | Produk, Transaksi, Restock | Transaksi miliknya | - |

## Fitur

**Autentikasi dan keamanan**
- Login dengan sesi JWT di cookie `httpOnly`. Password disimpan sebagai hash bcrypt.
- Register khusus Supplier dengan status awal Pending.
- Pembatasan akses berlapis: `proxy.js` memblokir prefix route per role, dan `requireRole()` dipanggil di setiap halaman serta server action.
- Seluruh query memakai parameter (`$1`, `$2`) untuk mencegah SQL injection.

**Produk**
- CRUD dengan validasi: SKU unik dan tidak dapat diubah, stok Low harus lebih besar dari stok minimum, stok tidak boleh negatif.
- Status stok dihitung otomatis lewat query (`CASE`), tidak disimpan di kolom: Out of Stock (0), Severe (≤ minimum), Low (≤ batas Low), Normal.
- Search (nama dan SKU), filter kategori dan status stok, sorting, pagination, serta badge warna (abu-abu, merah, kuning, hijau).
- Halaman detail dengan 5 transaksi terakhir dan tombol Create Restock Order (Manager, saat stok rendah).
- Penghapusan produk memberi peringatan jika masih ada stok, dan ditolak bila produk memiliki riwayat transaksi atau restock.

**Transaksi**
- Barang masuk (dengan atau tanpa Nomor PO) dan barang keluar, dengan banyak produk per transaksi.
- Nomor transaksi dibuat otomatis. Jika PO dipilih, supplier dan daftar produk terisi dari PO. Satu PO hanya dapat dipakai satu transaksi masuk yang belum Rejected (dijaga di aplikasi dan lewat partial unique index di database).
- Barang keluar divalidasi agar quantity tidak melebihi stok.
- Approve oleh Manager memperbarui stok dan status dalam **satu transaksi database** (`BEGIN`/`COMMIT`) dengan `SELECT ... FOR UPDATE`, sehingga stok tidak dapat menjadi negatif. Reject wajib disertai alasan dan tidak mengubah stok.
- Barang keluar yang Approved dapat ditandai Shipped oleh Staff (tidak mengubah stok lagi).
- Filter berdasarkan tipe (tab), status, rentang tanggal, serta supplier atau customer.

**Restock**
- Manager membuat PO (nomor otomatis) untuk supplier terpilih. Supplier mengonfirmasi atau menolak (alasan wajib saat menolak).
- Alur status: Pending → Confirmed → In Transit → Received, dengan timeline progres. Perubahan status hanya sah dari status asal yang benar.
- Status Received tidak mengubah stok. Stok bertambah setelah Incoming Transaction dari PO tersebut di-approve Manager.

**Kategori dan verifikasi Supplier**
- CRUD kategori dengan nama unik (tanpa membedakan huruf besar-kecil). Kategori yang masih memiliki produk tidak dapat dihapus.
- Admin menyetujui atau menolak pendaftaran Supplier. Supplier berstatus Pending atau Rejected tidak dapat login dan mendapat pesan yang sesuai.

**Dashboard**
- Admin: total produk, transaksi bulan ini, nilai inventori, supplier Pending (dengan tombol Approve dan Reject), alert stok Severe dan Out of Stock, serta akses cepat.
- Manager: ringkasan stok, transaksi menunggu approval, restock berjalan, dan produk yang perlu direstock.
- Staff: form quick entry dan daftar transaksi hari ini.
- Supplier: restock yang perlu dikonfirmasi dan riwayat pengiriman ke gudang.

**Ekspor CSV (fitur opsional)**
- Route Handler `GET /api/export/[modul]` dengan pemeriksaan login (401) dan role (403) di server. Staff hanya mendapat transaksi miliknya.

## Struktur proyek

```
src/
├── app/
│   ├── actions/        Server Actions (auth, products, transactions, restock, categories, suppliers)
│   ├── api/export/     Route Handler ekspor CSV
│   ├── components/     Komponen UI yang dipakai ulang
│   ├── admin/ manager/ staff/ supplier/   Dashboard per role
│   ├── produk/ transaksi/ restock/ kategori/   Modul
│   └── login/ register/
├── database/           schema.sql dan seed.sql
├── lib/                db.js (pool dan transaksi), auth.js, validators.js, queries.js
└── proxy.js            Guard akses per role
```

## Asumsi dan desain

- Gambar produk wajib diisi berupa URL (`http://` atau `https://`), tanpa upload file. Gambar kategori bersifat opsional. Data seed memakai gambar placeholder dari internet, sehingga gambar tampil bila ada koneksi.
- Catatan wajib pada barang masuk dan restock order. Catatan pada barang keluar opsional.
- Satu transaksi atau PO tidak boleh memuat produk yang sama dua kali.
- Hanya Staff yang membuat transaksi dan menandai Shipped. Manager dapat mengedit dan menghapus transaksi Pending milik siapa pun. Admin hanya dapat melihat transaksi dan restock.
- Restock order tidak dapat diedit atau dihapus setelah dibuat, karena tidak diminta pada spesifikasi.
- Produk yang memiliki riwayat transaksi atau restock tidak dapat dihapus (foreign key `ON DELETE RESTRICT`).
- Dashboard Admin: "transaksi bulan ini" menghitung semua status, dan "nilai inventori" dihitung dari stok dikali harga beli.
- Daftar transaksi dan restock dibatasi 200 data terbaru tanpa pagination. Produk memakai pagination.
- Fitur opsional barcode/QR dan rating supplier tidak diimplementasikan.