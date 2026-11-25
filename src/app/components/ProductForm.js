'use client';

import { useActionState } from 'react';
import Link from 'next/link';

const FIELDS = [
  { name: 'nama', label: 'Nama produk', type: 'text' },
  { name: 'sku', label: 'SKU', type: 'text', createOnly: true },
  { name: 'category_id', label: 'Kategori', type: 'select' },
  { name: 'deskripsi', label: 'Deskripsi', type: 'textarea' },
  { name: 'harga_beli', label: 'Harga beli', type: 'number' },
  { name: 'harga_jual', label: 'Harga jual', type: 'number' },
  { name: 'stok_minimum', label: 'Stok minimum (batas Severe)', type: 'number' },
  { name: 'stok_low', label: 'Stok Low (batas Low)', type: 'number' },
  { name: 'stok', label: 'Jumlah stok saat ini', type: 'number' },
  { name: 'unit', label: 'Unit (pcs, box, kg, liter, dll)', type: 'text' },
  { name: 'lokasi_rak', label: 'Lokasi rak', type: 'text' },
  { name: 'gambar', label: 'URL gambar produk', type: 'text' },
];

export default function ProductForm({ action, kategori, defaults = {}, isEdit = false }) {
  const [state, formAction, pending] = useActionState(action, null);
  const val = (name) => state?.values?.[name] ?? defaults[name] ?? '';

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {state?.message && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
          {state.message}
        </p>
      )}
      {isEdit && <input type="hidden" name="id" value={defaults.id} />}

      {FIELDS.map((f) => {
        const wide = f.type === 'textarea' ? 'sm:col-span-2' : '';
        const error = state?.errors?.[f.name];
        return (
          <div key={f.name} className={wide}>
            <label className="mb-1 block text-sm font-medium">{f.label}</label>

            {f.createOnly && isEdit ? (
              <input
                value={defaults.sku}
                disabled
                className="w-full rounded border bg-gray-100 p-2"
              />
            ) : f.type === 'select' ? (
              <select
                name={f.name}
                defaultValue={val(f.name)}
                className="w-full rounded border p-2"
              >
                <option value="">-- Pilih kategori --</option>
                {kategori.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea
                name={f.name}
                rows={3}
                defaultValue={val(f.name)}
                className="w-full rounded border p-2"
              />
            ) : (
              <input
                name={f.name}
                type={f.type}
                min={f.type === 'number' ? 0 : undefined}
                step={f.type === 'number' ? 'any' : undefined}
                defaultValue={val(f.name)}
                className="w-full rounded border p-2"
              />
            )}

            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        );
      })}

      <div className="flex gap-3 sm:col-span-2">
        <button
          disabled={pending}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Menyimpan...' : 'Simpan'}
        </button>
        <Link href="/produk" className="rounded border px-4 py-2">Batal</Link>
      </div>
    </form>
  );
}