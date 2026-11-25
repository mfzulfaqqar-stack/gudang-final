import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

const HOME = {
  admin: '/admin',
  manager: '/manager',
  staff: '/staff',
  supplier: '/supplier',
};

export default async function Home() {
  const session = await getSession();
  redirect(session ? HOME[session.role] : '/login');
}