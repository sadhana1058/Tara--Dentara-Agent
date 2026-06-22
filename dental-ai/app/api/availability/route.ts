import { NextRequest } from 'next/server';
import { DateTime } from 'luxon';
import { getCalendarClient } from '@/lib/google';
import { getClinicById } from '@/lib/db';

const TZ         = process.env.CLINIC_TIMEZONE || 'America/New_York';
const OPEN_HOUR  = 9;
const CLOSE_HOUR = 17;
const SLOT_MINS  = 30;

export async function POST(req: NextRequest) {
  try {
    const body      = await req.json();
    const { date, clinic_id } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
    }

    // Resolve clinic credentials
    const clinic        = clinic_id ? await getClinicById(clinic_id) : null;
    const calendarId    = clinic?.google_calendar_id ?? process.env.GOOGLE_CALENDAR_ID ?? 'primary';
    const refreshToken  = clinic?.google_refresh_token ?? undefined;

    const dayStart = DateTime.fromISO(date, { zone: TZ }).set({ hour: OPEN_HOUR,  minute: 0, second: 0, millisecond: 0 });
    const dayEnd   = DateTime.fromISO(date, { zone: TZ }).set({ hour: CLOSE_HOUR, minute: 0, second: 0, millisecond: 0 });

    if (dayStart.weekday === 6 || dayStart.weekday === 7) {
      return Response.json({ slots: [], reason: 'closed_weekend' });
    }

    const cal = getCalendarClient(refreshToken);
    const fb  = await cal.freebusy.query({
      requestBody: {
        timeMin:  dayStart.toISO()!,
        timeMax:  dayEnd.toISO()!,
        timeZone: TZ,
        items:    [{ id: calendarId }],
      },
    });

    const busy = (fb.data.calendars?.[calendarId]?.busy ?? []).map((b) => ({
      start: DateTime.fromISO(b.start!),
      end:   DateTime.fromISO(b.end!),
    }));

    const slots: string[] = [];
    let cursor = dayStart;
    const now  = DateTime.now().setZone(TZ);

    while (cursor < dayEnd) {
      const slotEnd = cursor.plus({ minutes: SLOT_MINS });
      if (cursor > now) {
        const overlaps = busy.some((b) => cursor < b.end && slotEnd > b.start);
        if (!overlaps) slots.push(cursor.toISO()!);
      }
      cursor = slotEnd;
    }

    return Response.json({ slots, timezone: TZ });
  } catch (err: any) {
    console.error('availability error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
