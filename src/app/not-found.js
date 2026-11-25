import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">Halaman tidak ditemukan.</p>
      <Link href="/" className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white">
        Ke beranda
      </Link>
    </main>
  );
}