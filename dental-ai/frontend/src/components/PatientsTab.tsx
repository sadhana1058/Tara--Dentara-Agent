import React, { useState } from "react";
import { Patient } from "../types";

interface PatientsTabProps {
  patients: Patient[];
  onRefresh: () => void;
}

export default function PatientsTab({ patients, onRefresh }: PatientsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // New Patient Form State
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newInsurance, setNewInsurance] = useState("Delta Dental");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Patient Edit Notes State inside Inspector
  const [editedNotes, setEditedNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Search filter coordination
  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contact.includes(searchQuery)
  );

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    setIsSubmitting(true);
    const stored = localStorage.getItem("dentisync_current_dentist");
    const dentistId = stored ? JSON.parse(stored).id : "DEN-001";
    try {
      const res = await fetch(`/api/patients?dentistId=${dentistId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Dentist-ID": dentistId
        },
        body: JSON.stringify({
          name: newName,
          contact: newContact,
          email: newEmail,
          insuranceProvider: newInsurance,
          notes: newNotes,
        }),
      });

      if (res.ok) {
        setIsNewPatientModalOpen(false);
        setNewName("");
        setNewContact("");
        setNewEmail("");
        setNewNotes("");
        onRefresh();
      } else {
        alert("Failed to register patient in database.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNotes = async (patientId: string) => {
    setIsSavingNotes(true);
    const stored = localStorage.getItem("dentisync_current_dentist");
    const dentistId = stored ? JSON.parse(stored).id : "DEN-001";
    try {
      const res = await fetch(`/api/patients/${patientId}?dentistId=${dentistId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-Dentist-ID": dentistId
        },
        body: JSON.stringify({ notes: editedNotes }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedPatient(updated);
        onRefresh();
      } else {
        alert("Failed to synchronize dental notes.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="flex-1 space-y-8">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#181c23]">Patients Directory</h2>
          <p className="text-[#555f6f] text-sm mt-1">Direct CRM inspection of active profiles and associated procedures.</p>
        </div>
        <button
          onClick={() => setIsNewPatientModalOpen(true)}
          className="flex items-center gap-2 bg-[#0058bc] hover:bg-[#0070eb] text-white px-5 py-3 rounded-xl font-semibold shadow-md shadow-blue-500/10 cursor-pointer text-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Register Patient
        </button>
      </div>

      {/* Search Bar filter */}
      <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <span className="material-symbols-outlined text-gray-400">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter patients by name, Record ID, or telephone..."
          className="flex-1 bg-transparent text-sm text-[#181c23] outline-none border-none placeholder-gray-400"
        />
      </div>

      {/* Table listing */}
      <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-[#e0e2ed]/40 pb-4">
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Record ID</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Name</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Contact</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider font-semibold">Insurance</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Last Visit</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Scheduled Slot</th>
                <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e2ed]/30">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-[#ecedf9]/20 transition-all">
                  <td className="py-4 text-xs font-bold text-[#005bc1] font-mono">{patient.id}</td>
                  <td className="py-4 font-semibold text-sm text-[#181c23]">{patient.name}</td>
                  <td className="py-4 text-xs font-semibold text-[#181c23]">{patient.contact}</td>
                  <td className="py-4 text-xs text-[#555f6f] font-semibold">{patient.insuranceProvider}</td>
                  <td className="py-4 text-xs text-[#555f6f] font-medium">{patient.lastVisit}</td>
                  <td className="py-4">
                    {patient.nextAppointment ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800">
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        {patient.nextAppointment}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium text-xs italic">Unscheduled</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setEditedNotes(patient.notes);
                      }}
                      className="text-xs font-bold text-[#005bc1] hover:text-white border border-[#005bc1]/10 hover:bg-[#005bc1] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Profile Inspector Modal (Master-Detail) */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-[#001a41]/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] border border-[#e0e2ed]/60 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-zoomIn">
            <div className="p-8 border-b border-[#e0e2ed]/40 flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#005bc1] font-mono">Patient File: {selectedPatient.id}</span>
                <h3 className="text-3xl font-black text-[#181c23] tracking-tight mt-1">{selectedPatient.name}</h3>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1 hover:bg-[#ecedf9] rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Profile specifications Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black text-[#555f6f] uppercase tracking-widest mb-2">
                    Registered Contact parameters
                  </h4>
                  <ul className="space-y-1.5 text-xs font-medium">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs text-[#005bc1]">call</span>
                      <span className="text-[#181c23]">{selectedPatient.contact}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs text-[#005bc1]">mail</span>
                      <span className="text-[#181c23]">{selectedPatient.email || "Contact email missing"}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-[#555f6f] uppercase tracking-widest mb-2">
                    Insurance Underwriting
                  </h4>
                  <ul className="space-y-1.5 text-xs font-medium">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs text-green-600">health_and_safety</span>
                      <span className="text-[#181c23]">{selectedPatient.insuranceProvider}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Recent procedures */}
              <div>
                <h4 className="text-[10px] font-black text-[#555f6f] uppercase tracking-widest mb-3">
                  Recent Procedures ledger
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.recentProcedures && selectedPatient.recentProcedures.length > 0 ? (
                    selectedPatient.recentProcedures.map((proc, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-[#414755] border border-gray-200/50 rounded-lg px-2.5 py-1 text-xs font-semibold"
                      >
                        {proc}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs italic">No procedures recorded in last billing cycle</span>
                  )}
                </div>
              </div>

              {/* Special medical clinical notes with real-time update */}
              <div>
                <h4 className="text-[10px] font-black text-[#555f6f] uppercase tracking-widest mb-3 flex justify-between items-center">
                  <span>Special Medical clinical Notes</span>
                  <span className="text-[9px] font-semibold text-[#005bc1] uppercase">Dental CRM sync active</span>
                </h4>
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium text-[#181c23] focus:border-[#0070eb] focus:ring-1 focus:ring-[#0070eb]/20"
                  placeholder="Insert therapeutic warnings, anxiety modifiers or appointment parameters..."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => handleUpdateNotes(selectedPatient.id)}
                    disabled={isSavingNotes}
                    className="bg-[#0058bc] hover:bg-[#0070eb] text-white px-4 py-2 rounded-xl text-xs font-bold leading-normal shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    {isSavingNotes ? "Saving CRM..." : "Sync Notes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Patient Registration Modal Form */}
      {isNewPatientModalOpen && (
        <div className="fixed inset-0 bg-[#001a41]/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] border border-[#e0e2ed]/60 max-w-md w-full shadow-2xl relative overflow-hidden animate-zoomIn">
            <div className="p-8 border-b border-[#e0e2ed]/40">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-[#181c23] tracking-tight">Register New Profile</h3>
                  <p className="text-xs text-[#555f6f] mt-1">Submit permanent patient profile to clinical dental records.</p>
                </div>
                <button
                  onClick={() => setIsNewPatientModalOpen(false)}
                  className="p-1 hover:bg-[#ecedf9] rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-gray-500">close</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePatient} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Patient Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="E.g., Elena Whittaker"
                  className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Primary telephone</label>
                  <input
                    type="tel"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="+1 (555) 902-1134"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Registered Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="elena.w@whittaker.co"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Insurance Provider</label>
                <input
                  type="text"
                  value={newInsurance}
                  onChange={(e) => setNewInsurance(e.target.value)}
                  placeholder="Delta Dental / Blueshield / self-pay"
                  className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Special Medical Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  placeholder="Odontophobia, morning preferences..."
                  className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                />
              </div>

              <div className="pt-4 border-t border-[#e0e2ed]/40 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsNewPatientModalOpen(false)}
                  className="flex-1 py-4 border border-[#e0e2ed] rounded-xl text-sm font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#0058bc] hover:bg-[#0070eb] text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {isSubmitting ? "Submitting CRM..." : "Submit Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
