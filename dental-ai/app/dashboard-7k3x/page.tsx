import { headers } from 'next/headers';
import { DateTime } from 'luxon';
import { listAppointments, getDashboardStats, getClinicById, listPatients } from '@/lib/db';
import DashboardShell from './components/DashboardShell';
import type { AppointmentUI, PatientUI, DashboardData } from './types';

export const dynamic = 'force-dynamic';

const TZ = process.env.CLINIC_TIMEZONE || 'America/New_York';

export default async function Dashboard() {
  const clinicId = headers().get('x-clinic-id') ?? '';

  const [rawAppointments, stats, clinic, rawPatients] = await Promise.all([
    listAppointments(clinicId),
    getDashboardStats(clinicId),
    getClinicById(clinicId),
    listPatients(clinicId).catch(() => [] as any[]),
  ]);

  const clinicName  = clinic?.clinic_name ?? 'Dental Office';
  const clinicPhone = process.env.TWILIO_PHONE_NUMBER ?? '';

  const appointments: AppointmentUI[] = (rawAppointments ?? []).map((a: any) => {
    const dt = DateTime.fromISO(a.start_time).setZone(TZ);
    return {
      id:           a.id,
      callSid:      a.call_sid ?? null,
      patientName:  a.patient_name,
      patientPhone: a.patient_phone,
      date:         dt.toFormat('yyyy-MM-dd'),
      time:         dt.toFormat('h:mm a'),
      startTime:    a.start_time,
      status:       a.status,
      createdAt:    a.created_at,
    };
  });

  // Build appointment stats per phone number
  const now    = DateTime.now().setZone(TZ);
  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const apptStats = new Map<string, { lastVisit: string | null; nextAppointment: string | null; count: number }>();

  for (const a of sorted) {
    const isPast = DateTime.fromISO(a.startTime).setZone(TZ) < now;
    const s = apptStats.get(a.patientPhone) ?? { lastVisit: null, nextAppointment: null, count: 0 };
    s.count++;
    if (isPast) s.lastVisit = a.date;
    else if (!s.nextAppointment) s.nextAppointment = `${a.date} · ${a.time}`;
    apptStats.set(a.patientPhone, s);
  }

  // Build patients list: real DB records first, then anyone from appointments not yet in DB
  const patientsFromDB: PatientUI[] = (rawPatients ?? []).map((p: any) => {
    const stats = apptStats.get(p.phone) ?? { lastVisit: null, nextAppointment: null, count: 0 };
    return {
      id:               p.id,
      phone:            p.phone,
      name:             p.name,
      email:            p.email ?? null,
      notes:            p.notes ?? null,
      lastVisit:        stats.lastVisit,
      nextAppointment:  stats.nextAppointment,
      appointmentCount: stats.count,
    };
  });

  const knownPhones = new Set(patientsFromDB.map((p) => p.phone));
  const patientsFromAppts: PatientUI[] = [];
  const seen = new Set<string>();
  for (const a of appointments) {
    if (knownPhones.has(a.patientPhone) || seen.has(a.patientPhone)) continue;
    seen.add(a.patientPhone);
    const s = apptStats.get(a.patientPhone)!;
    patientsFromAppts.push({
      id:               a.patientPhone, // fallback id
      phone:            a.patientPhone,
      name:             a.patientName,
      email:            null,
      notes:            null,
      lastVisit:        s.lastVisit,
      nextAppointment:  s.nextAppointment,
      appointmentCount: s.count,
    });
  }

  const data: DashboardData = {
    appointments,
    patients:       [...patientsFromDB, ...patientsFromAppts],
    stats,
    clinicName,
    clinicPhone,
    clinicTimezone: TZ,
    clinicId,
  };

  return <DashboardShell data={data} />;
}
