import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import Sidebar from "./components/Sidebar";
import CalendarTab from "./components/CalendarTab";
import AppointmentsTab from "./components/AppointmentsTab";
import PatientsTab from "./components/PatientsTab";
import SettingsTab from "./components/SettingsTab";
import { Dentist, Appointment, Patient, Settings, DashboardStats } from "./types";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("dentisync_authenticated") === "true";
  });
  const [currentDentist, setCurrentDentist] = useState<Dentist | null>(() => {
    const stored = localStorage.getItem("dentisync_current_dentist");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState("calendar");
  const [openNewApptModal, setOpenNewApptModal] = useState(false);

  // Unified Data States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    callsHandledToday: 0,
    appointmentsScheduledToday: 0,
    expectedRevenue: 0,
    avgWaitTime: 0,
    aiEfficiencyRate: 0,
  });
  const [settings, setSettings] = useState<Settings>({
    receptionistName: "DentiSync Voice AI",
    aiActive: true,
    voiceModel: "Kore (Cheerfully Warm)",
    whatsappTemplate: "",
    clinicName: "Elite Dentistry Group",
    language: "English",
    enableVoiceResponse: true,
    autoPmsSync: true,
  });

  const [loading, setLoading] = useState(true);

  // Shared CRM Synchronization Fetcher passing the Dentist Context Header
  const refreshCRMData = async () => {
    if (!currentDentist) return;
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-Dentist-ID": currentDentist.id
      };
      
      const [apptRes, patientRes, statsRes, settingsRes] = await Promise.all([
        fetch(`/api/appointments?dentistId=${currentDentist.id}`, { headers }),
        fetch(`/api/patients?dentistId=${currentDentist.id}`, { headers }),
        fetch(`/api/stats?dentistId=${currentDentist.id}`, { headers }),
        fetch(`/api/settings?dentistId=${currentDentist.id}`, { headers }),
      ]);

      if (apptRes.ok && patientRes.ok && statsRes.ok && settingsRes.ok) {
        const [apptsData, patientsData, statsData, settingsData] = await Promise.all([
          apptRes.json(),
          patientRes.json(),
          statsRes.json(),
          settingsRes.json(),
        ]);

        setAppointments(apptsData);
        setPatients(patientsData);
        setStats(statsData);
        setSettings(settingsData);
      }
    } catch (err) {
      console.error("Critical communications failure with remote CRM server node:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentDentist) {
      refreshCRMData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, currentDentist]);

  const handleLogin = (dentist: Dentist) => {
    localStorage.setItem("dentisync_authenticated", "true");
    localStorage.setItem("dentisync_current_dentist", JSON.stringify(dentist));
    setCurrentDentist(dentist);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("dentisync_authenticated");
    localStorage.removeItem("dentisync_current_dentist");
    setCurrentDentist(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated || !currentDentist) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex text-[#181c23] relative font-sans">
      {/* Structural Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewAppointment={() => setOpenNewApptModal(true)}
        onLogout={handleLogout}
        currentDentist={currentDentist}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 ml-64 min-h-screen p-8 lg:p-12 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 py-24">
            <span className="material-symbols-outlined text-4xl text-[#005bc1] animate-spin">sync</span>
            <span className="text-sm font-semibold text-[#555f6f] uppercase tracking-wider">Syncing Clinical Node CRM Channels...</span>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Elegant Role-based License Banner */}
            <div className="mb-8">
              {currentDentist?.role === "new_dentist" ? (
                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                      <span className="material-symbols-outlined text-xl">hourglass_empty</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Dr. {currentDentist?.name ? currentDentist.name.replace("Dr. ", "").replace("Dr ", "") : "Smith"}'s Practice Trial (14-day limit active)</h4>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Your clinic brand <strong className="font-extrabold">"{currentDentist?.clinicName}"</strong> is currently in sandbox evaluation mode. Live voice channels and WhatsApp trigger automation thresholds are restricted.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!currentDentist) return;
                      try {
                        const res = await fetch(`/api/dentists/${currentDentist.id}/upgrade`, {
                          method: "POST"
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setCurrentDentist(data.dentist);
                          localStorage.setItem("dentisync_current_dentist", JSON.stringify(data.dentist));
                        }
                      } catch (err) {
                        console.error("Failed to upgrade practitioner license:", err);
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-amber-600/10"
                  >
                    Upgrade to Premium Pro
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3 block">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                      <span className="material-symbols-outlined text-xl">verified</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">Premium Service Subscription Active</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Patient matching triggers and full WhatsApp CRM scheduling sync functions are active for <strong className="font-extrabold">"{currentDentist?.clinicName || "Elite Dentistry Group"}"</strong>.
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Activated Core Node
                  </span>
                </div>
              )}
            </div>

            {activeTab === "calendar" && (
              <CalendarTab
                appointments={appointments}
                patients={patients}
                onRefresh={refreshCRMData}
                openNewApptModal={openNewApptModal}
                setOpenNewApptModal={setOpenNewApptModal}
              />
            )}
            {activeTab === "appointments" && (
              <AppointmentsTab
                appointments={appointments}
                stats={stats}
                onRefresh={refreshCRMData}
              />
            )}
            {activeTab === "patients" && (
              <PatientsTab
                patients={patients}
                onRefresh={refreshCRMData}
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab
                settings={settings}
                onRefresh={refreshCRMData}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
