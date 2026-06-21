export type ConversationMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
};

export type AppointmentBookingArgs = {
  patient_name: string;
  patient_phone: string;
  start_time: string; // ISO 8601 with timezone
};

export type AvailabilityArgs = {
  date: string; // YYYY-MM-DD
};
