'use client';
import { useState, useEffect, useRef } from 'react';
import { DateTime } from 'luxon';
import Link from 'next/link';
import type { AppointmentUI } from '../types';

/* ── layout constants ─────────────────────────────────────── */
const HOUR_PX   = 64;   // px per hour
const START_HR  = 7;    // grid starts at 7 AM
const END_HR    = 19;   // grid ends at 7 PM
const TOTAL_HRS = END_HR - START_HR;
const GRID_H    = TOTAL_HRS * HOUR_PX;
const HOURS     = Array.from({ length: TOTAL_HRS }, (_, i) => START_HR + i);

interface GCalEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?:   { dateTime?: string; date?: string };
  colorId?: string;
}

interface PositionedEvent {
  id: string;
  summary: string;
  startISO: string;
  endISO: string;
  top: number;
  height: number;
  isAiBooking: boolean;
  callSid?: string | null;
  col: number;
  totalCols: number;
}

function toMinutes(iso: string, tz: string) {
  const dt = DateTime.fromISO(iso).setZone(tz);
  return (dt.hour - START_HR) * 60 + dt.minute;
}

function layoutEvents(events: PositionedEvent[]): PositionedEvent[] {
  // simple overlap detection — assign columns
  const result: PositionedEvent[] = [];
  const columns: { end: number }[][] = [];

  for (const ev of events) {
    const startMin = ev.top / (HOUR_PX / 60);
    const endMin   = startMin + ev.height / (HOUR_PX / 60);
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      if (col.every((e) => e.end <= startMin)) {
        col.push({ end: endMin });
        result.push({ ...ev, col: c });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([{ end: endMin }]);
      result.push({ ...ev, col: columns.length - 1 });
    }
  }

  // set totalCols for each event based on day group
  const maxCol = columns.length;
  return result.map((ev) => ({ ...ev, totalCols: maxCol }));
}

interface CalendarTabProps {
  appointments: AppointmentUI[];
  clinicTimezone: string;
  clinicPhone: string;
}

