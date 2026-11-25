const FLOW = ['Pending', 'Confirmed', 'In Transit', 'Received'];

export default function RestockTimeline({ status }) {
  // Order yang ditolak berhenti di Rejected
  const steps = status === 'Rejected' ? ['Pending', 'Rejected'] : FLOW;
  const idx = steps.indexOf(status);

  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        let color = 'bg-gray-200 text-gray-600';
        if (done) color = 'bg-green-600 text-white';
        if (current) {
          color = s === 'Rejected' ? 'bg-red-600 text-white'
                : s === 'Received' ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white';
        }
        return (
          <li key={s} className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 ${color}`}>
              {done || (current && s === 'Received') ? '✓ ' : ''}{s}
            </span>
            {i < steps.length - 1 && <span className="text-gray-400">→</span>}
          </li>
        );
      })}
    </ol>
  );
}