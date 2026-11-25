'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';

const input = 'w-full rounded border p-2';

export default function TransactionForm({
  action,
  tipe,
  products,
  suppliers = [],
  pos = [],
  defaults = {},
  isEdit = false,
  info = [],
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [tanggal, setTanggal] = useState(defaults.tanggal ?? '');
  const [poId, setPoId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [customer, setCustomer] = useState('');
  const [catatan, setCatatan] = useState(defaults.catatan ?? '');
  const [rows, setRows] = useState(
    defaults.items?.length
      ? defaults.items.map((i) => ({ product_id: String(i.product_id), qty: String(i.qty) }))
      : [{ product_id: '', qty: '' }]
  );

  const err = state?.errors ?? {};
  const po = !isEdit && tipe === 'masuk' ? pos.find((p) => String(p.id) === poId) : null;

  const setRow = (i, patch) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows([...rows, { product_id: '', qty: '' }]);
  const delRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  return (
    <form action={formAction} className="space-y-4">
      {state?.message && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}

      <input type="hidden" name="tipe" value={tipe} />
      {isEdit && <input type="hidden" name="id" value={defaults.id} />}

      {isEdit ? (
        <dl className="grid gap-3 sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k} className="rounded border bg-gray-50 p-3">
              <dt className="text-xs text-gray-500">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {tipe === 'masuk' ? 'Tanggal penerimaan' : 'Tanggal pengiriman'}
            </label>
            <input
              type="date"
              name="tanggal"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className={input}
            />
            {err.tanggal && <p className="mt-1 text-sm text-red-600">{err.tanggal}</p>}
          </div>

          {tipe === 'masuk' ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Nomor PO (opsional)</label>
                <select
                  name="restock_id"
                  value={poId}
                  onChange={(e) => setPoId(e.target.value)}
                  className={input}
                >
                  <option value="">-- Tanpa PO --</option>
                  {pos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.no_po} ({p.supplier_nama})
                    </option>
                  ))}
                </select>
                {err.restock_id && <p className="mt-1 text-sm text-red-600">{err.restock_id}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Supplier</label>
                {po ? (
                  <p className="rounded border bg-gray-50 p-2">
                    {po.supplier_nama} (otomatis dari PO)
                  </p>
                ) : (
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
                )}
                {err.supplier_id && <p className="mt-1 text-sm text-red-600">{err.supplier_id}</p>}
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium">Nama customer / tujuan</label>
              <input
                name="customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className={input}
              />
              {err.customer && <p className="mt-1 text-sm text-red-600">{err.customer}</p>}
            </div>
          )}
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium">Daftar produk</h2>

        {po ? (
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2">SKU</th>
                  <th className="p-2">Produk</th>
                  <th className="p-2">Qty</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((it) => (
                  <tr key={it.product_id} className="border-t">
                    <td className="p-2 font-mono">{it.sku}</td>
                    <td className="p-2">{it.nama}</td>
                    <td className="p-2">{it.qty} {it.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t p-2 text-xs text-gray-500">
              Produk dan quantity terisi otomatis dari PO.
            </p>
          </div>
        ) : (
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
        )}
      </section>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Catatan{tipe === 'keluar' ? ' (opsional)' : ''}
        </label>
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
          {pending ? 'Menyimpan...' : 'Simpan'}
        </button>
        <Link
          href={isEdit ? `/transaksi/${defaults.id}` : `/transaksi?tipe=${tipe}`}
          className="rounded border px-4 py-2"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}