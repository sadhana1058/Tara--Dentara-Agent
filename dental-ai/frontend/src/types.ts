export interface Dentist {
  id: string;
  name: string;
  email: string;
  role: 'new_dentist' | 'paid_dentist';
  clinicName: string;
}

export interface Patient {
  id: string; // e.g., "PT-9042"
  dentistId?: string;
  name: string;
  lastVisit: string;
  nextAppointment: string | null;
  contact: string;
  email: string;
  notes: string;
  recentProcedures: string[];
  insuranceProvider: string;
}

export interface Appointment {
  id: string;
  dentistId?: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  time: string; // e.g., "10:30 AM"
  date: string; // YYYY-MM-DD
  duration: number; // in minutes
  procedure: string;
  status: 'confirmed' | 'pending' | 'canceled';
  aiHandled: boolean;
  whatsAppStatus: 'sent' | 'delivered' | 'read' | null;
  notes?: string;
}

export interface Settings {
  receptionistName: string;
  aiActive: boolean;
  voiceModel: string;
  whatsappTemplate: string;
  clinicName: string;
  language: string;
  enableVoiceResponse: boolean;
  autoPmsSync: boolean;
}

export interface DashboardStats {
  callsHandledToday: number;
  appointmentsScheduledToday: number;
  expectedRevenue: number;
  avgWaitTime: number; // in minutes
  aiEfficiencyRate: number; // e.g., 84
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  voiceUrl?: string;
}
