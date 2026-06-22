'use client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  clinicName: string;
}

export default function Sidebar({ activeTab, setActiveTab, clinicName }: SidebarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }
  const navItems = [
    { id: 'calendar',     label: 'Calendar',     icon: 'calendar_today' },
    { id: 'appointments', label: 'Appointments', icon: 'event_note'     },
    { id: 'patients',     label: 'Patients',     icon: 'group'          },
    { id: 'settings',     label: 'Settings',     icon: 'settings'       },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 flex flex-col p-6 w-64 bg-white/70 backdrop-blur-lg border-r border-[#e0e2ed]/50 shadow-sm z-50">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0058bc] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>medical_services</span>
          </div>
          <h1 className="font-bold text-xl premium-gradient-text tracking-tighter">DentiSync AI</h1>
        </div>
        <p className="text-[#0058bc] text-xs font-bold mt-1 truncate">{clinicName}</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 text-left ${
                isActive
                  ? 'bg-[#0070eb] text-white font-semibold active-nav-glow shadow-md shadow-blue-500/10'
                  : 'text-[#414755] hover:bg-[#ecedf9]/50 hover:text-[#0058bc]'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '20px',
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-[#e0e2ed]/40 space-y-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span className="text-xs text-[#555f6f] font-semibold">AI Receptionist Online</span>
        </div>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-[#0058bc]/10 flex items-center justify-center text-[#0058bc] font-bold text-xs flex-shrink-0">
            T
          </div>
          <div>
            <div className="text-xs font-semibold text-[#181c23]">Tara</div>
            <div className="text-[10px] text-[#555f6f]">ElevenLabs · turbo v2.5</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[#555f6f] hover:bg-red-50 hover:text-red-600 transition-all text-left"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
          <span className="text-xs font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
