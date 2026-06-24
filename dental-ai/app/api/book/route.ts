import { NextRequest } from 'next/server';
import { DateTime } from 'luxon';
import { getCalendarClient } from '@/lib/google';
import { insertAppointment, getClinicById } from '@/lib/db';

const TZ = process.env.CLINIC_TIMEZONE || 'America/New_York';

export async function POST(req: NextRequest) {
  try {
    const { patient_name, patient_phone, start_time, call_sid, clinic_id } = await req.json();

    if (!patient_name || !patient_phone || !start_time || !call_sid) {
      return Response.json({ error: 'missing required fields' }, { status: 400 });
    }

    const start = DateTime.fromISO(start_time, { zone: TZ });
    if (!start.isValid) return Response.json({ error: 'invalid start_time' }, { status: 400 });

    const end = start.plus({ minutes: 30 });

    if (start < DateTime.now())             return Response.json({ error: 'cannot book in the past' },      { status: 400 });
    if (start.hour < 9 || start.hour >= 17) return Response.json({ error: 'outside business hours' },      { status: 400 });
    if (start.minute !== 0 && start.minute !== 30) return Response.json({ error: 'slot must be on the hour or half-hour' }, { status: 400 });

    // Resolve clinic credentials
    const clinic       = clinic_id ? await getClinicById(clinic_id) : null;
    const calendarId   = clinic?.google_calendar_id ?? process.env.GOOGLE_CALENDAR_ID ?? 'primary';
    const refreshToken = clinic?.google_refresh_token ?? undefined;
    const clinicName   = clinic?.clinic_name ?? process.env.CLINIC_NAME ?? 'Dental Office';
    const doctorName   = clinic?.doctor_name ?? 'Doctor';

    const cal = getCalendarClient(refreshToken);

    // Double-booking guard: verify slot is still free right before inserting
    const fb = await cal.freebusy.query({
      requestBody: {
        timeMin:  start.toISO()!,
        timeMax:  end.toISO()!,
        timeZone: TZ,
        items:    [{ id: calendarId }],
      },
    });
    const busy = fb.data.calendars?.[calendarId]?.busy ?? [];
    if (busy.length > 0) {
      return Response.json({ error: 'slot no longer available — please choose another time' }, { status: 409 });
    }

    const event = await cal.events.insert({
      calendarId,
      requestBody: {
        summary:     `${patient_name} — Dental Appointment`,
        description: `Booked via AI receptionist (Tara)\nClinic: ${clinicName}\nDoctor: ${doctorName}\nPhone: ${patient_phone}\nCall SID: ${call_sid}`,
        start: { dateTime: start.toISO()!, timeZone: TZ },
        end:   { dateTime: end.toISO()!,   timeZone: TZ },
      },
    });

    const appointment = await insertAppointment({
      call_sid,
      clinic_id: clinic_id ?? '',
      patient_name,
      patient_phone,
      start_time: start.toISO()!,
      end_time:   end.toISO()!,
      calendar_event_id: event.data.id!,
    });

    return Response.json({
      success:        true,
      confirmation:   `Appointment confirmed for ${start.toFormat("EEEE, MMMM d 'at' h:mm a")}`,
      appointment_id: appointment.id,
    });
  } catch (err: any) {
    console.error('book error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
