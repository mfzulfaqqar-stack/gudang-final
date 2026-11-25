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
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Daftar Supplier</h1>

      <form action={action} className="space-y-4">
        {state?.message && (
          <p
            className={`rounded p-3 text-sm ${
              state.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {state.message}
          </p>
        )}

        {fields.map((f) => (
          <div key={f.name}>
            <label className="mb-1 block text-sm font-medium">{f.label}</label>
            <input name={f.name} type={f.type} className="w-full rounded border p-2" />
            {state?.errors?.[f.name] && (
              <p className="mt-1 text-sm text-red-600">{state.errors[f.name]}</p>
            )}
          </div>
        ))}

        <button
          disabled={pending}
          className="w-full rounded bg-blue-600 p-2 text-white disabled:opacity-50"
        >
          {pending ? 'Memproses...' : 'Daftar'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-blue-600 underline">Masuk</Link>
      </p>
    </main>
  );
}