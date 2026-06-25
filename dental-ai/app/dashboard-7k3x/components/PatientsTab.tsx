'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PatientUI } from '../types';

interface AddPatientForm {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY_FORM: AddPatientForm = { name: '', phone: '', email: '', notes: '' };

export default function PatientsTab({ patients: initial }: { patients: PatientUI[] }) {
  const router = useRouter();
  const [patients, setPatients]               = useState<PatientUI[]>(initial);
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientUI | null>(null);
  const [editMode, setEditMode]               = useState(false);
  const [editForm, setEditForm]               = useState({ name: '', email: '', notes: '' });
  const [showAddModal, setShowAddModal]       = useState(false);
  const [form, setForm]                       = useState<AddPatientForm>(EMPTY_FORM);
  const [saving, setSaving]                   = useState(false);
  const [editSaving, setEditSaving]           = useState(false);
  const [deleting, setDeleting]               = useState(false);
  const [formError, setFormError]             = useState('');
  const [editError, setEditError]             = useState('');

  function openView(patient: PatientUI) {
    setSelectedPatient(patient);
    setEditMode(false);
    setEditError('');
  }

  function openEdit(patient: PatientUI) {
    setSelectedPatient(patient);
    setEditForm({ name: patient.name, email: patient.email ?? '', notes: patient.notes ?? '' });
    setEditMode(true);
    setEditError('');
  }

  async function handleSaveEdit() {
    if (!selectedPatient || !editForm.name.trim()) {
      setEditError('Name is required.');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name, email: editForm.email, notes: editForm.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setPatients(prev => prev.map(p =>
        p.id === selectedPatient.id
          ? { ...p, name: editForm.name, email: editForm.email || null, notes: editForm.notes || null }
          : p
      ));
      setSelectedPatient(p => p ? { ...p, name: editForm.name, email: editForm.email || null, notes: editForm.notes || null } : null);
      setEditMode(false);
      router.refresh();
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedPatient) return;
    if (!confirm(`Delete ${selectedPatient.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));
      setSelectedPatient(null);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  async function handleAddPatient(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save patient.');
        return;
      }
      const newPatient: PatientUI = {
        id:               data.id,
        phone:            data.phone,
        name:             data.name,
        email:            data.email ?? null,
        notes:            data.notes ?? null,
        lastVisit:        null,
        nextAppointment:  null,
        appointmentCount: 0,
      };
      setPatients((prev) => [newPatient, ...prev]);
      setForm(EMPTY_FORM);
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#181c23]">Patients Directory</h2>
          <p className="text-[#555f6f] text-sm mt-1">All patients registered with your clinic.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0058bc]/5 border border-[#0058bc]/20 px-4 py-2.5 rounded-xl">
            <span className="text-xs font-bold text-[#0058bc]">{patients.length} patients</span>
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0058bc] hover:bg-[#0070eb] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/10"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span>
            Add Patient
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by name or phone number..."
          className="flex-1 bg-transparent text-sm text-[#181c23] outline-none border-none placeholder-gray-400"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-6 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-gray-300">group</span>
            <p className="text-[#555f6f] text-sm">
              {patients.length === 0
                ? 'No patients yet.'
                : 'No patients match your search.'}
            </p>
            {patients.length === 0 && (
              <button
                onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowAddModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0058bc] hover:bg-[#0070eb] text-white rounded-xl text-xs font-bold transition-colors mt-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person_add</span>
                Add your first patient
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#e0e2ed]/40">
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Name</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Phone</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Email</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Last Visit</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Next Appt</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider">Visits</th>
                  <th className="pb-4 font-bold text-xs text-[#555f6f] uppercase tracking-wider text-right">Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e2ed]/30">
                {filtered.map((patient) => (
                  <tr key={patient.id} className="hover:bg-[#ecedf9]/20 transition-all">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#005bc1]/10 text-[#005bc1] font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-[#181c23]">{patient.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-semibold text-[#181c23]">{patient.phone}</td>
                    <td className="py-4 text-xs text-[#555f6f]">{patient.email ?? <span className="italic text-gray-400">—</span>}</td>
                    <td className="py-4 text-xs text-[#555f6f] font-medium">{patient.lastVisit ?? '—'}</td>
                    <td className="py-4">
                      {patient.nextAppointment ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800">
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>calendar_today</span>
                          {patient.nextAppointment}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium text-xs italic">Unscheduled</span>
                      )}
                    </td>
                    <td className="py-4 text-xs font-bold text-[#005bc1]">{patient.appointmentCount}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(patient)}
                          className="text-xs font-bold text-[#555f6f] hover:text-[#005bc1] border border-[#e0e2ed] hover:border-[#005bc1]/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openView(patient)}
                          className="text-xs font-bold text-[#005bc1] hover:text-white border border-[#005bc1]/10 hover:bg-[#005bc1] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Patient detail / edit modal ───────────────────────── */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-[#001a41]/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] border border-[#e0e2ed]/60 max-w-md w-full shadow-2xl animate-zoomIn">
            {/* Header */}
            <div className="p-8 border-b border-[#e0e2ed]/40 flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#005bc1] font-mono">{selectedPatient.phone}</span>
                <h3 className="text-2xl font-black text-[#181c23] tracking-tight mt-1">{selectedPatient.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button
                    onClick={() => openEdit(selectedPatient)}
                    className="text-xs font-bold text-[#555f6f] border border-[#e0e2ed] hover:border-[#0058bc]/30 hover:text-[#0058bc] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => { setSelectedPatient(null); setEditMode(false); }}
                  className="p-1 hover:bg-[#ecedf9] rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-gray-500">close</span>
                </button>
              </div>
            </div>

            {/* View mode */}
            {!editMode && (
              <div className="p-8 space-y-4">
                {[
                  { icon: 'call',           label: 'Phone',            value: selectedPatient.phone },
                  { icon: 'mail',           label: 'Email',            value: selectedPatient.email ?? 'Not provided' },
                  { icon: 'history',        label: 'Last Visit',       value: selectedPatient.lastVisit ?? 'No past visits' },
                  { icon: 'calendar_today', label: 'Next Appointment', value: selectedPatient.nextAppointment ?? 'None scheduled' },
                  { icon: 'bookmark',       label: 'Total Bookings',   value: `${selectedPatient.appointmentCount} appointment${selectedPatient.appointmentCount !== 1 ? 's' : ''}` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0058bc]/5 flex items-center justify-center text-[#0058bc] flex-shrink-0">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{row.icon}</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#555f6f] uppercase tracking-wider">{row.label}</div>
                      <div className="text-sm font-semibold text-[#181c23]">{row.value}</div>
                    </div>
                  </div>
                ))}
                {selectedPatient.notes && (
                  <div className="mt-2 p-4 bg-[#f9f9ff] border border-[#e0e2ed]/60 rounded-2xl">
                    <div className="text-[10px] font-bold text-[#555f6f] uppercase tracking-wider mb-1">Notes</div>
                    <div className="text-sm text-[#181c23] leading-relaxed">{selectedPatient.notes}</div>
                  </div>
                )}
                <div className="pt-4 border-t border-[#e0e2ed]/40">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Delete patient record'}
                  </button>
                </div>
              </div>
            )}

            {/* Edit mode */}
            {editMode && (
              <div className="p-8 space-y-4">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                    {editError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0058bc] transition-colors"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0058bc] transition-colors"
                    value={editForm.email}
                    placeholder="optional"
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0058bc] transition-colors resize-none"
                    value={editForm.notes}
                    placeholder="Allergies, insurance info, etc."
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2.5 border border-[#e0e2ed] text-[#555f6f] font-bold rounded-xl text-sm hover:bg-[#f9f9ff] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={editSaving}
                    className="flex-1 py-2.5 bg-[#0058bc] hover:bg-[#0046a0] text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors"
                  >
                    {editSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add patient modal ──────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#001a41]/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] border border-[#e0e2ed]/60 max-w-md w-full shadow-2xl animate-zoomIn">
            <div className="p-8 border-b border-[#e0e2ed]/40 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-[#0058bc] rounded-md flex items-center justify-center">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>person_add</span>
                  </div>
                  <span className="text-xs font-black text-[#005bc1] uppercase tracking-wider">New Patient</span>
                </div>
                <h3 className="text-xl font-black text-[#181c23] tracking-tight">Add to Directory</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-[#ecedf9] rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="p-8 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="e.g. Sarah Johnson"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0058bc] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-1.5">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                    placeholder="e.g. 4155551234"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0058bc] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="optional"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0058bc] transition-colors"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    placeholder="Allergies, insurance info, etc."
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0058bc] transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-[#e0e2ed] text-[#555f6f] font-bold rounded-xl text-sm hover:bg-[#f9f9ff] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#0058bc] hover:bg-[#0070eb] text-white font-bold rounded-xl text-sm disabled:opacity-60 transition-colors shadow-sm shadow-blue-500/10"
                >
                  {saving ? 'Saving…' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
