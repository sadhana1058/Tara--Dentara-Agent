import { supabase } from './supabase';
import { DateTime } from 'luxon';
import type { ConversationMessage, Clinic } from '@/types';

// ── Clinics ────────────────────────────────────────────────────────────────

export async function getClinicByUsername(username: string): Promise<(Clinic & { password_hash: string }) | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('*')
    .eq('username', username)
    .single();
  if (error) return null;
  return data;
}

export async function getClinicById(id: string): Promise<Clinic | null> {
  const { data, error } = await supabase
    .from('clinics')
    .select('id, clinic_name, doctor_name, google_calendar_id, google_refresh_token, username, created_at, address, phone, timezone, greeting_text, appointment_length, open_time, close_time')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function updateClinicSettings(id: string, fields: Record<string, unknown>) {
  const { error } = await supabase.from('clinics').update(fields).eq('id', id);
  if (error) throw error;
}

export async function updateClinicPassword(id: string, newHash: string) {
  const { error } = await supabase.from('clinics').update({ password_hash: newHash }).eq('id', id);
  if (error) throw error;
}

export async function getClinicForCall(callSid: string): Promise<Clinic | null> {
  const { data, error } = await supabase
    .from('calls')
    .select('clinic_id, clinics(id, clinic_name, doctor_name, google_calendar_id, google_refresh_token, username, created_at)')
    .eq('call_sid', callSid)
    .single();
  if (error || !data?.clinics) return null;
  return data.clinics as unknown as Clinic;
}

// ── Calls ──────────────────────────────────────────────────────────────────

export async function createCall(callSid: string, fromNumber: string | null, clinicId?: string) {
  const { error } = await supabase
    .from('calls')
    .insert({ call_sid: callSid, from_number: fromNumber, conversation: [], clinic_id: clinicId ?? null });
  if (error && error.code !== '23505') throw error;
}

export async function getConversation(callSid: string): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('calls')
    .select('conversation')
    .eq('call_sid', callSid)
    .single();
  if (error) throw error;
  return (data?.conversation as ConversationMessage[]) ?? [];
}

export async function saveConversation(callSid: string, conversation: ConversationMessage[]) {
  const { error } = await supabase
    .from('calls')
    .update({ conversation })
    .eq('call_sid', callSid);
  if (error) throw error;
}

export async function endCall(callSid: string, reason: string) {
  const { error } = await supabase
    .from('calls')
    .update({ status: 'completed', ended_reason: reason })
    .eq('call_sid', callSid);
  if (error) throw error;
}

// ── Appointments ───────────────────────────────────────────────────────────

export async function insertAppointment(args: {
  call_sid: string | null;
  clinic_id: string;
  patient_name: string;
  patient_phone: string;
  start_time: string;
  end_time: string;
  calendar_event_id: string;
}) {
  const { data, error } = await supabase
    .from('appointments')
    .insert(args)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAppointmentById(id: string, clinicId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .single();
  if (error) return null;
  return data;
}

export async function cancelAppointment(id: string, clinicId: string) {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('clinic_id', clinicId);
  if (error) throw error;
}

export async function rescheduleAppointment(id: string, clinicId: string, startTime: string, endTime: string, calendarEventId: string) {
  const { error } = await supabase
    .from('appointments')
    .update({ start_time: startTime, end_time: endTime, calendar_event_id: calendarEventId })
    .eq('id', id)
    .eq('clinic_id', clinicId);
  if (error) throw error;
}

export async function listAppointments(clinicId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('start_time', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

// ── Patients ───────────────────────────────────────────────────────────────

export async function listPatients(clinicId: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updatePatient(id: string, clinicId: string, fields: { name?: string; email?: string | null; notes?: string | null }) {
  const { error } = await supabase
    .from('patients')
    .update(fields)
    .eq('id', id)
    .eq('clinic_id', clinicId);
  if (error) throw error;
}

export async function deletePatient(id: string, clinicId: string) {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)
    .eq('clinic_id', clinicId);
  if (error) throw error;
}

export async function insertPatient(args: {
  clinic_id: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}) {
  const { data, error } = await supabase
    .from('patients')
    .insert(args)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDashboardStats(clinicId: string) {
  const TZ = process.env.CLINIC_TIMEZONE || 'America/New_York';
  const since7d      = DateTime.now().minus({ days: 7 }).toISO()!;
  const startOfToday = DateTime.now().setZone(TZ).startOf('day').toISO()!;

  const [totalCallsRes, bookingsRes, callsTodayRes, apptsTodayRes] = await Promise.all([
    supabase.from('calls').select('call_sid', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('created_at', since7d),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('created_at', since7d),
    supabase.from('calls').select('call_sid', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('created_at', startOfToday),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('created_at', startOfToday),
  ]);

  const totalCalls7d     = totalCallsRes.count ?? 0;
  const bookings7d       = bookingsRes.count ?? 0;
  const callsToday       = callsTodayRes.count ?? 0;
  const appointmentsToday = apptsTodayRes.count ?? 0;

  return {
    totalCalls7d,
    bookings7d,
    conversionRate:    totalCalls7d > 0 ? Math.round((bookings7d / totalCalls7d) * 100) : 0,
    callsToday,
    appointmentsToday,
    expectedRevenue:   appointmentsToday * 350,
    aiEfficiencyRate:  totalCalls7d > 0 ? Math.round((bookings7d / totalCalls7d) * 100) : 0,
  };
}
