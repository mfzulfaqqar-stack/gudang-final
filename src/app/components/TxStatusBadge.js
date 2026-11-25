const STYLE = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Shipped: 'bg-blue-100 text-blue-700',
};

export default function TxStatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[status]}`}>
      {status}
    </span>
  );
}