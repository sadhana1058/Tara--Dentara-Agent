import { NextRequest } from 'next/server';
import { DateTime } from 'luxon';
import { getCalendarClient, CALENDAR_ID } from '@/lib/google';

const TZ = process.env.CLINIC_TIMEZONE || 'America/New_York';
const OPEN_HOUR = 9;
const CLOSE_HOUR = 17;
const SLOT_MINUTES = 30;

export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
    }

    const dayStart = DateTime.fromISO(date, { zone: TZ }).set({ hour: OPEN_HOUR, minute: 0, second: 0, millisecond: 0 });
    const dayEnd = dayStart.set({ hour: CLOSE_HOUR, minute: 0, second: 0, millisecond: 0 });

    // Skip weekends (6=Saturday, 7=Sunday in Luxon)
    if (dayStart.weekday === 6 || dayStart.weekday === 7) {
      return Response.json({ slots: [], reason: 'closed_weekend' });
    }

    const cal = getCalendarClient();
    const fb = await cal.freebusy.query({
      requestBody: {
        timeMin: dayStart.toISO()!,
        timeMax: dayEnd.toISO()!,
        timeZone: TZ,
        items: [{ id: CALENDAR_ID }],
      },
    });

    const busy = (fb.data.calendars?.[CALENDAR_ID]?.busy ?? []).map((b) => ({
      start: DateTime.fromISO(b.start!),
      end: DateTime.fromISO(b.end!),
    }));

    const slots: string[] = [];
    let cursor = dayStart;
    const now = DateTime.now().setZone(TZ);

    while (cursor < dayEnd) {
      const slotEnd = cursor.plus({ minutes: SLOT_MINUTES });
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
