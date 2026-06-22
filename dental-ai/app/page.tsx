import LoginForm from './components/LoginForm';

const FEATURES = [
  { icon: 'call',             title: 'Answers Every Call',      desc: 'Tara picks up 24/7, never misses a booking opportunity.' },
  { icon: 'calendar_today',   title: 'Live Calendar Sync',      desc: 'Checks Google Calendar in real time and books confirmed slots.' },
  { icon: 'record_voice_over',title: 'Natural Voice',           desc: 'ElevenLabs TTS makes Tara sound like a real receptionist.' },
  { icon: 'database',         title: 'Full Audit Trail',        desc: 'Every call transcript and booking saved to your dashboard.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f9f9ff] flex">

      {/* Left — product info */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#001a41] px-16 py-14 text-white">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-[#0058bc] rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>medical_services</span>
            </div>
            <span className="font-black text-xl tracking-tight">DentiSync AI</span>
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-tight mb-6">
            Your AI dental<br />
            <span className="text-[#4da3ff]">receptionist</span><br />
            is always on.
          </h1>
          <p className="text-[#8fafd4] text-lg leading-relaxed mb-12 max-w-md">
            Tara handles every inbound call, checks your calendar, and books confirmed appointments — while you focus on patients.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-[#4da3ff] mb-3 block" style={{ fontSize: '22px' }}>{f.icon}</span>
                <div className="font-bold text-sm mb-1">{f.title}</div>
                <div className="text-[#8fafd4] text-xs leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-10 border-t border-white/10">
          <div className="w-8 h-8 rounded-full bg-[#0058bc]/30 flex items-center justify-center text-[#4da3ff] font-bold text-sm">T</div>
          <div>
            <div className="text-sm font-semibold">Tara</div>
            <div className="text-xs text-[#8fafd4]">ElevenLabs · GPT-4o-mini · Twilio</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            AI Online
          </div>
        </div>
      </div>

      {/* Right — sign in */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-[#0058bc] rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>medical_services</span>
            </div>
            <span className="font-black text-xl text-[#181c23] tracking-tight">DentiSync AI</span>
          </div>

          <h2 className="text-3xl font-black text-[#181c23] tracking-tight mb-2">Welcome back</h2>
          <p className="text-[#555f6f] text-sm mb-8">Sign in to access your clinic dashboard.</p>

          <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-8 shadow-sm">
            <LoginForm />
          </div>

          <p className="text-center text-xs text-[#aab0bf] mt-6">
            Access is restricted to clinic administrators only.
          </p>
        </div>
      </div>

    </div>
  );
}
