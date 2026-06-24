'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ClinicSettings } from '../types';

const TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern Time (ET)'      },
  { value: 'America/Chicago',     label: 'Central Time (CT)'      },
  { value: 'America/Denver',      label: 'Mountain Time (MT)'     },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)'      },
  { value: 'America/Phoenix',     label: 'Arizona (no DST)'       },
  { value: 'America/Anchorage',   label: 'Alaska Time'            },
  { value: 'Pacific/Honolulu',    label: 'Hawaii Time'            },
];

interface Toast { msg: string; ok: boolean }

export default function SettingsTab({ settings }: { settings: ClinicSettings }) {
  const router = useRouter();

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<Toast | null>(null);
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Per-card saving ────────────────────────────────────────────────────────
  const [saving, setSaving] = useState<string | null>(null);

  async function save(section: string, body: Record<string, unknown>) {
    setSaving(section);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      showToast('Changes saved');
      router.refresh();
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSaving(null);
    }
  }

  // ── Card 1: Business Profile ───────────────────────────────────────────────
  const [profile, setProfile] = useState({
    clinic_name: settings.clinicName,
    doctor_name: settings.doctorName,
    address:     settings.address,
    phone:       settings.phone,
    timezone:    settings.timezone,
  });

  // ── Card 4: Voice & Greeting ───────────────────────────────────────────────
  const DEFAULT_GREETING = `Hello, thank you for calling ${settings.clinicName}. This is Tara, the AI receptionist. How can I help you today?`;
  const [voice, setVoice] = useState({
    greeting_text:       settings.greetingText || DEFAULT_GREETING,
    appointment_length:  settings.appointmentLength,
  });

  // ── Card 5: Business Hours ─────────────────────────────────────────────────
  const [hours, setHours] = useState({
    open_time:  settings.openTime,
    close_time: settings.closeTime,
  });

  // ── Card 6: Security ───────────────────────────────────────────────────────
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  async function changePassword() {
    if (pw.next !== pw.confirm) { showToast('New passwords do not match', false); return; }
    if (pw.next.length < 8)     { showToast('Password must be at least 8 characters', false); return; }
    setPwSaving(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast('Password updated');
      setPw({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setPwSaving(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const inputCls = 'w-full border border-[#e0e2ed] rounded-xl px-4 py-2.5 text-sm text-[#181c23] bg-white focus:outline-none focus:ring-2 focus:ring-[#0058bc]/25 focus:border-[#0058bc] transition-colors';
  const labelCls = 'block text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-1.5';

  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') return `+1 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
    return raw;
  }

  function SaveBtn({ section, disabled }: { section: string; disabled?: boolean }) {
    return (
      <div className="flex justify-end pt-4 border-t border-[#e0e2ed]/40 mt-6">
        <button
          onClick={() => {
            if (section === 'profile') save('profile', profile);
            if (section === 'voice')   save('voice',   voice);
            if (section === 'hours')   save('hours',   hours);
          }}
          disabled={saving === section || disabled}
          className="flex items-center gap-2 bg-[#0058bc] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#0046a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving === section ? (
            <>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span>
              Saving…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
              Save Changes
            </>
          )}
        </button>
      </div>
    );
  }

  function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
    return (
      <div className="bg-white border border-[#e0e2ed]/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e0e2ed]/40">
          <h3 className="font-bold text-base text-[#181c23]">{title}</h3>
          <p className="text-[#555f6f] text-xs mt-0.5">{desc}</p>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 pb-16 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#181c23]">Settings</h2>
        <p className="text-[#555f6f] text-sm mt-1">Manage your clinic profile, Tara's voice, and booking preferences.</p>
      </div>

      {/* ── Card 1: Business Profile ── */}
      <Card title="Business Profile" desc="The name, doctor, and contact details that Tara uses when speaking to patients.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Clinic Name</label>
              <input className={inputCls} value={profile.clinic_name}
                onChange={e => setProfile(p => ({ ...p, clinic_name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Doctor Name</label>
              <input className={inputCls} value={profile.doctor_name}
                onChange={e => setProfile(p => ({ ...p, doctor_name: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Address Tara gives callers in emergencies</label>
            <input className={inputCls} value={profile.address} placeholder="e.g. 123 Main Street, San Jose, CA 95101"
              onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
            <p className="text-[10px] text-[#555f6f] mt-1">When a patient says they have a dental emergency, Tara says "Please come to [this address] right away."</p>
          </div>

          <div>
            <label className={labelCls}>Timezone</label>
            <select className={inputCls} value={profile.timezone}
              onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}>
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
        <SaveBtn section="profile" />
      </Card>

      {/* ── Card 2: Calendar Connection ── */}
      <Card title="Calendar Connection" desc="Appointments Tara books appear in your Google Calendar automatically.">
        {settings.calendarConnected ? (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600" style={{ fontSize: '20px' }}>calendar_month</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Connected
                  </span>
                </div>
                <div className="text-sm font-medium text-[#181c23] mt-0.5">{settings.calendarEmail}</div>
              </div>
            </div>
            <button className="text-xs font-bold text-[#555f6f] border border-[#e0e2ed] px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              Reconnect Account
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '20px' }}>calendar_month</span>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                  Not connected
                </span>
                <div className="text-xs text-[#555f6f] mt-0.5">Tara can't book appointments without this.</div>
              </div>
            </div>
            <button className="text-xs font-bold text-white bg-[#0058bc] px-4 py-2 rounded-xl hover:bg-[#0046a0] transition-colors">
              Connect Google Calendar
            </button>
          </div>
        )}
      </Card>

      {/* ── Card 3: Phone Number ── */}
      <Card title="Patient Phone Number" desc="This is the number to share with patients and print on appointment cards.">
        <div className="flex items-center gap-4 p-4 bg-[#f9f9ff] border border-[#e0e2ed]/60 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-[#0058bc]/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#0058bc]" style={{ fontSize: '24px' }}>call</span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#181c23] tracking-tight">{formatPhone(settings.phone)}</div>
            <div className="text-xs text-[#555f6f] mt-0.5">Patients call this number to speak with Tara and book appointments.</div>
          </div>
        </div>
        <p className="text-[10px] text-[#555f6f] mt-3">To change this number, contact your account administrator.</p>
      </Card>

      {/* ── Card 4: Voice & Greeting ── */}
      <Card title="Voice & Greeting" desc="Customize what Tara says when she picks up the phone.">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Greeting Script</label>
            <textarea
              rows={3}
              className={`${inputCls} resize-none`}
              value={voice.greeting_text}
              onChange={e => setVoice(v => ({ ...v, greeting_text: e.target.value }))}
            />
            <p className="text-[10px] text-[#555f6f] mt-1">This is the first thing patients hear when Tara picks up. Keep it under 30 words.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Default Appointment Length</label>
              <select className={inputCls} value={voice.appointment_length}
                onChange={e => setVoice(v => ({ ...v, appointment_length: Number(e.target.value) }))}>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Voice</label>
              <div className={`${inputCls} flex items-center gap-2 cursor-not-allowed bg-gray-50`}>
                <span className="material-symbols-outlined text-[#555f6f]" style={{ fontSize: '16px' }}>record_voice_over</span>
                <span className="text-[#555f6f]">Eric</span>
                <span className="ml-auto text-[10px] font-bold text-[#555f6f] bg-gray-100 px-2 py-0.5 rounded-full">Locked</span>
              </div>
            </div>
          </div>
        </div>
        <SaveBtn section="voice" />
      </Card>

      {/* ── Card 5: Business Hours ── */}
      <Card title="Business Hours" desc="Tara will only offer appointment slots within these hours, Monday through Friday.">
        <div className="space-y-4">
          <div className="p-4 bg-[#f9f9ff] border border-[#e0e2ed]/60 rounded-xl">
            <div className="text-xs font-bold text-[#555f6f] uppercase tracking-wider mb-3">Monday – Friday</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Opens at</label>
                <input type="time" className={inputCls} value={hours.open_time}
                  onChange={e => setHours(h => ({ ...h, open_time: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Closes at</label>
                <input type="time" className={inputCls} value={hours.close_time}
                  onChange={e => setHours(h => ({ ...h, close_time: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#555f6f]">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
            Weekends are always closed. Tara will suggest the next available weekday if asked.
          </div>
        </div>
        <SaveBtn section="hours" />
      </Card>

      {/* ── Card 6: Security ── */}
      <Card title="Change Password" desc="Used to log in to this dashboard. Minimum 8 characters.">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Current Password</label>
            <input type="password" className={inputCls} value={pw.current} autoComplete="current-password"
              onChange={e => setPw(p => ({ ...p, current: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>New Password</label>
              <input type="password" className={inputCls} value={pw.next} autoComplete="new-password"
                onChange={e => setPw(p => ({ ...p, next: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input type="password" className={inputCls} value={pw.confirm} autoComplete="new-password"
                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-[#e0e2ed]/40 mt-6">
          <button
            onClick={changePassword}
            disabled={pwSaving || !pw.current || !pw.next || !pw.confirm}
            className="flex items-center gap-2 bg-[#181c23] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pwSaving ? 'Updating…' : 'Change Password'}
          </button>
        </div>
      </Card>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
          toast.ok
            ? 'bg-[#181c23] text-white'
            : 'bg-red-600 text-white'
        }`}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {toast.ok ? 'check_circle' : 'error'}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
