'use client';
import { useState } from 'react';
import Sidebar         from './Sidebar';
import CalendarTab     from './CalendarTab';
import AppointmentsTab from './AppointmentsTab';
import PatientsTab     from './PatientsTab';
import SettingsTab     from './SettingsTab';
import type { DashboardData } from '../types';

export default function DashboardShell({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex text-[#181c23]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clinicName={data.clinicName}
      />

      <main className="flex-1 ml-64 min-h-screen p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'calendar' && (
            <CalendarTab
              appointments={data.appointments}
              clinicTimezone={data.clinicTimezone}
              clinicPhone={data.clinicPhone}
            />
          )}
          {activeTab === 'appointments' && (
            <AppointmentsTab
              appointments={data.appointments}
              stats={data.stats}
            />
          )}
          {activeTab === 'patients' && (
            <PatientsTab patients={data.patients} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              clinicName={data.clinicName}
              clinicPhone={data.clinicPhone}
              clinicTimezone={data.clinicTimezone}
            />
          )}
        </div>
      </main>
    </div>
  );
}
