import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { updateClinicSettings } from '@/lib/db';

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

const ALLOWED_FIELDS = new Set([
  'clinic_name', 'doctor_name', 'address', 'phone', 'timezone',
  'greeting_text', 'appointment_length', 'open_time', 'close_time',
]);

export async function PATCH(req: NextRequest) {
  try {
    const clinicId = await getClinicIdFromCookie(req);
    if (!clinicId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Whitelist — never allow password_hash, google_refresh_token, etc.
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(k)) updates[k] = v;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await updateClinicSettings(clinicId, updates);
    return Response.json({ success: true });
  } catch (err: any) {
    console.error('settings patch error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
