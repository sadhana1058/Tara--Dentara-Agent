import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');

export async function getClinicId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get('tara-session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.clinicId as string) ?? null;
  } catch {
    return null;
  }
}
