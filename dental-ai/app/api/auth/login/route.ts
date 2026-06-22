import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { getClinicByUsername } from '@/lib/db';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const clinic = await getClinicByUsername(username);
  if (!clinic) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const match = await bcrypt.compare(password, clinic.password_hash);
  if (!match) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await new SignJWT({ username: clinic.username, clinicId: clinic.id, clinicName: clinic.clinic_name })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('tara-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}
