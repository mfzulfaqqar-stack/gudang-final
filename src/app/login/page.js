'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            G
          </div>
          <h1>Masuk ke Sistem Gudang</h1>
          <p className="mt-1 text-sm text-slate-500">Silakan masuk dengan akun Anda.</p>
        </div>

        <form action={action} className="space-y-4">
          {state?.message && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input name="email" type="email" className="w-full" placeholder="nama@email.com" />
            {state?.errors?.email && (
              <p className="mt-1 text-sm text-red-600">{state.errors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input name="password" type="password" className="w-full" placeholder="Password" />
            {state?.errors?.password && (
              <p className="mt-1 text-sm text-red-600">{state.errors.password}</p>
            )}
          </div>

          <button
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-white disabled:opacity-50"
          >
            {pending ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Supplier baru?{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Daftar di sini
          </Link>
        </p>

      </div>
    </main>
  );
}