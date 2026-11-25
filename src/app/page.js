import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { rows } = await query('SELECT COUNT(*)::int AS total FROM users');
  const session = await getSession();
  return (
    <main className="p-8">
      <p>Koneksi DB OK. Jumlah user: {rows[0].total}</p>
      <p>Sesi: {session ? `${session.nama} (${session.role})` : 'guest'}</p>
    </main>
  );
}