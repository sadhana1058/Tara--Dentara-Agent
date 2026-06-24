import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getClinicById, updateClinicPassword } from '@/lib/db';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');

async function getClinicIdFromCookie(req: NextRequest): Promise<string | null> {
  const cookie = req.cookies.get('tara-session')?.value;
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie, secret);
    return (payload as { clinicId?: string }).clinicId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const clinicId = await getClinicIdFromCookie(req);
    if (!clinicId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const clinic = await getClinicById(clinicId) as any;
    if (!clinic) return Response.json({ error: 'Clinic not found' }, { status: 404 });

    const match = await bcrypt.compare(currentPassword, clinic.password_hash);
    if (!match) return Response.json({ error: 'Current password is incorrect' }, { status: 401 });

    const newHash = await bcrypt.hash(newPassword, 12);
    await updateClinicPassword(clinicId, newHash);

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('password change error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
