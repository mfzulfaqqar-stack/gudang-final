export default function ExportButton({ modul }) {
  return (
    <a
      href={`/api/export/${modul}`}
      className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
    >
      Ekspor CSV
    </a>
  );
}