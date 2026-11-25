'use client';

export default function Error({ reset }) {
  return (
    <main className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
      <p className="mt-2 text-gray-600">Silakan coba lagi.</p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
      >
        Coba lagi
      </button>
    </main>
  );
}