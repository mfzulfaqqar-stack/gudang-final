'use client';

import { useActionState } from 'react';

export default function ActionForm({ action, fields = {}, label, className, confirmText, children }) {
  const [state, formAction, pending] = useActionState(action, null);

  function onSubmit(e) {
    if (confirmText && !window.confirm(confirmText)) e.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="inline-flex flex-col gap-1">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children}
      <button
        disabled={pending}
        className={className || 'rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50'}
      >
        {pending ? '...' : label}
      </button>
      {state?.message && (
        <p className={`max-w-xs text-xs ${state.ok ? 'text-green-700' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}