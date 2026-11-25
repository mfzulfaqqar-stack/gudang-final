'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function setSupplierStatus(prev, formData) {
  await requireRole(['admin']);
  const id = Number(formData.get('id'));
  const status = String(formData.get('status') ?? '');
  if (!Number.isInteger(id) || !['Approved', 'Rejected'].includes(status)) {
    return { message: 'Permintaan tidak valid' };
  }

  // Hanya akun Supplier yang masih Pending yang dapat diproses
  const res = await query(
    `UPDATE users SET status_akun = $2
     WHERE id = $1 AND role = 'supplier' AND status_akun = 'Pending'`,
    [id, status]
  );
  if (!res.rowCount) return { message: 'Supplier tidak ditemukan atau sudah diproses' };

  revalidatePath('/admin/supplier');
  revalidatePath('/admin');
  return {
    ok: true,
    message: status === 'Approved' ? 'Supplier disetujui' : 'Supplier ditolak',
  };
}