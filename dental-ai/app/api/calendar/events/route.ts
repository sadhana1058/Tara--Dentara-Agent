import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getCalendarClient } from '@/lib/google';
import { getClinicById } from '@/lib/db';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');

export async function GET(req: NextRequest) {
  const token = req.cookies.get('tara-session')?.value;
  if (!token) return new Response('Unauthorized', { status: 401 });

  let clinicId: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    clinicId = payload.clinicId as string;
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get('weekStart');
  const weekEnd   = searchParams.get('weekEnd');
  if (!weekStart || !weekEnd) return Response.json({ error: 'missing params' }, { status: 400 });

  const clinic       = await getClinicById(clinicId);
  const calendarId   = clinic?.google_calendar_id ?? process.env.GOOGLE_CALENDAR_ID ?? 'primary';
  const refreshToken = clinic?.google_refresh_token ?? undefined;

  const cal = getCalendarClient(refreshToken);
  const res = await cal.events.list({
    calendarId,
    timeMin:      `${weekStart}T00:00:00Z`,
    timeMax:      `${weekEnd}T23:59:59Z`,
    singleEvents: true,
    orderBy:      'startTime',
    maxResults:   200,
  });

  return Response.json(res.data.items ?? []);
}
