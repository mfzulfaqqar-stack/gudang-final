import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { setSupplierStatus } from '@/app/actions/suppliers';
import ActionForm from '@/app/components/ActionForm';

export const dynamic = 'force-dynamic';

const BADGE = {
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default async function SupplierPage() {
  await requireRole(['admin']);

  const pending = (
    await query(
      `SELECT id, nama, email, created_at FROM users
       WHERE role = 'supplier' AND status_akun = 'Pending'
       ORDER BY created_at, id`
    )
  ).rows;

  const diproses = (
    await query(
      `SELECT id, nama, email, status_akun FROM users
       WHERE role = 'supplier' AND status_akun <> 'Pending'
       ORDER BY nama`
    )
  ).rows;

  return (
    <main className="space-y-8 p-6">
      <section>
        <h1 className="mb-3 text-2xl font-bold">Verifikasi Supplier</h1>
        <h2 className="mb-2 text-lg font-semibold">Menunggu persetujuan ({pending.length})</h2>

        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Email</th>
                <th className="p-3">Tanggal daftar</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    Tidak ada supplier yang menunggu persetujuan.
                  </td>
                </tr>
              )}
              {pending.map((s) => (
                <tr key={s.id} className="border-t align-top">
                  <td className="p-3 font-medium">{s.nama}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">{new Date(s.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-start gap-2">
                      <ActionForm
                        action={setSupplierStatus}
                        fields={{ id: s.id, status: 'Approved' }}
                        label="Approve"
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                      />
                      <ActionForm
                        action={setSupplierStatus}
                        fields={{ id: s.id, status: 'Rejected' }}
                        label="Reject"
                        confirmText={`Tolak pendaftaran ${s.nama}?`}
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Sudah diproses</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {diproses.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    Belum ada.
                  </td>
                </tr>
              )}
              {diproses.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{s.nama}</td>
                  <td className="p-3">{s.email}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[s.status_akun]}`}>
                      {s.status_akun}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}