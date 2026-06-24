import React, { useState } from "react";
import { Appointment, DashboardStats } from "../types";

interface AppointmentsTabProps {
  appointments: Appointment[];
  stats: DashboardStats;
  onRefresh: () => void;
}

export default function AppointmentsTab({ appointments, stats, onRefresh }: AppointmentsTabProps) {
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleCancelClick = async (apptId: string) => {
    setCancelLoadingId(apptId);
    setErrorToast(null);

    const stored = localStorage.getItem("dentisync_current_dentist");
    const dentistId = stored ? JSON.parse(stored).id : "DEN-001";

    try {
      const res = await fetch(`/api/appointments/${apptId}/cancel?dentistId=${dentistId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Dentist-ID": dentistId
        },
        body: JSON.stringify({ ignoreLockdown: false }),
      });

      if (res.status === 430) {
        const data = await res.json();
        setErrorToast(`${data.error}: ${data.message} Feel free to bypass this check within the 'Scheduler Grid' under Week View.`);
      } else if (res.ok) {
        onRefresh();
      } else {
        setErrorToast("Failed to process transaction cancellation.");
      }
    } catch (e) {
      console.error(e);
      setErrorToast("System processing failure.");
    } finally {
      setCancelLoadingId(null);
    }
  };

  return (
    <div className="flex-1 space-y-8">
      {/* Top Title Bar */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#181c23]">Appointments Feed</h2>
        <p className="text-[#555f6f] text-sm mt-1">Live tracking of active booking sessions and transactional operations.</p>
      </div>

      {/* Critical Warnings / Toast */}
      {errorToast && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex justify-between items-start">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-sm text-red-600 mt-0.5">lock_clock</span>
            <div>
              <span className="font-bold">Clinical Safety Protocol Lock</span>
              <p className="mt-1 leading-relaxed">{errorToast}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorToast(null)}
            className="text-xs font-bold text-red-900 border border-red-200 px-2 py-1 rounded hover:bg-red-100"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Statistics row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 p-6 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-2">Calls Handled</div>
          <div className="text-3xl font-black text-[#181c23]">{stats.callsHandledToday}</div>
          <div className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            <span>+12% vs last week</span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 p-6 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-2">Booked Slots</div>
          <div className="text-3xl font-black text-[#181c23]">{stats.appointmentsScheduledToday}</div>
          <div className="text-[10px] text-[#0058bc] font-bold mt-2">100% CRM Synced</div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 p-6 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-2">Estimated Value</div>
          <div className="text-3xl font-black text-[#181c23]">${stats.expectedRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">monetization_on</span>
            <span>High conversion rate</span>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 p-6 rounded-3xl shadow-sm">
          <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-2">Avg Wait Time</div>
          <div className="text-3xl font-black text-[#181c23]">{stats.avgWaitTime}m</div>
          <div className="text-[10px] text-green-600 font-bold mt-2">Within clinical target</div>
        </div>

        {/* Efficiency Gauge Card */}
        <div className="bg-[#0058bc]/5 border border-[#0058bc]/20 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#0058bc] uppercase tracking-wider mb-2">AI Efficiency</div>
            <div className="text-3xl font-black text-[#181c23]">{stats.aiEfficiencyRate}%</div>
            <div className="text-[10px] text-[#0058bc] font-bold mt-1">Autonomous triage</div>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Visual Gauge circle */}
            <svg className="w-12 h-12 -rotate-90">
              <circle cx="24" cy="24" r="18" fill="none" stroke="#e0e2ed" strokeWidth="3" />
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                stroke="#0058bc"
                strokeWidth="3"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * stats.aiEfficiencyRate) / 100}
              />
            </svg>
            <span className="absolute text-[10px] font-black text-[#005bc1]">%</span>
          </div>
        </div>
      </div>

      {/* Feed Table card */}
      <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center pb-6 mb-6 border-b border-[#e0e2ed]/40">
          <h3 className="font-bold text-lg text-[#181c23]">Today's Clinic Activity Feed</h3>
          <span className="text-xs font-semibold text-[#555f6f]">Total: {appointments.length} appointments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#e0e2ed]/40 pb-4">
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Patient Name</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Reserved Slot</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Procedure type</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Origin Channel</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Status Pill</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">WhatsApp Status</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e2ed]/30">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-[#ecedf9]/20 transition-all">
                  {/* Patient Name */}
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#005bc1]/10 text-[#005bc1] font-bold text-xs flex items-center justify-center overflow-hidden border border-[#005bc1]/10">
                        {appt.patientAvatar ? (
                          <img
                            src={appt.patientAvatar}
                            alt={appt.patientName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          appt.patientName.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#181c23]">{appt.patientName}</div>
                        <div className="text-[10px] text-[#555f6f] font-medium">Patient Ref: {appt.patientId}</div>
                      </div>
                    </div>
                  </td>

                  {/* Reserved slot info */}
                  <td className="py-4">
                    <div className="text-xs font-semibold text-[#181c23]">{appt.time}</div>
                    <div className="text-[10px] text-[#555f6f] font-medium">{appt.date}</div>
                  </td>

                  {/* Procedure type */}
                  <td className="py-4 text-xs font-semibold text-[#181c23]">{appt.procedure}</td>

                  {/* Origin Channel */}
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                      <span className="material-symbols-outlined text-[13px]">
                        {appt.aiHandled ? "smart_toy" : "support_agent"}
                      </span>
                      {appt.aiHandled ? "Voice AI Link" : "Manual Fulfill"}
                    </span>
                  </td>

                  {/* Status Pill */}
                  <td className="py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        appt.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : appt.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {appt.status}
                    </span>
                  </td>

                  {/* WhatsApp metadata status */}
                  <td className="py-4">
                    {appt.whatsAppStatus ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold uppercase tracking-wider text-[10px]">
                        <span className="material-symbols-outlined text-sm">done_all</span>
                        {appt.whatsAppStatus}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium text-xs italic">not requested</span>
                    )}
                  </td>

                  {/* Action cancellations */}
                  <td className="py-4 text-right">
                    {appt.status !== "canceled" ? (
                      <button
                        onClick={() => handleCancelClick(appt.id)}
                        disabled={cancelLoadingId === appt.id}
                        className="text-xs font-bold text-red-600 hover:text-white border border-red-100 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {cancelLoadingId === appt.id ? "Syncing..." : "Cancel"}
                      </button>
                    ) : (
                      <span className="text-xs text-red-700 font-bold italic bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
                        Canceled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
