'use client';

interface SettingsTabProps {
  clinicName: string;
  clinicPhone: string;
  clinicTimezone: string;
}

const INTEGRATIONS = [
  { name: 'Twilio Voice',        desc: 'Phone number + webhook routing',     icon: 'call'             },
  { name: 'ElevenLabs TTS',      desc: 'eleven_turbo_v2_5 voice synthesis',  icon: 'record_voice_over'},
  { name: 'OpenAI GPT-4o-mini',  desc: 'Conversation AI + tool calling',     icon: 'smart_toy'        },
  { name: 'Google Calendar',     desc: 'Appointment scheduling + freebusy',  icon: 'calendar_today'   },
  { name: 'Supabase',            desc: 'Call logs + appointment records',     icon: 'database'         },
];

const BOOKING_FLOW = [
  'Patient calls the Twilio number',
  'AI (Tara) greets and asks for appointment type',
  'AI checks Google Calendar availability',
  'Patient confirms name, phone, and time slot',
  'Appointment created in Google Calendar + Supabase',
  'AI confirms booking and ends call politely',
];

export default function SettingsTab({ clinicName, clinicPhone, clinicTimezone }: SettingsTabProps) {
  return (
    <div className="flex-1 space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#181c23]">Control Center</h2>
        <p className="text-[#555f6f] text-sm mt-1">System configuration, integration status, and booking flow.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-7 space-y-8">

          {/* Clinic config */}
          <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-8 shadow-sm space-y-5">
            <h3 className="font-bold text-lg text-[#181c23] border-b border-gray-100 pb-4">Clinic Configuration</h3>
            {([
              { label: 'Clinic Name',    value: clinicName,     icon: 'business'          },
              { label: 'Phone Number',   value: clinicPhone || '(not set)', icon: 'call'  },
              { label: 'Timezone',       value: clinicTimezone, icon: 'schedule'           },
              { label: 'Office Hours',   value: 'Mon–Fri, 9:00 AM – 5:00 PM', icon: 'work'},
              { label: 'Slot Duration',  value: '30 minutes',   icon: 'timelapse'          },
              { label: 'AI Voice Name',  value: 'Tara',         icon: 'record_voice_over'  },
              { label: 'LLM Model',      value: 'GPT-4o-mini',  icon: 'smart_toy'          },
            ] as { label: string; value: string; icon: string }[]).map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-[#0058bc]/5 flex items-center justify-center text-[#0058bc] flex-shrink-0">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-[#555f6f] uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-semibold text-[#181c23] truncate">{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking flow */}
          <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-8 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-[#181c23] border-b border-gray-100 pb-4">AI Booking Flow</h3>
            {BOOKING_FLOW.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#0058bc] text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-[#555f6f] font-medium">{step}</span>
              </div>
            ))}
            <div className="mt-4 p-4 bg-[#0058bc]/5 border border-[#0058bc]/15 rounded-2xl">
              <p className="text-xs text-[#0058bc] font-semibold">
                Latency: ~5s per turn (GPT ~1.5s + ElevenLabs ~1.5s + upload ~0.5s + network ~1.5s)
              </p>
            </div>
          </div>
        </div>

        {/* Right column — integrations */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-8 shadow-sm">
            <h3 className="font-bold text-lg text-[#181c23] border-b border-gray-100 pb-4 mb-6">Integration Status</h3>
            <div className="space-y-4">
              {INTEGRATIONS.map((integration) => (
                <div key={integration.name} className="flex items-center gap-4 p-4 bg-[#f9f9ff] rounded-2xl border border-[#e0e2ed]/40">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-700 flex-shrink-0">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{integration.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#181c23]">{integration.name}</div>
                    <div className="text-[10px] text-[#555f6f] truncate">{integration.desc}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '18px', marginTop: '2px' }}>warning</span>
                <div>
                  <div className="text-xs font-bold text-amber-900">MVP Scope</div>
                  <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                    No auth, no WhatsApp, no reminders, no reschedule/cancel, single dentist only.
                    HIPAA BAAs required before real patient data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
