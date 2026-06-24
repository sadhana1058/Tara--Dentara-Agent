import React, { useState } from "react";
import { Appointment, Patient } from "../types";

interface CalendarTabProps {
  appointments: Appointment[];
  patients: Patient[];
  onRefresh: () => void;
  openNewApptModal: boolean;
  setOpenNewApptModal: (open: boolean) => void;
}

export default function CalendarTab({
  appointments,
  patients,
  onRefresh,
  openNewApptModal,
  setOpenNewApptModal,
}: CalendarTabProps) {
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // New Appointment Form State
  const [formPatientId, setFormPatientId] = useState("");
  const [formDate, setFormDate] = useState("2024-10-15");
  const [formTime, setFormTime] = useState("10:00 AM");
  const [formProcedure, setFormProcedure] = useState("Standard Cleaning");
  const [formNotes, setFormNotes] = useState("");
  const [formDuration, setFormDuration] = useState("60");
  const [formAiHandled, setFormAiHandled] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const daysOfWeek = [
    { label: "Mon, Oct 14", dateKey: "2024-10-14" },
    { label: "Tue, Oct 15", dateKey: "2024-10-15" },
    { label: "Wed, Oct 16", dateKey: "2024-10-16" },
    { label: "Thu, Oct 17", dateKey: "2024-10-17" },
    { label: "Fri, Oct 18", dateKey: "2024-10-18" },
  ];

  const timeSlots = ["09:00 AM", "10:15 AM", "11:30 AM", "01:00 PM", "02:00 PM", "03:30 PM", "04:45 PM"];

  const getSlotAppointment = (dateKey: string, time: string) => {
    return appointments.find((a) => a.date === dateKey && a.time === time);
  };

  const handleSelectSlot = (dateKey: string, time: string) => {
    const appt = getSlotAppointment(dateKey, time);
    if (appt) {
      setSelectedAppt(appt);
      setCancelMessage(null);
      setCancelError(null);
    } else {
      // open create modal prefilled
      setFormDate(dateKey);
      setFormTime(time);
      setOpenNewApptModal(true);
    }
  };

  // Create Appointment Handlers
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId) return alert("Please select a patient to sync.");

    setFormSubmitting(true);
    const stored = localStorage.getItem("dentisync_current_dentist");
    const dentistId = stored ? JSON.parse(stored).id : "DEN-001";
    try {
      const res = await fetch(`/api/appointments?dentistId=${dentistId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Dentist-ID": dentistId
        },
        body: JSON.stringify({
          patientId: formPatientId,
          date: formDate,
          time: formTime,
          duration: formDuration,
          procedure: formProcedure,
          aiHandled: formAiHandled,
          notes: formNotes,
        }),
      });

      if (res.ok) {
        setOpenNewApptModal(false);
        setFormPatientId("");
        setFormNotes("");
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Failed to sync appointment: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Secure Cancellation with 30-Minute Safe-Check Handler
  const handleCancelAppointment = async (apptId: string) => {
    setCancelLoading(true);
    setCancelMessage(null);
    setCancelError(null);

    const stored = localStorage.getItem("dentisync_current_dentist");
    const dentistId = stored ? JSON.parse(stored).id : "DEN-001";
    try {
      const res = await fetch(`/api/appointments/${apptId}/cancel?dentistId=${dentistId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Dentist-ID": dentistId
        },
        body: JSON.stringify({ ignoreLockdown: false }), // test strict rules first
      });

      if (res.status === 430) {
        const data = await res.json();
        setCancelError(`${data.error}: ${data.message}`);
      } else if (res.ok) {
        setCancelMessage("Appointment successfully canceled.");
        onRefresh();
        setSelectedAppt(null);
      } else {
        setCancelError("An error occurred during cancellation processing.");
      }
    } catch (e) {
      console.error(e);
      setCancelError("System communications failure.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleForceCancelAppointment = async (apptId: string) => {
    setCancelLoading(true);
    setCancelMessage(null);
    setCancelError(null);

    const stored = localStorage.getItem("dentisync_current_dentist");
    const dentistId = stored ? JSON.parse(stored).id : "DEN-001";
    try {
      const res = await fetch(`/api/appointments/${apptId}/cancel?dentistId=${dentistId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Dentist-ID": dentistId
        },
        body: JSON.stringify({ ignoreLockdown: true }), // bypass critical lockdown safeguards
      });

      if (res.ok) {
        setCancelMessage("Safeguard bypassed. Appointment successfully canceled.");
        onRefresh();
        setSelectedAppt(null);
      } else {
        setCancelError("An error occurred during force cancellation.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#181c23]">Scheduler Grid</h2>
          <p className="text-[#555f6f] text-sm mt-1">Week View • Oct 14 – Oct 18, 2024</p>
        </div>
        <button
          onClick={() => {
            setFormPatientId("");
            setOpenNewApptModal(true);
          }}
          className="flex items-center gap-2 bg-[#0058bc] hover:bg-[#0070eb] text-white px-5 py-3 rounded-xl font-semibold shadow-md shadow-blue-500/10 cursor-pointer text-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Slot
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Calendar Grid - Col span 8 */}
        <div className="col-span-12 xl:col-span-8 bg-white/70 backdrop-blur-lg rounded-[2rem] border border-[#e0e2ed]/50 p-6 overflow-x-auto shadow-sm">
          <div className="min-w-[650px]">
            {/* Headers Day names */}
            <div className="grid grid-cols-11 gap-2 border-b border-[#e0e2ed]/40 pb-4 mb-4">
              <div className="col-span-1 flex items-center justify-center font-bold text-xs text-[#555f6f] uppercase tracking-wider">
                Time
              </div>
              {daysOfWeek.map((day) => (
                <div key={day.dateKey} className="col-span-2 text-center">
                  <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider">{day.label.split(",")[0]}</div>
                  <div className="text-sm font-semibold text-[#181c23] mt-1">{day.label.split(",")[1]}</div>
                </div>
              ))}
            </div>

            {/* Time slot rows */}
            <div className="space-y-3">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-11 gap-2 items-center">
                  {/* Time label */}
                  <div className="col-span-1 text-center font-bold text-xs text-[#555f6f]">{time}</div>

                  {/* Day Columns */}
                  {daysOfWeek.map((day) => {
                    const appt = getSlotAppointment(day.dateKey, time);
                    const isSelected = selectedAppt?.id === appt?.id;

                    return (
                      <div
                        key={`${day.dateKey}-${time}`}
                        onClick={() => handleSelectSlot(day.dateKey, time)}
                        className={`col-span-2 h-20 rounded-2xl border flex flex-col justify-between p-3 transition-all cursor-pointer relative group overflow-hidden ${
                          appt
                            ? appt.status === "canceled"
                              ? "bg-red-50/50 border-red-200/50 opacity-65 text-red-700/80 line-through"
                              : isSelected
                              ? "bg-[#0070eb] text-white border-[#0058bc] shadow-md relative z-10"
                              : appt.aiHandled
                              ? "bg-[#0058bc]/5 border-[#0058bc]/20 hover:bg-[#0058bc]/10 text-[#005bc1]"
                              : "bg-white border-[#e0e2ed] hover:border-[#005bc1] hover:shadow-sm"
                            : "border-dashed border-[#e0e2ed] hover:bg-[#0058bc]/5 hover:border-[#005bc1]/40"
                        }`}
                      >
                        {appt ? (
                          <>
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-xs font-bold truncate block leading-tight">{appt.patientName}</span>
                              {appt.aiHandled && (
                                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-[10px] font-medium opacity-80 truncate block">{appt.procedure}</span>
                              {appt.whatsAppStatus && (
                                <span
                                  className={`material-symbols-outlined text-xs ${
                                    isSelected ? "text-white" : "text-green-600"
                                  }`}
                                >
                                  check_circle
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-full gap-1 transition-opacity">
                            <span className="material-symbols-outlined text-xs text-[#0058bc]">add_circle</span>
                            <span className="text-[10px] font-bold text-[#0058bc] uppercase tracking-wider">Book</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected slot inspect panel - Col span 4 */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {selectedAppt ? (
            <div className="bg-white/70 backdrop-blur-lg rounded-[2rem] border border-[#e0e2ed]/50 p-6 shadow-sm flex flex-col h-full relative">
              <div className="flex justify-between items-start border-b border-[#e0e2ed]/40 pb-6 mb-6">
                <h3 className="font-bold text-lg text-[#181c23]">Slot Transaction Ledger</h3>
                <span className="text-[10px] bg-[#ecedf9] px-2.5 py-1 rounded-full text-[#555f6f] font-black uppercase tracking-wider">
                  Details
                </span>
              </div>

              {/* Patient Badge */}
              <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#005bc1]/10 flex items-center justify-center text-[#005bc1] font-bold text-md">
                  {selectedAppt.patientName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-sm text-[#181c23]">{selectedAppt.patientName}</div>
                  <div className="text-xs text-[#555f6f] font-medium">Record ID: {selectedAppt.patientId}</div>
                </div>
              </div>

              {/* Specs parameters */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs font-semibold py-1 border-b border-gray-100">
                  <span className="text-[#555f6f]">Proposed Slot</span>
                  <span className="text-[#181c23]">
                    {selectedAppt.date} @ {selectedAppt.time}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-semibold py-1 border-b border-gray-100">
                  <span className="text-[#555f6f]">Procedure Care</span>
                  <span className="text-[#181c23]">{selectedAppt.procedure}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold py-1 border-b border-gray-100">
                  <span className="text-[#555f6f]">Channel Origin</span>
                  <span className="text-[#181c23] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      {selectedAppt.aiHandled ? "smart_toy" : "support_agent"}
                    </span>
                    {selectedAppt.aiHandled ? "DentiSync Voice AI" : "Manual Receptionist"}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-semibold py-1 border-b border-gray-100">
                  <span className="text-[#555f6f]">WhatsApp API status</span>
                  <span
                    className={`font-black uppercase tracking-widest text-[9px] ${
                      selectedAppt.whatsAppStatus ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    ● {selectedAppt.whatsAppStatus ? selectedAppt.whatsAppStatus : "unsigned"}
                  </span>
                </div>
              </div>

              {/* Transactions Log Section */}
              <div className="bg-[#ecedf9]/30 rounded-2xl border border-[#c1c6d7]/30 p-4 flex-1 mb-6">
                <h4 className="text-[10px] font-black text-[#555f6f] uppercase tracking-widest mb-4">
                  Audit logs (Dentrix CRM)
                </h4>
                <div className="space-y-3">
                  <div className="flex gap-2 items-start text-xs font-medium">
                    <span className="material-symbols-outlined text-[14px] text-[#005bc1] mt-0.5">done_all</span>
                    <div>
                      <span className="text-[#181c23] font-bold">Slot locked</span>
                      <p className="text-[#555f6f] text-[10px]">CRM database index successfully synced.</p>
                    </div>
                  </div>
                  {selectedAppt.aiHandled && (
                    <div className="flex gap-2 items-start text-xs font-medium">
                      <span className="material-symbols-outlined text-[14px] text-green-600 mt-0.5">sms</span>
                      <div>
                        <span className="text-[#181c23] font-bold">WhatsApp notification template sent</span>
                        <p className="text-[#555f6f] text-[10px]">Instant booking notification matched client.</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 items-start text-xs font-medium">
                    <span className="material-symbols-outlined text-[14px] text-[#005bc1] mt-0.5">sync_alt</span>
                    <div>
                      <span className="text-[#181c23] font-bold">Practitioner slot reserved</span>
                      <p className="text-[#555f6f] text-[10px]">Lead practitioner calendar allocated.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Cancellation and Safeguards Alert Banner */}
              {cancelError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl mb-4 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-red-600 mt-0.5">lock_clock</span>
                    <div>
                      <div className="font-bold">Cancellation Lock Alert</div>
                      <p className="mt-1 leading-relaxed">{cancelError}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => handleForceCancelAppointment(selectedAppt.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      Bypass Safeguard (Force Cancel)
                    </button>
                  </div>
                </div>
              )}

              {cancelMessage && <div className="p-4 bg-green-50 text-green-800 rounded-xl mb-4 text-xs">{cancelMessage}</div>}

              {/* Action operations Button */}
              {selectedAppt.status !== "canceled" ? (
                <button
                  disabled={cancelLoading}
                  onClick={() => handleCancelAppointment(selectedAppt.id)}
                  className="w-full py-4 border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer text-sm"
                >
                  {cancelLoading ? "Processing in CRM..." : "Cancel Appointment"}
                </button>
              ) : (
                <div className="text-center py-3 bg-red-50 text-red-700 font-bold rounded-xl text-sm italic border border-red-100">
                  Transaction Canceled
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-lg rounded-[2rem] border border-[#e0e2ed]/50 p-8 shadow-sm text-center py-20">
              <span className="material-symbols-outlined text-5xl text-gray-300 animate-pulse">flowsheet</span>
              <h3 className="font-bold text-md text-[#181c23] mt-4">Inspect Slot parameters</h3>
              <p className="text-xs text-[#555f6f] mt-1 max-w-xs mx-auto leading-relaxed">
                Click on any scheduler appointment slot card to analyze its live diagnostic ledger files, sync states, and
                WhatsApp status parameters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Modal Form Overlay */}
      {openNewApptModal && (
        <div className="fixed inset-0 bg-[#001a41]/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] border border-[#e0e2ed]/60 max-w-md w-full shadow-2xl relative overflow-hidden animate-zoomIn">
            <div className="p-8 border-b border-[#e0e2ed]/40">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-[#181c23] tracking-tight">Sync New Slot</h3>
                  <p className="text-xs text-[#555f6f] mt-1">Book directly into clinical Dentrix calendar databases.</p>
                </div>
                <button
                  onClick={() => setOpenNewApptModal(false)}
                  className="p-1 hover:bg-[#ecedf9] rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-gray-500">close</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-8 space-y-5">
              {/* Patient Selection list */}
              <div>
                <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">
                  Select Patient to Sync
                </label>
                <select
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ID: {p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Time</label>
                  <select
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                    required
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Procedure Care</label>
                <select
                  value={formProcedure}
                  onChange={(e) => setFormProcedure(e.target.value)}
                  className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                  required
                >
                  <option value="Standard Cleaning">Standard Cleaning</option>
                  <option value="Emergency Filling">Emergency Filling</option>
                  <option value="Orthodontic Aligner Update">Orthodontic Aligner Update</option>
                  <option value="Dental Implant Followup">Dental Implant Followup</option>
                  <option value="Root Canal stage 2">Root Canal stage 2</option>
                </select>
              </div>

              {/* Toggle to simulate AI handling */}
              <div className="flex items-center gap-3 py-2 bg-blue-50/40 border border-blue-100 px-4 rounded-xl">
                <input
                  type="checkbox"
                  id="formResponseAI"
                  checked={formAiHandled}
                  onChange={(e) => setFormAiHandled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#0058bc]"
                />
                <label htmlFor="formResponseAI" className="text-xs font-semibold text-[#005bc1] cursor-pointer">
                  Fulfill via AI Voice Receptionist Link
                </label>
              </div>

              <div className="pt-4 border-t border-[#e0e2ed]/40 flex gap-4">
                <button
                  type="button"
                  onClick={() => setOpenNewApptModal(false)}
                  className="flex-1 py-4 border border-[#e0e2ed] rounded-xl text-sm font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-4 bg-[#0058bc] hover:bg-[#0070eb] text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {formSubmitting ? "Syncing CRM..." : "Sync Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
