import React, { useState } from "react";
import { Settings } from "../types";

interface SettingsTabProps {
  settings: Settings;
  onRefresh: () => void;
}

export default function SettingsTab({ settings, onRefresh }: SettingsTabProps) {
  const [receptionistName, setReceptionistName] = useState(settings.receptionistName);
  const [clinicName, setClinicName] = useState(settings.clinicName);
  const [voiceModel, setVoiceModel] = useState(settings.voiceModel);
  const [aiActive, setAiActive] = useState(settings.aiActive);
  const [whatsappTemplate, setWhatsappTemplate] = useState(settings.whatsappTemplate);
  const [enableVoiceResponse, setEnableVoiceResponse] = useState(settings.enableVoiceResponse);
  const [autoPmsSync, setAutoPmsSync] = useState(settings.autoPmsSync);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Voice synthesis tester state
  const [testSentence, setTestSentence] = useState(
    `Hi Jonathan, this is ${receptionistName} on behalf of ${clinicName}. We've confirmed your routine cleaning for tomorrow at 10:15 AM.`
  );
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesisLogs, setSynthesisLogs] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const stored = localStorage.getItem("dentisync_current_dentist");
    const dentistId = stored ? JSON.parse(stored).id : "DEN-001";

    try {
      const res = await fetch(`/api/settings?dentistId=${dentistId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "X-Dentist-ID": dentistId
        },
        body: JSON.stringify({
          receptionistName,
          clinicName,
          voiceModel,
          aiActive,
          whatsappTemplate,
          enableVoiceResponse,
          autoPmsSync,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        onRefresh();
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert("Failed to synchronize settings parameters.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestVoiceSynth = async () => {
    setSynthesizing(true);
    setSynthesisLogs(["Initiating neural mouth model...", `Voice choice: ${voiceModel}`, "Allocating PCM stream..."]);
    setAudioUrl(null);

    // Simple simulated synthesis feedback loops
    setTimeout(() => {
      setSynthesisLogs((prev) => [
        ...prev,
        "Prosody modeling completed perfectly.",
        "Generating vocal tract wave envelope (24000Hz)...",
        "Clinical test file generated successfully.",
      ]);
      setSynthesizing(false);

      // Simple neat browser audio mock ping so that user hears a satisfying tone!
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard concert A frequency
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5); // Sweet upscale chime
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } catch (err) {
        console.warn("AudioContext prohibited or muted by browser gesture constraints", err);
      }
    }, 1800);
  };

  const prebuiltVoices = [
    "Kore (Cheerfully Warm)",
    "Puck (Empathetic & Steady)",
    "Fenrir (Deep & Professional)",
    "Zephyr (Sincere & Clear)",
    "Charon (Calm & Informative)",
  ];

  return (
    <div className="flex-1 space-y-8 pb-12">
      {/* Title Bar */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#181c23]">Control Center</h2>
        <p className="text-[#555f6f] text-sm mt-1">Configure artificial intelligence parameters, voice synthesis modeling, and PMS workflows.</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>DentiSync settings synchronized successfully across all active CRM nodes.</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* Settings Formulation Column - Col span 7 */}
        <form onSubmit={handleSaveSettings} className="col-span-12 lg:col-span-7 space-y-8">
          {/* Section 1: Core AI Receptionist settings */}
          <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-lg text-[#181c23] border-b border-gray-100 pb-4 mb-4">Voice AI Receiver</h3>

            <div className="flex items-center justify-between p-4 bg-blue-50/30 border border-blue-100 rounded-2xl">
              <div>
                <div className="font-bold text-sm text-[#005bc1]">Autonomous Reception Line</div>
                <div className="text-xs text-[#555f6f]">Allow AI Voice Assistant to handle incoming scheduler calls.</div>
              </div>
              <input
                type="checkbox"
                checked={aiActive}
                onChange={(e) => setAiActive(e.target.checked)}
                className="w-10 h-6 bg-[#ecedf9] rounded-full appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 before:transition-all checked:bg-[#0070eb] checked:before:translate-x-4 cursor-pointer border border-[#c1c6d7]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">
                  Clinic Brand Name
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">
                  Assistant Call Name
                </label>
                <input
                  type="text"
                  value={receptionistName}
                  onChange={(e) => setReceptionistName(e.target.value)}
                  className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-medium focus:border-[#0070eb]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">
                Prebuilt Speech Voice Model
              </label>
              <select
                value={voiceModel}
                onChange={(e) => setVoiceModel(e.target.value)}
                className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-semibold focus:border-[#0070eb]"
              >
                {prebuiltVoices.map((voice) => (
                  <option key={voice} value={voice}>
                    {voice}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Automation message templates */}
          <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-lg text-[#181c23] border-b border-gray-100 pb-4 mb-4">Notification Workflows</h3>

            <div>
              <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">
                WhatsApp Booking confirmation Template
              </label>
              <textarea
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                rows={4}
                className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-semibold focus:border-[#0070eb]"
              />
              <p className="text-[10px] text-[#555f6f] mt-1 leading-relaxed">
                Dynamic variable hooks: <code className="bg-gray-100 px-1 rounded">{"{{PATIENT}}"}</code> •{" "}
                <code className="bg-gray-100 px-1 rounded">{"{{RECEPTIONIST}}"}</code> •{" "}
                <code className="bg-gray-100 px-1 rounded">{"{{CLINIC}}"}</code> •{" "}
                <code className="bg-gray-100 px-1 rounded">{"{{PROCEDURE}}"}</code> •{" "}
                <code className="bg-gray-100 px-1 rounded">{"{{TIME}}"}</code>
              </p>
            </div>
          </div>

          {/* Section 3: Integrations & Cloud features */}
          <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-8 shadow-sm space-y-6">
            <h3 className="font-bold text-lg text-[#181c23] border-b border-gray-100 pb-4 mb-4">Clinic PMS Integration</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="autoPmsSync"
                  checked={autoPmsSync}
                  onChange={(e) => setAutoPmsSync(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#0058bc] mt-1"
                />
                <label htmlFor="autoPmsSync" className="text-sm font-semibold text-[#181c23] cursor-pointer">
                  Enable Dentrix / Eaglesoft Cloud Synchronization
                  <p className="text-xs text-[#555f6f] font-normal mt-0.5">
                    Instantly sync appointments, cancellations, and clinical notes to local CRM software with no delay.
                  </p>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="enableVoice"
                  checked={enableVoiceResponse}
                  onChange={(e) => setEnableVoiceResponse(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#0058bc] mt-1"
                />
                <label htmlFor="enableVoice" className="text-sm font-semibold text-[#181c23] cursor-pointer">
                  Automatic Text-to-Speech generation
                  <p className="text-xs text-[#555f6f] font-normal mt-0.5">
                    Enable the server-side synthesis of spoken greeting files for every scheduled booking transaction.
                  </p>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-[#0058bc] hover:bg-[#0070eb] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/10 cursor-pointer text-sm"
          >
            {saving ? "Synchronizing Control Parameters..." : "Sync Control Parameters"}
          </button>
        </form>

        {/* Neural voice synthesizer sandbox column - Col span 5 */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <div className="bg-white/70 backdrop-blur-lg border border-[#e0e2ed]/50 rounded-[2rem] p-8 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b border-[#e0e2ed]/40 pb-6 mb-6">
                <h3 className="font-bold text-lg text-[#181c23]">Voice Synthesis Model</h3>
                <span className="text-[10px] bg-green-100 px-2.5 py-1 rounded-full text-green-800 font-bold uppercase tracking-wider">
                  Test Utility
                </span>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider">
                  Synthesize Diagnostic Summary
                </label>
                <textarea
                  value={testSentence}
                  onChange={(e) => setTestSentence(e.target.value)}
                  rows={4}
                  className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-2xl px-4 py-3 text-xs font-medium outline-none text-[#181c23] focus:border-[#0070eb]"
                  placeholder="Insert therapeutic summary statement or booking greeting..."
                />
                <button
                  type="button"
                  onClick={handleTestVoiceSynth}
                  disabled={synthesizing}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-bold text-[#005bc1] cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">speech_to_text</span>
                  {synthesizing ? "Modeling Speech Wave..." : "Generate & Synthesize Vocal Voice"}
                </button>
              </div>

              {/* Logs visualizer */}
              <div className="bg-[#181c23] border border-gray-800 rounded-2xl p-5 mt-6 font-mono text-[10px] text-green-400 space-y-2 min-h-40 relative">
                <div className="absolute top-3 right-3 text-[8px] bg-green-500/10 px-2 py-0.5 rounded text-green-500 font-extrabold uppercase tracking-widest border border-green-500/20">
                  WAVEGEN
                </div>
                <h4 className="text-gray-500 font-bold uppercase text-[9px] tracking-wider pb-1 border-b border-gray-800/50">
                  Neural Waveform Logs
                </h4>
                {synthesisLogs.length > 0 ? (
                  synthesisLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-gray-600 font-bold">{`>`}</span>
                      <span>{log}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-600 italic">Synthetic speech buffer idle. Ready for waveform model.</div>
                )}
                {synthesizing && <div className="text-green-500 animate-pulse mt-3 font-semibold">Modeling waves...</div>}
              </div>
            </div>

            <div className="mt-8 border-t border-[#e0e2ed]/40 pt-6">
              <span className="text-[10px] font-black text-[#555f6f] uppercase tracking-widest block mb-1">
                Clinical Audio Output specs
              </span>
              <p className="text-[11px] text-[#555f6f] leading-relaxed">
                Synthesis runs at a sampling rate of <code className="bg-[#ecedf9] px-1 rounded font-bold">24,000Hz</code> using
                linear 16-bit little-endian PCM codecs, meeting professional telemedicine guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
