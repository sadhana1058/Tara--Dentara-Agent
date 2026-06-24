'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DateTime } from 'luxon';
import type { AppointmentUI, StatsUI } from '../types';

interface AppointmentsTabProps {
  appointments: AppointmentUI[];
  stats: StatsUI;
  clinicId: string;
  clinicTimezone: string;
}

type ModalMode =
  | { mode: 'new' }
  | { mode: 'edit'; appointmentId: string };

interface FormState {
  name: string;
  phone: string;
  date: string;
  slotIso: string;
}

export default function AppointmentsTab({ appointments, stats, clinicId, clinicTimezone }: AppointmentsTabProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalMode | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', phone: '', date: '', slotIso: '' });
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function formatSlot(iso: string) {
    return DateTime.fromISO(iso).setZone(clinicTimezone).toFormat('h:mm a');
  }

  async function fetchSlots(date: string) {
    if (!date) return;
    setSlotsLoading(true);
    setSlots([]);
    setForm(f => ({ ...f, slotIso: '' }));
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, clinic_id: clinicId }),
      });
      const data = await res.json();
      setSlots(data.slots ?? []);
    } finally {
      setSlotsLoading(false);
    }
  }

  function openNew() {
    setForm({ name: '', phone: '', date: '', slotIso: '' });
    setSlots([]);
    setError(null);
    setModal({ mode: 'new' });
  }

  function openEdit(appt: AppointmentUI) {
    setForm({ name: appt.patientName, phone: appt.patientPhone, date: appt.date, slotIso: '' });
    setSlots([]);
    setError(null);
    setModal({ mode: 'edit', appointmentId: appt.id });
    fetchSlots(appt.date);
  }

  function closeModal() {
    setModal(null);
    setError(null);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.phone.trim() || !form.slotIso) {
      setError('Please fill all fields and select a time slot.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (modal?.mode === 'new') {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_name: form.name.trim(),
            patient_phone: form.phone.trim(),
            start_time: form.slotIso,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to book appointment');
      } else if (modal?.mode === 'edit') {
        const res = await fetch(`/api/appointments/${modal.appointmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reschedule', start_time: form.slotIso }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to reschedule');
      }
      closeModal();
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Cancel this appointment? This will also remove it from Google Calendar.')) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCancellingId(null);
    }
  }

  const todayISO = DateTime.now().setZone(clinicTimezone).toFormat('yyyy-MM-dd');

  return (
    <div className="flex-1 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#181c23]">Appointments Feed</h2>
          <p className="text-[#555f6f] text-sm mt-1">Live tracking of all voice AI bookings and call sessions.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#0058bc] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#0046a0] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Appointment
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 p-6 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-2">Calls (Today)</div>
          <div className="text-3xl font-black text-[#181c23]">{stats.callsToday}</div>
          <div className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>smart_toy</span>
            All AI-handled
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 p-6 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-2">Booked (Today)</div>
          <div className="text-3xl font-black text-[#181c23]">{stats.appointmentsToday}</div>
          <div className="text-[10px] text-[#0058bc] font-bold mt-2">Google Cal synced</div>
        </div>
        <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 p-6 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-2">Revenue Est.</div>
          <div className="text-3xl font-black text-[#181c23]">${stats.expectedRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>monetization_on</span>
            $350 / booking
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 p-6 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-2">AI Latency</div>
          <div className="text-3xl font-black text-[#181c23]">~5s</div>
          <div className="text-[10px] text-green-600 font-bold mt-2">Per conversation turn</div>
        </div>
        <div className="bg-[#0058bc]/5 border border-[#0058bc]/20 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#0058bc] uppercase tracking-wider mb-2">Conversion (7d)</div>
            <div className="text-3xl font-black text-[#181c23]">{stats.conversionRate}%</div>
            <div className="text-[10px] text-[#0058bc] font-bold mt-1">Calls → bookings</div>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="18" fill="none" stroke="#e0e2ed" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="18" fill="none" stroke="#0058bc" strokeWidth="3"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * Math.min(stats.conversionRate, 100)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-[#005bc1]">%</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center pb-6 mb-6 border-b border-[#e0e2ed]/40">
          <h3 className="font-bold text-lg text-[#181c23]">All Bookings</h3>
          <span className="text-xs font-semibold text-[#555f6f]">Total: {appointments.length} appointments</span>
        </div>

        {appointments.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-gray-300">event_note</span>
            <p className="text-[#555f6f] text-sm">No appointments yet. Make a test call or create one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#e0e2ed]/40">
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Patient</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Phone</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Slot</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Channel</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Status</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e2ed]/30">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#ecedf9]/20 transition-all">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#005bc1]/10 text-[#005bc1] font-bold text-xs flex items-center justify-center border border-[#005bc1]/10 flex-shrink-0">
                          {appt.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-sm text-[#181c23]">{appt.patientName}</div>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-semibold text-[#181c23]">{appt.patientPhone}</td>
                    <td className="py-4">
                      <div className="text-xs font-semibold text-[#181c23]">{appt.time}</div>
                      <div className="text-[10px] text-[#555f6f] font-medium">{appt.date}</div>
                    </td>
                    <td className="py-4">
                      {appt.callSid ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>smart_toy</span>
                          Voice AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700">
                          <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>person</span>
                          Portal
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        appt.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : appt.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {appt.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => openEdit(appt)}
                              className="text-xs font-bold text-[#555f6f] hover:text-[#005bc1] border border-[#e0e2ed] hover:border-[#005bc1]/30 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancel(appt.id)}
                              disabled={cancellingId === appt.id}
                              className="text-xs font-bold text-red-600 hover:text-white border border-red-200 hover:bg-red-500 hover:border-red-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {cancellingId === appt.id ? '…' : 'Cancel'}
                            </button>
                          </>
                        )}
                        {appt.callSid ? (
                          <Link
                            href={`/dashboard-7k3x/calls/${appt.callSid}`}
                            className="text-xs font-bold text-[#005bc1] hover:text-white border border-[#005bc1]/10 hover:bg-[#005bc1] px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Transcript
                          </Link>
                        ) : (
                          !('confirmed' === appt.status) || null
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#181c23]">
                {modal.mode === 'new' ? 'New Appointment' : 'Reschedule Appointment'}
              </h3>
              <button onClick={closeModal} className="text-[#555f6f] hover:text-[#181c23] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  disabled={modal.mode === 'edit'}
                  placeholder="e.g. John Smith"
                  className="w-full border border-[#e0e2ed] rounded-xl px-4 py-2.5 text-sm text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#0058bc]/30 focus:border-[#0058bc] disabled:bg-gray-50 disabled:text-[#555f6f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  disabled={modal.mode === 'edit'}
                  placeholder="e.g. 555-123-4567"
                  className="w-full border border-[#e0e2ed] rounded-xl px-4 py-2.5 text-sm text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#0058bc]/30 focus:border-[#0058bc] disabled:bg-gray-50 disabled:text-[#555f6f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  min={todayISO}
                  onChange={e => {
                    setForm(f => ({ ...f, date: e.target.value, slotIso: '' }));
                    fetchSlots(e.target.value);
                  }}
                  className="w-full border border-[#e0e2ed] rounded-xl px-4 py-2.5 text-sm text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#0058bc]/30 focus:border-[#0058bc]"
                />
              </div>

              {form.date && (
                <div>
                  <label className="block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5">
                    Available Slots
                  </label>
                  {slotsLoading ? (
                    <div className="text-sm text-[#555f6f] py-3 text-center">Loading slots…</div>
                  ) : slots.length === 0 ? (
                    <div className="text-sm text-[#555f6f] py-3 text-center">No available slots for this date.</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {slots.map(iso => (
                        <button
                          key={iso}
                          onClick={() => setForm(f => ({ ...f, slotIso: iso }))}
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                            form.slotIso === iso
                              ? 'bg-[#0058bc] text-white border-[#0058bc]'
                              : 'bg-white text-[#181c23] border-[#e0e2ed] hover:border-[#0058bc]/40'
                          }`}
                        >
                          {formatSlot(iso)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-[#e0e2ed] text-sm font-bold text-[#555f6f] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.slotIso}
                className="flex-1 py-2.5 rounded-xl bg-[#0058bc] text-white text-sm font-bold hover:bg-[#0046a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving…' : modal.mode === 'new' ? 'Book Appointment' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
