import { NextRequest } from 'next/server';
import { DateTime } from 'luxon';
import { getCalendarClient, CALENDAR_ID } from '@/lib/google';
import { insertAppointment } from '@/lib/db';

const TZ = process.env.CLINIC_TIMEZONE || 'America/New_York';

export async function POST(req: NextRequest) {
  try {
    const { patient_name, patient_phone, start_time, call_sid } = await req.json();

    if (!patient_name || !patient_phone || !start_time || !call_sid) {
      return Response.json({ error: 'missing required fields' }, { status: 400 });
    }

    const start = DateTime.fromISO(start_time, { zone: TZ });
    if (!start.isValid) {
      return Response.json({ error: 'invalid start_time' }, { status: 400 });
    }
    const end = start.plus({ minutes: 30 });

    if (start < DateTime.now()) {
      return Response.json({ error: 'cannot book in the past' }, { status: 400 });
    }
    if (start.hour < 9 || start.hour >= 17) {
      return Response.json({ error: 'outside business hours' }, { status: 400 });
    }

    const cal = getCalendarClient();
    const event = await cal.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `${patient_name} — Dental Appointment`,
        description: `Booked via AI receptionist\nPhone: ${patient_phone}\nCall SID: ${call_sid}`,
        start: { dateTime: start.toISO()!, timeZone: TZ },
        end: { dateTime: end.toISO()!, timeZone: TZ },
      },
    });

    const appointment = await insertAppointment({
      call_sid,
      patient_name,
      patient_phone,
      start_time: start.toISO()!,
      end_time: end.toISO()!,
      calendar_event_id: event.data.id!,
    });

    return Response.json({
      success: true,
      confirmation: `Appointment confirmed for ${start.toFormat("EEEE, MMMM d 'at' h:mm a")}`,
      appointment_id: appointment.id,
    });
  } catch (err: any) {
    console.error('book error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
