import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { DateTime } from 'luxon';
import { getCalendarClient } from '@/lib/google';
import { getAppointmentById, cancelAppointment, rescheduleAppointment, getClinicById } from '@/lib/db';

const TZ = process.env.CLINIC_TIMEZONE || 'America/New_York';
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clinicId = await getClinicIdFromCookie(req);
    if (!clinicId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const body = await req.json();
    const { action } = body;

    const appointment = await getAppointmentById(id, clinicId);
    if (!appointment) return Response.json({ error: 'Appointment not found' }, { status: 404 });

    const clinic = await getClinicById(clinicId);
    const calendarId = clinic?.google_calendar_id ?? process.env.GOOGLE_CALENDAR_ID ?? 'primary';
    const cal = getCalendarClient(clinic?.google_refresh_token ?? undefined);

    if (action === 'cancel') {
      if (appointment.calendar_event_id) {
        try {
          await cal.events.delete({ calendarId, eventId: appointment.calendar_event_id });
        } catch {
          // event may already be gone
        }
      }
      await cancelAppointment(id, clinicId);
      return Response.json({ success: true });
    }

    if (action === 'reschedule') {
      const { start_time } = body;
      if (!start_time) return Response.json({ error: 'Missing start_time' }, { status: 400 });

      const start = DateTime.fromISO(start_time, { zone: TZ });
      if (!start.isValid) return Response.json({ error: 'Invalid start_time' }, { status: 400 });
      if (start < DateTime.now()) return Response.json({ error: 'Cannot book in the past' }, { status: 400 });
      if (start.hour < 9 || start.hour >= 17) return Response.json({ error: 'Outside business hours' }, { status: 400 });

      const end = start.plus({ minutes: 30 });
      let newEventId = appointment.calendar_event_id;

      if (appointment.calendar_event_id) {
        try {
          const updated = await cal.events.patch({
            calendarId,
            eventId: appointment.calendar_event_id,
            requestBody: {
              start: { dateTime: start.toISO()!, timeZone: TZ },
              end: { dateTime: end.toISO()!, timeZone: TZ },
            },
          });
          newEventId = updated.data.id ?? newEventId;
        } catch {
          // If patch fails, create a new event
          const newEvent = await cal.events.insert({
            calendarId,
            requestBody: {
              summary: `${appointment.patient_name} — Dental Appointment`,
              start: { dateTime: start.toISO()!, timeZone: TZ },
              end: { dateTime: end.toISO()!, timeZone: TZ },
            },
          });
          newEventId = newEvent.data.id ?? newEventId;
        }
      }

      await rescheduleAppointment(id, clinicId, start.toISO()!, end.toISO()!, newEventId ?? '');
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('appointment patch error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
