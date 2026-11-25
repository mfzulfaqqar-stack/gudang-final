const TONE = {
  default: 'bg-white',
  warn: 'border-yellow-300 bg-yellow-50',
  danger: 'border-red-300 bg-red-50',
  muted: 'bg-gray-50',
};

export default function StatCard({ label, value, tone = 'default' }) {
  return (
    <div className={`rounded border p-4 ${TONE[tone]}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}