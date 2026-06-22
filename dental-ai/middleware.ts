import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('tara-session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const clinicId = payload.clinicId as string;

    // Inject clinic_id into request headers so server components can read it
    const reqHeaders = new Headers(req.headers);
    reqHeaders.set('x-clinic-id', clinicId ?? '');

    return NextResponse.next({ request: { headers: reqHeaders } });
  } catch {
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.delete('tara-session');
    return res;
  }
}

export const config = {
  matcher: ['/dashboard-7k3x/:path*'],
};
