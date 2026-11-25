'use client';

import { useActionState } from 'react';
import Link from 'next/link';

const input = 'w-full rounded border p-2';

export default function CategoryForm({ action, defaults = {}, isEdit = false }) {
  const [state, formAction, pending] = useActionState(action, null);
  const val = (name) => state?.values?.[name] ?? defaults[name] ?? '';
  const err = state?.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}
      {isEdit && <input type="hidden" name="id" value={defaults.id} />}

      <div>
        <label className="mb-1 block text-sm font-medium">Nama kategori</label>
        <input name="nama" defaultValue={val('nama')} className={input} />
        {err.nama && <p className="mt-1 text-sm text-red-600">{err.nama}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Deskripsi</label>
        <textarea name="deskripsi" rows={3} defaultValue={val('deskripsi')} className={input} />
        {err.deskripsi && <p className="mt-1 text-sm text-red-600">{err.deskripsi}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">URL gambar kategori (opsional)</label>
        <input name="gambar" defaultValue={val('gambar')} className={input} />
        {err.gambar && <p className="mt-1 text-sm text-red-600">{err.gambar}</p>}
      </div>

      <div className="flex gap-3">
        <button
          disabled={pending}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Menyimpan...' : 'Simpan'}
        </button>
        <Link href="/kategori" className="rounded border px-4 py-2">Batal</Link>
      </div>
    </form>
  );
}