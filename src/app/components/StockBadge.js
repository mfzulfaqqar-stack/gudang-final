const STYLE = {
  'Out of Stock': 'bg-gray-200 text-gray-700',
  Severe: 'bg-red-100 text-red-700',
  Low: 'bg-yellow-100 text-yellow-800',
  Normal: 'bg-green-100 text-green-700',
};

export default function StockBadge({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[status]}`}>
      {status}
    </span>
  );
}