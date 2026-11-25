'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction } from '@/app/actions/auth';

const fields = [
  { name: 'nama', label: 'Nama supplier', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'password', label: 'Password (min. 8 karakter)', type: 'password' },
];

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, null);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1>Daftar Supplier</h1>
          <p className="mt-1 text-sm text-slate-500">
            Akun baru akan ditinjau Admin sebelum dapat digunakan.
          </p>
        </div>

        <form action={action} className="space-y-4">
          {state?.message && (
            <p
              className={`rounded-lg p-3 text-sm ${
                state.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {state.message}
            </p>
          )}

          {fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-sm font-medium">{f.label}</label>
              <input name={f.name} type={f.type} className="w-full" />
              {state?.errors?.[f.name] && (
                <p className="mt-1 text-sm text-red-600">{state.errors[f.name]}</p>
              )}
            </div>
          ))}

          <button
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-white disabled:opacity-50"
          >
            {pending ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}