export interface AppointmentUI {
  id: string;
  callSid: string | null;
  patientName: string;
  patientPhone: string;
  date: string;       // YYYY-MM-DD in clinic TZ
  time: string;       // "9:00 AM" in clinic TZ
  startTime: string;  // ISO full string
  status: string;
  createdAt: string;  // ISO full string
}

export interface PatientUI {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  notes: string | null;
  lastVisit: string | null;       // YYYY-MM-DD
  nextAppointment: string | null; // "YYYY-MM-DD · h:mm a"
  appointmentCount: number;
}

export interface StatsUI {
  totalCalls7d: number;
  bookings7d: number;
  conversionRate: number;
  callsToday: number;
  appointmentsToday: number;
  expectedRevenue: number;
  aiEfficiencyRate: number;
}

export interface DashboardData {
  appointments: AppointmentUI[];
  patients: PatientUI[];
  stats: StatsUI;
  clinicName: string;
  clinicPhone: string;
  clinicTimezone: string;
}
