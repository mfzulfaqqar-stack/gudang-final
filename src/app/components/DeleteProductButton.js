'use client';

import { useActionState } from 'react';
import { deleteProduct } from '@/app/actions/products';

export default function DeleteProductButton({ id, nama, stok }) {
  const [state, action, pending] = useActionState(deleteProduct, null);

  function konfirmasi(e) {
    const pesan =
      stok > 0
        ? `Produk "${nama}" masih memiliki stok ${stok}. Yakin tetap menghapus?`
        : `Hapus produk "${nama}"?`;
    if (!window.confirm(pesan)) e.preventDefault();
  }

  return (
    <form action={action} onSubmit={konfirmasi} className="inline">
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="text-sm text-red-600 underline disabled:opacity-50">
        {pending ? '...' : 'Hapus'}
      </button>
      {state?.message && (
        <p className="mt-1 max-w-xs text-xs text-red-600">{state.message}</p>
      )}
    </form>
  );
}