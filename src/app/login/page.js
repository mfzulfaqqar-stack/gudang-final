'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Masuk</h1>

      <form action={action} className="space-y-4">
        {state?.message && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input name="email" type="email" className="w-full rounded border p-2" />
          {state?.errors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.errors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input name="password" type="password" className="w-full rounded border p-2" />
          {state?.errors?.password && (
            <p className="mt-1 text-sm text-red-600">{state.errors.password}</p>
          )}
        </div>

        <button
          disabled={pending}
          className="w-full rounded bg-blue-600 p-2 text-white disabled:opacity-50"
        >
          {pending ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <div className="mt-4 space-y-2 text-center text-sm">
        <p>
          Belum punya akun?{' '}
          <Link href="/register" className="text-blue-600 underline">Daftar</Link>
        </p>
        <Link href="/" className="block rounded border p-2 hover:bg-gray-50">
          Continue as Guest
        </Link>
      </div>
    </main>
  );
}