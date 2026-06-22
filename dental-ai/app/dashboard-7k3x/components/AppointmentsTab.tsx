'use client';
import Link from 'next/link';
import type { AppointmentUI, StatsUI } from '../types';

interface AppointmentsTabProps {
  appointments: AppointmentUI[];
  stats: StatsUI;
}

export default function AppointmentsTab({ appointments, stats }: AppointmentsTabProps) {
  return (
    <div className="flex-1 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#181c23]">Appointments Feed</h2>
        <p className="text-[#555f6f] text-sm mt-1">Live tracking of all voice AI bookings and call sessions.</p>
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
            <p className="text-[#555f6f] text-sm">No appointments yet. Make a test call to book one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#e0e2ed]/40">
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Patient</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Phone</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Slot</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Channel</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Status</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider text-right">Transcript</th>
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
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>smart_toy</span>
                        Voice AI
                      </span>
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
                      {appt.callSid ? (
                        <Link
                          href={`/dashboard-7k3x/calls/${appt.callSid}`}
                          className="text-xs font-bold text-[#005bc1] hover:text-white border border-[#005bc1]/10 hover:bg-[#005bc1] px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
