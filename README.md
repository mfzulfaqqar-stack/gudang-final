# Sistem Manajemen Gudang

Praktikum Pemrograman Web 2026, Individual Project 6.
Dibangun dengan Next.js (JSX, Tailwind CSS) dan PostgreSQL (raw SQL dengan library `pg`).

## Cara menjalankan

1. Install dependensi:
   npm install
2. Buat database PostgreSQL kosong, misalnya `gudang`.
3. Jalankan file SQL di pgAdmin (Query Tool) dengan urutan:
   1. `src/database/schema.sql`
   2. `src/database/seed.sql` (membutuhkan ekstensi `pgcrypto`, hak superuser)
4. Salin `.env.example` menjadi `.env.local`, lalu isi `DATABASE_URL` dan `JWT_SECRET`.
5. Jalankan:
   npm run dev
   Buka http://localhost:3000

## Akun demo (password semua: password123)

| Role | Email |
|---|---|
| Admin | admin@gudang.com |
| Warehouse Manager | manager@gudang.com |
| Staff Gudang | staff@gudang.com |
| Supplier (Approved) | sumber@supplier.com, maju@supplier.com |
| Supplier (Pending) | baru@supplier.com |
| Supplier (Rejected) | tolak@supplier.com |

Akun Admin, Manager, dan Staff dibuat melalui seed. Supplier mendaftar sendiri dan harus di-approve Admin.

## Fitur

- Autentikasi JWT (cookie httpOnly), guard role di proxy dan di setiap server action
- Produk: CRUD, status stok otomatis, search, filter, sorting, pagination, detail
- Transaksi masuk/keluar: approve/reject dengan update stok transaksional, status Shipped
- Restock order: buat PO, konfirmasi Supplier, alur status, timeline
- Kategori (CRUD) dan verifikasi Supplier
- Dashboard untuk keempat role

## Asumsi

- Gambar produk dan kategori berupa URL (tanpa upload file) dan bersifat opsional.
- Catatan wajib pada barang masuk dan restock order, opsional pada barang keluar.
- Satu transaksi tidak boleh memuat produk yang sama dua kali.
- Hanya Staff yang membuat transaksi dan menandai Shipped. Manager dapat mengedit/menghapus transaksi Pending siapa pun.
- Produk yang memiliki riwayat transaksi atau restock tidak dapat dihapus.
- Restock order tidak dapat diedit atau dihapus setelah dibuat.
- Daftar transaksi dan restock dibatasi 200 data terbaru.