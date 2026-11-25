'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';

const input = 'w-full rounded border p-2';

export default function RestockForm({ action, products, suppliers, defaults = {} }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [supplierId, setSupplierId] = useState('');
  const [tglOrder, setTglOrder] = useState(defaults.tgl_order ?? '');
  const [expected, setExpected] = useState('');
  const [catatan, setCatatan] = useState('');
  const [rows, setRows] = useState(
    defaults.items?.length ? defaults.items : [{ product_id: '', qty: '' }]
  );

  const err = state?.errors ?? {};
  const setRow = (i, patch) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows([...rows, { product_id: '', qty: '' }]);
  const delRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Supplier</label>
          <select
            name="supplier_id"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={input}
          >
            <option value="">-- Pilih supplier --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.nama}</option>
            ))}
          </select>
          {err.supplier_id && <p className="mt-1 text-sm text-red-600">{err.supplier_id}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tanggal order</label>
          <input
            type="date"
            name="tgl_order"
            value={tglOrder}
            onChange={(e) => setTglOrder(e.target.value)}
            className={input}
          />
          {err.tgl_order && <p className="mt-1 text-sm text-red-600">{err.tgl_order}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Expected delivery date</label>
          <input
            type="date"
            name="expected_delivery"
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            className={input}
          />
          {err.expected_delivery && (
            <p className="mt-1 text-sm text-red-600">{err.expected_delivery}</p>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium">Produk yang perlu direstock</h2>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
              <select
                name="product_id"
                value={r.product_id}
                onChange={(e) => setRow(i, { product_id: e.target.value })}
                className={input}
              >
                <option value="">-- Pilih produk --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.nama} (stok {p.stok} {p.unit})
                  </option>
                ))}
              </select>
              <input
                name="qty"
                type="number"
                min="1"
                step="1"
                placeholder="Qty"
                value={r.qty}
                onChange={(e) => setRow(i, { qty: e.target.value })}
                className={input}
              />
              <button
                type="button"
                onClick={() => delRow(i)}
                disabled={rows.length === 1}
                className="rounded border px-3 text-sm text-red-600 disabled:opacity-40"
              >
                Hapus
              </button>
            </div>
          ))}
          <button type="button" onClick={addRow} className="rounded border px-3 py-1 text-sm">
            + Tambah produk
          </button>
        </div>
      </section>

      <div>
        <label className="mb-1 block text-sm font-medium">Catatan</label>
        <textarea
          name="catatan"
          rows={3}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className={input}
        />
        {err.catatan && <p className="mt-1 text-sm text-red-600">{err.catatan}</p>}
      </div>

      <div className="flex gap-3">
        <button
          disabled={pending}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Menyimpan...' : 'Buat restock order'}
        </button>
        <Link href="/restock" className="rounded border px-4 py-2">Batal</Link>
      </div>
    </form>
  );
}