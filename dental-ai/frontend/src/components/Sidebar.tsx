import React from "react";
import { Dentist } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewAppointment: () => void;
  onLogout: () => void;
  currentDentist: Dentist | null;
}

export default function Sidebar({ activeTab, setActiveTab, onNewAppointment, onLogout, currentDentist }: SidebarProps) {
  const navItems = [
    { id: "calendar", label: "Calendar", icon: "calendar_today" },
    { id: "appointments", label: "Appointments", icon: "event_note" },
    { id: "patients", label: "Patients", icon: "group" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 flex flex-col p-6 w-64 bg-white/70 backdrop-blur-lg border-r border-[#e0e2ed]/50 shadow-sm z-50">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0058bc] rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-md">medical_services</span>
          </div>
          <h1 className="font-bold text-xl premium-gradient-text tracking-tighter">DentiSync AI</h1>
        </div>
        <p className="text-[#0058bc] text-xs font-bold mt-1 truncate">{currentDentist?.clinicName || "Premium Dental Suite"}</p>
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
                  ? "bg-[#0070eb] text-white font-semibold active-nav-glow shadow-md shadow-blue-500/10"
                  : "text-[#414755] hover:bg-[#ecedf9]/50 hover:text-[#0058bc]"
              }`}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 space-y-2 border-t border-[#e0e2ed]/40">
        <button
          onClick={onNewAppointment}
          className="w-full bg-[#0058bc] hover:bg-[#0070eb] text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 mb-6 hover:shadow-lg transition-transform active:scale-95 shadow-lg shadow-blue-500/10"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span className="text-sm">New Appointment</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors text-left"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="text-sm font-semibold">Sign Out</span>
        </button>

        <div className="flex items-center gap-3 px-2 py-3 mt-2 border-t border-[#e0e2ed]/20">
          <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200/50 flex items-center justify-center text-[#005bc1] font-bold text-sm">
            {currentDentist?.name ? currentDentist.name.replace("Dr. ", "").replace("Dr ", "").charAt(0) : "D"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[#181c23] font-semibold text-sm truncate" title={currentDentist?.name || "Dr. Smith"}>
              {currentDentist?.name || "Dr. Smith"}
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest mt-0.5">
              {currentDentist?.role === "paid_dentist" ? (
                <span className="text-amber-600 font-extrabold flex items-center gap-0.5 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200">
                  <span className="material-symbols-outlined text-[10px]">stars</span>
                  Paid Pro
                </span>
              ) : (
                <span className="text-gray-500 font-bold flex items-center gap-0.5 bg-gray-100 rounded px-1.5 py-0.5 border border-gray-200">
                  <span className="material-symbols-outlined text-[10px]">clinical_trial</span>
                  Free Trial
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
