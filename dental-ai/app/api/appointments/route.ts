import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { DateTime } from 'luxon';
import { getCalendarClient } from '@/lib/google';
import { insertAppointment, getClinicById } from '@/lib/db';

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

export async function POST(req: NextRequest) {
  try {
    const clinicId = await getClinicIdFromCookie(req);
    if (!clinicId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { patient_name, patient_phone, start_time } = await req.json();

    if (!patient_name || !patient_phone || !start_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = DateTime.fromISO(start_time, { zone: TZ });
    if (!start.isValid) return Response.json({ error: 'Invalid start_time' }, { status: 400 });
    if (start < DateTime.now()) return Response.json({ error: 'Cannot book in the past' }, { status: 400 });
    if (start.hour < 9 || start.hour >= 17) return Response.json({ error: 'Outside business hours' }, { status: 400 });

    const end = start.plus({ minutes: 30 });

    const clinic = await getClinicById(clinicId);
    const calendarId = clinic?.google_calendar_id ?? process.env.GOOGLE_CALENDAR_ID ?? 'primary';
    const clinicName = clinic?.clinic_name ?? process.env.CLINIC_NAME ?? 'Dental Office';
    const doctorName = clinic?.doctor_name ?? 'Doctor';

    const cal = getCalendarClient(clinic?.google_refresh_token ?? undefined);
    const event = await cal.events.insert({
      calendarId,
      requestBody: {
        summary: `${patient_name} — Dental Appointment`,
        description: `Booked via portal\nClinic: ${clinicName}\nDoctor: ${doctorName}\nPhone: ${patient_phone}`,
        start: { dateTime: start.toISO()!, timeZone: TZ },
        end: { dateTime: end.toISO()!, timeZone: TZ },
      },
    });

    const appointment = await insertAppointment({
      call_sid: null,
      clinic_id: clinicId,
      patient_name,
      patient_phone: patient_phone.replace(/\D/g, ''),
      start_time: start.toISO()!,
      end_time: end.toISO()!,
      calendar_event_id: event.data.id!,
    });

    return Response.json({ success: true, appointment_id: appointment.id });
  } catch (err: any) {
    console.error('portal book error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