export default function CalendarTab({ appointments, clinicTimezone, clinicPhone }: CalendarTabProps) {
  const [weekOffset, setWeekOffset]     = useState(0);
  const [gcalEvents, setGcalEvents]     = useState<GCalEvent[]>([]);
  const [loading, setLoading]           = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PositionedEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const now         = DateTime.now().setZone(clinicTimezone);
  const startOfWeek = now.startOf('week').plus({ weeks: weekOffset });
  const weekDays    = Array.from({ length: 5 }, (_, i) => startOfWeek.plus({ days: i }));
  const weekStart   = weekDays[0].toFormat('yyyy-MM-dd');
  const weekEnd     = weekDays[4].toFormat('yyyy-MM-dd');

  // scroll to 8 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - START_HR) * HOUR_PX - 16;
    }
  }, []);

  // fetch Google Calendar events for this week
  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar/events?weekStart=${weekStart}&weekEnd=${weekEnd}`)
      .then((r) => r.json())
      .then((data) => { setGcalEvents(Array.isArray(data) ? data : []); })
      .catch(() => setGcalEvents([]))
      .finally(() => setLoading(false));
  }, [weekStart, weekEnd]);

  // current time indicator position
  const nowMinutes  = (now.hour - START_HR) * 60 + now.minute;
  const nowTop      = (nowMinutes / 60) * HOUR_PX;
  const showNowLine = weekOffset === 0 && nowMinutes >= 0 && nowMinutes <= TOTAL_HRS * 60;

  // build positioned events per day
  function getEventsForDay(day: DateTime): PositionedEvent[] {
    const dateKey = day.toFormat('yyyy-MM-dd');
    const raw: PositionedEvent[] = [];

    // AI-booked appointments from Supabase
    for (const appt of appointments) {
      if (appt.date !== dateKey) continue;
      const startISO = appt.startTime;
      const endDt    = DateTime.fromISO(startISO).plus({ minutes: 30 });
      const top      = (toMinutes(startISO, clinicTimezone) / 60) * HOUR_PX;
      const height   = Math.max((30 / 60) * HOUR_PX, 20);
      if (top < 0 || top > GRID_H) continue;
      raw.push({ id: appt.id, summary: appt.patientName, startISO, endISO: endDt.toISO()!, top, height, isAiBooking: true, callSid: appt.callSid, col: 0, totalCols: 1 });
    }

    // Google Calendar events
    for (const ev of gcalEvents) {
      const startISO = ev.start?.dateTime;
      const endISO   = ev.end?.dateTime;
      if (!startISO || !endISO) continue;
      const evDate = DateTime.fromISO(startISO).setZone(clinicTimezone).toFormat('yyyy-MM-dd');
      if (evDate !== dateKey) continue;
      // skip if already in appointments (same time = AI booking already shown)
      const top    = (toMinutes(startISO, clinicTimezone) / 60) * HOUR_PX;
      const endMin = toMinutes(endISO, clinicTimezone);
      const height = Math.max(((endMin - toMinutes(startISO, clinicTimezone)) / 60) * HOUR_PX, 20);
      if (top < 0 || top > GRID_H) continue;
      const isDupe = appointments.some((a) => a.date === dateKey && a.startTime === startISO);
      if (isDupe) continue;
      raw.push({ id: ev.id, summary: ev.summary || '(No title)', startISO, endISO, top, height, isAiBooking: false, callSid: null, col: 0, totalCols: 1 });
    }

    return layoutEvents(raw.sort((a, b) => a.top - b.top));
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#181c23]">
            {startOfWeek.toFormat('MMMM yyyy')}
          </h2>
          <p className="text-[#555f6f] text-xs mt-0.5">
            {startOfWeek.toFormat('MMM d')} – {weekDays[4].toFormat('MMM d')}
            {loading && <span className="ml-2 text-[#0058bc]">syncing…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg hover:bg-[#ecedf9] border border-[#e0e2ed] transition-colors"
          >
            <span className="material-symbols-outlined text-[#555f6f]" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            className="px-3 py-1.5 text-xs font-bold text-[#0058bc] border border-[#0058bc]/30 rounded-lg hover:bg-[#0058bc]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg hover:bg-[#ecedf9] border border-[#e0e2ed] transition-colors"
          >
            <span className="material-symbols-outlined text-[#555f6f]" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── Calendar grid ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e0e2ed] shadow-sm overflow-hidden flex-1 flex flex-col">

        {/* Day headers — sticky */}
        <div className="grid border-b border-[#e0e2ed] flex-shrink-0" style={{ gridTemplateColumns: '56px repeat(5, 1fr)' }}>
          <div className="border-r border-[#e0e2ed]" /> {/* corner */}
          {weekDays.map((day) => {
            const isToday = day.hasSame(now, 'day');
            return (
              <div key={day.toISO()} className="py-3 text-center border-r border-[#e0e2ed] last:border-r-0">
                <div className="text-xs font-bold text-[#70757a] uppercase tracking-wider">
                  {day.toFormat('EEE')}
                </div>
                <div className={`text-2xl font-normal mt-0.5 w-10 h-10 mx-auto flex items-center justify-center rounded-full transition-colors ${
                  isToday ? 'bg-[#1a73e8] text-white font-bold' : 'text-[#3c4043]'
                }`}>
                  {day.toFormat('d')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable time grid */}
        <div ref={scrollRef} className="overflow-y-auto flex-1">
          <div className="relative" style={{ gridTemplateColumns: '56px repeat(5, 1fr)', display: 'grid', height: `${GRID_H}px` }}>

            {/* Hour labels */}
            <div className="relative border-r border-[#e0e2ed]">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 text-[11px] text-[#70757a] font-medium"
                  style={{ top: (h - START_HR) * HOUR_PX - 7, textAlign: 'right', width: '40px' }}
                >
                  {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, di) => {
              const dayEvents = getEventsForDay(day);
              const isToday   = day.hasSame(now, 'day');
              return (
                <div
                  key={day.toISO()}
                  className={`relative border-r border-[#e0e2ed] last:border-r-0 ${isToday ? 'bg-blue-50/20' : ''}`}
                >
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-[#f1f3f4]"
                      style={{ top: (h - START_HR) * HOUR_PX }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={`${h}-half`}
                      className="absolute left-0 right-0 border-t border-dashed border-[#f1f3f4]"
                      style={{ top: (h - START_HR) * HOUR_PX + HOUR_PX / 2 }}
                    />
                  ))}

                  {/* Current time indicator */}
                  {showNowLine && isToday && (
                    <>
                      <div
                        className="absolute left-0 right-0 border-t-2 border-[#ea4335] z-20 pointer-events-none"
                        style={{ top: nowTop }}
                      />
                      <div
                        className="absolute z-20 w-3 h-3 rounded-full bg-[#ea4335] -left-1.5 pointer-events-none"
                        style={{ top: nowTop - 6 }}
                      />
                    </>
                  )}

                  {/* Events */}
                  {dayEvents.map((ev) => {
                    const colWidth   = 1 / ev.totalCols;
                    const leftPct    = ev.col * colWidth * 100;
                    const widthPct   = colWidth * 100 - 2;
                    const isSelected = selectedEvent?.id === ev.id;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(isSelected ? null : ev)}
                        className={`absolute rounded-lg px-2 py-1 cursor-pointer overflow-hidden transition-all z-10 ${
                          ev.isAiBooking
                            ? isSelected
                              ? 'bg-[#1a73e8] text-white shadow-lg shadow-blue-500/30'
                              : 'bg-[#1a73e8]/90 text-white hover:bg-[#1a73e8] hover:shadow-md'
                            : isSelected
                              ? 'bg-[#0f9d58] text-white shadow-lg'
                              : 'bg-[#0f9d58]/85 text-white hover:bg-[#0f9d58] hover:shadow-md'
                        }`}
                        style={{
                          top:    ev.top + 2,
                          height: Math.max(ev.height - 4, 18),
                          left:   `${leftPct + 2}%`,
                          width:  `${widthPct}%`,
                        }}
                      >
                        <div className="text-[11px] font-bold leading-tight truncate">{ev.summary}</div>
                        {ev.height > 28 && (
                          <div className="text-[10px] opacity-80 leading-tight truncate">
                            {DateTime.fromISO(ev.startISO).setZone(clinicTimezone).toFormat('h:mm a')}
                            {ev.isAiBooking && (
                              <span className="ml-1 opacity-75">· AI</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Event detail panel ──────────────────────────────── */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-[#e0e2ed] w-full max-w-sm p-6 animate-zoomIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${selectedEvent.isAiBooking ? 'bg-[#1a73e8]' : 'bg-[#0f9d58]'}`} />
                <h3 className="font-bold text-lg text-[#181c23] leading-tight">{selectedEvent.summary}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-[#f1f3f4] rounded-lg">
                <span className="material-symbols-outlined text-[#70757a]" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 text-sm text-[#3c4043]">
                <span className="material-symbols-outlined text-[#70757a]" style={{ fontSize: '18px' }}>schedule</span>
                <span>
                  {DateTime.fromISO(selectedEvent.startISO).setZone(clinicTimezone).toFormat("EEE, MMM d · h:mm a")}
                  {' – '}
                  {DateTime.fromISO(selectedEvent.endISO).setZone(clinicTimezone).toFormat('h:mm a')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#3c4043]">
                <span className="material-symbols-outlined text-[#70757a]" style={{ fontSize: '18px' }}>
                  {selectedEvent.isAiBooking ? 'smart_toy' : 'calendar_today'}
                </span>
                <span>{selectedEvent.isAiBooking ? 'Booked by Tara (AI Receptionist)' : 'Google Calendar event'}</span>
              </div>
            </div>

            {selectedEvent.isAiBooking && selectedEvent.callSid && (
              <Link
                href={`/dashboard-7k3x/calls/${selectedEvent.callSid}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#1a73e8] text-white rounded-xl font-bold text-sm hover:bg-[#1557b0] transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>transcribe</span>
                View Call Transcript
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
