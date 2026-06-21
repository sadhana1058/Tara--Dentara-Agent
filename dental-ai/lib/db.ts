import { supabase } from './supabase';
import type { ConversationMessage } from '@/types';

export async function createCall(callSid: string, fromNumber: string | null) {
  const { error } = await supabase
    .from('calls')
    .insert({ call_sid: callSid, from_number: fromNumber, conversation: [] });
  if (error && error.code !== '23505') throw error; // ignore duplicate
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

export async function insertAppointment(args: {
  call_sid: string;
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

export async function listAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('start_time', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}
