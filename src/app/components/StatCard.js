const TONE = {
  default: 'border-slate-200 bg-white',
  warn: 'border-amber-200 bg-amber-50',
  danger: 'border-red-200 bg-red-50',
  muted: 'border-slate-200 bg-slate-100',
};

const VALUE = {
  default: 'text-slate-900',
  warn: 'text-amber-700',
  danger: 'text-red-700',
  muted: 'text-slate-600',
};

export default function StatCard({ label, value, tone = 'default' }) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${TONE[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${VALUE[tone]}`}>{value}</p>
    </div>
  );
}