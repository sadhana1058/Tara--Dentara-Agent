import React, { useState } from "react";
import { ChatMessage, Dentist } from "../types";

interface LandingPageProps {
  onLogin: (dentist: Dentist) => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [showSandbox, setShowSandbox] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup inputs
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupClinic, setSignupClinic] = useState("");
  const [signupRole, setSignupRole] = useState<"new_dentist" | "paid_dentist">("new_dentist");

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed.");
      } else {
        onLogin(data.dentist);
      }
    } catch (err) {
      console.error(err);
      setAuthError("Failed to communicate with authorization service.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          role: signupRole,
          clinicName: signupClinic,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Registration failed.");
      } else {
        onLogin(data.dentist);
      }
    } catch (err) {
      console.error(err);
      setAuthError("Failed to register dental account.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickLogin = async (email: string) => {
    setAuthError("");
    setAuthLoading(true);
    setLoginEmail(email);
    setLoginPassword("password123");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password123" }),
      });

      const data = await res.json();
      if (res.ok) {
        onLogin(data.dentist);
      } else {
        setAuthError(data.error || "Failed quick login.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Quick connection issue.");
    } finally {
      setAuthLoading(false);
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: "Elite Dentistry, this is DentiSync Voice AI. How can I assist you with your scheduling today?",
      timestamp: "Just now"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: inputValue,
      timestamp: "Just now"
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/receptionist/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          chatHistory: messages.concat(userMessage)
        })
      });

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.reply || "I am processing your schedule request.",
        timestamp: "Just now"
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const systemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "system",
        text: "Connected to mockup server. Simulated receptionist is on duty.",
        timestamp: "Just now"
      };
      setMessages((prev) => [...prev, systemMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f9f9ff] text-[#181c23] overflow-hidden">
      {/* Noise background */}
      <div className="absolute inset-0 bg-repeat bg-center opacity-[0.015] pointer-events-none noise-bg"></div>

      {/* Landing Page Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto glass-panel rounded-full px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0058bc] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">medical_services</span>
            </div>
            <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-[#001a41] via-[#0058bc] to-[#0070eb] bg-clip-text text-transparent">
              DentiSync AI
            </div>
          </div>
          <div className="hidden md:flex gap-10">
            <a className="text-sm font-semibold text-[#181c23]/70 hover:text-[#0058bc] transition-colors" href="#features">
              Features
            </a>
            <a className="text-sm font-semibold text-[#181c23]/70 hover:text-[#0058bc] transition-colors" href="#sandbox">
              Reception AI Demo
            </a>
            <a className="text-sm font-semibold text-[#181c23]/70 hover:text-[#0058bc] transition-colors" href="#pricing">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => { setAuthError(""); setIsSignUp(false); setIsAuthModalOpen(true); }}
              className="text-sm font-semibold text-[#181c23]/80 hover:text-[#0058bc] transition-all cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={() => { setAuthError(""); setIsSignUp(true); setIsAuthModalOpen(true); }}
              className="cta-glow text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 group relative overflow-hidden transition-all cursor-pointer"
            >
              <span className="relative z-10">Get Started</span>
              <span className="absolute -top-1 -right-1 bg-[#c64f00] text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter font-extrabold z-10">
                Soon
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section Container */}
      <div className="pt-36 pb-24 max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0058bc]/5 rounded-full mb-8 border border-[#0058bc]/10">
              <span className="flex h-2 w-2 rounded-full bg-[#0058bc] animate-pulse"></span>
              <span className="text-xs font-bold text-[#0058bc] uppercase tracking-widest">
                Next-Gen Dental Intelligence
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.05] tracking-tight text-[#181c23]">
              Precision Care <br /> Starts with <span className="premium-gradient-text">Syncing.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#555f6f] max-w-xl mb-12 leading-relaxed">
              Elevate your clinic with the world's most advanced AI receptionist. Fully integrated voice synthesis, PMS
              synchronization, and WhatsApp automation.
            </p>
            <div className="flex flex-wrap gap-6">
              <button
                onClick={() => { setAuthError(""); setIsSignUp(true); setSignupRole("new_dentist"); setIsAuthModalOpen(true); }}
                className="cta-glow text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl transition-all cursor-pointer hover:scale-[1.01]"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => {
                  setShowSandbox(true);
                  const el = document.getElementById("sandbox");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-3 px-8 py-5 rounded-2xl border border-[#c1c6d7]/50 font-bold text-lg hover:bg-white transition-all bg-white/50 backdrop-blur-sm cursor-pointer"
              >
                <span className="material-symbols-outlined">play_circle</span>
                See it in Action
              </button>
            </div>
          </div>

          {/* Side Visual Composition (Floating cards stack) */}
          <div className="lg:col-span-5 relative lg:h-[550px] flex items-center justify-center">
            <div className="relative w-full h-[400px] max-w-md">
              <div className="absolute inset-0 bg-[#005bc1]/10 rounded-full blur-[100px] animate-pulse"></div>

              {/* High precision AI Response Mock card */}
              <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-80 bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 p-6 shadow-2xl z-20 animate-float">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#0058bc]/10 flex items-center justify-center text-[#0058bc]">
                    <span className="material-symbols-outlined">smart_toy</span>
                  </div>
                  <div className="font-bold text-sm">AI Active Response</div>
                </div>
                <div className="space-y-4">
                  <div className="h-2 w-full bg-[#555f6f]/10 rounded-full"></div>
                  <div className="h-2 w-3/4 bg-[#555f6f]/10 rounded-full"></div>
                  <div className="h-10 w-full bg-[#0058bc]/5 rounded-xl border border-[#0058bc]/15 flex items-center px-4 mt-6">
                    <span className="text-[10px] uppercase font-bold text-[#0058bc] tracking-widest">
                      TRANSCRIPTION ACTIVE...
                    </span>
                  </div>
                </div>
              </div>

              {/* Sync Live Bar Chart Card */}
              <div className="absolute bottom-[5%] -right-4 w-60 bg-white/30 backdrop-blur-lg rounded-3xl border border-white/20 p-5 shadow-xl z-30 hidden md:block">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-[#555f6f] tracking-widest uppercase">PMS SYNC</span>
                  <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                    Live
                  </span>
                </div>
                <div className="flex gap-2 h-24 items-end justify-around px-2">
                  <div className="w-2.5 h-[40%] bg-[#0058bc]/20 rounded-t-sm"></div>
                  <div className="w-2.5 h-[65%] bg-[#0058bc]/40 rounded-t-sm"></div>
                  <div className="w-2.5 h-[100%] bg-[#0058bc] rounded-t-sm"></div>
                  <div className="w-2.5 h-[75%] bg-[#0058bc]/60 rounded-t-sm"></div>
                  <div className="w-2.5 h-[90%] bg-[#0070eb] rounded-t-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features bento grids section */}
      <section id="features" className="max-w-7xl mx-auto mt-24 px-6 relative z-10">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">The Future of Reception.</h2>
          <p className="text-[#555f6f] text-lg font-medium">Engineered for medical precision, built for scale.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-10 rounded-[2.5rem] bento-item group border-white/50">
            <div className="w-14 h-14 bg-[#0058bc]/5 text-[#005bc1] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#005bc1] group-hover:text-white transition-all duration-500 shadow-sm">
              <span className="material-symbols-outlined text-3xl">record_voice_over</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#181c23]">Clinical Voice AI</h3>
            <p className="text-[#555f6f] leading-relaxed">
              Neural voice synthesis that sounds completely indistinguishable from a warm, professional dental
              assistant.
            </p>
          </div>
          <div className="glass-panel p-10 rounded-[2.5rem] bento-item group border-white/50">
            <div className="w-14 h-14 bg-[#c64f00]/5 text-[#c64f00] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#c64f00] group-hover:text-white transition-all duration-500 shadow-sm">
              <span className="material-symbols-outlined text-3xl">calendar_today</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#181c23]">Auto-Pilot Scheduling</h3>
            <p className="text-[#555f6f] leading-relaxed">
              Seamlessly syncs patient preferences, emergency request logs, and practitioner slots in real time.
            </p>
          </div>
          <div className="glass-panel p-10 rounded-[2.5rem] bento-item group border-white/50">
            <div className="w-14 h-14 bg-green-500/5 text-green-700 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-green-600 group-hover:text-white transition-all duration-500 shadow-sm">
              <span className="material-symbols-outlined text-3xl">chat_bubble</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[#181c23]">WhatsApp Business Core</h3>
            <p className="text-[#555f6f] leading-relaxed">
              Deep, native automation with official WhatsApp APIs for fast, high-open confirmations and updates.
            </p>
          </div>
        </div>
      </section>

      {/* Live Receptionist Chatbot Sandbox */}
      <section id="sandbox" className="max-w-4xl mx-auto mt-36 px-6 relative z-10 scroll-mt-24">
        <div className="glass-panel rounded-[2.5rem] border-white/60 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-symbols-outlined text-9xl">auto_awesome</span>
          </div>
          <div className="mb-8">
            <div className="inline-flex items-center gap-1 bg-green-500/10 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Sandbox Platform
            </div>
            <h3 className="text-3xl font-bold text-[#181c23] tracking-tight">Test DentiSync AI</h3>
            <p className="text-sm text-[#555f6f] mt-1">
              Talk directly with the medical assistant grounded in Elite Dentistry's scheduler context.
            </p>
          </div>

          <div className="bg-white/40 border border-[#e0e2ed]/50 rounded-2xl h-80 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.sender === "user"
                        ? "bg-[#0058bc] text-white"
                        : msg.sender === "system"
                        ? "bg-[#ecedf9] text-[#414755] border border-[#c1c6d7]/30 italic text-center mx-auto"
                        : "bg-white text-[#181c23] border border-[#e0e2ed]/50 shadow-sm"
                    }`}
                  >
                    <p className="leading-relaxed font-sans">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-[#181c23] border border-[#e0e2ed]/50 shadow-sm rounded-2xl px-4 py-3 text-sm italic flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-[#0058bc] animate-ping"></span>
                    Voice assistant is formulating reply...
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t border-[#e0e2ed]/50 bg-white/60 flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about dental bookings (e.g. 'Is there a slot for Sarah?')"
                className="flex-1 bg-white border border-[#e0e2ed] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0070eb] focus:ring-1 focus:ring-[#0070eb]/20"
              />
              <button
                type="submit"
                className="bg-[#0058bc] hover:bg-[#0070eb] text-white px-5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Send
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Pricing Cards area */}
      <section id="pricing" className="max-w-5xl mx-auto mt-36 px-6 pb-32 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-[#181c23] tracking-tighter">Scalable Investment</h2>
          <p className="text-[#555f6f] mt-1 font-medium">Bespoke scheduling optimization for every practice size.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-panel p-12 rounded-[2.5rem] border-white/60 hover:scale-[1.01] transition-all flex flex-col justify-between">
            <div>
              <div className="text-[#555f6f] text-[10px] font-black mb-6 uppercase tracking-[0.2em]">Foundation</div>
              <div className="text-5xl font-extrabold mb-8 text-[#181c23]">
                $199<span className="text-xl text-[#555f6f] font-normal">/mo</span>
              </div>
              <ul className="space-y-5 mb-12">
                <li className="flex items-center gap-4 text-[#181c23]/80 font-medium">
                  <span className="material-symbols-outlined text-white bg-[#0058bc] p-1 rounded-full text-xs">
                    check
                  </span>
                  <span>Automated SMS Reminders</span>
                </li>
                <li className="flex items-center gap-4 text-[#181c23]/80 font-medium">
                  <span className="material-symbols-outlined text-white bg-[#0058bc] p-1 rounded-full text-xs">
                    check
                  </span>
                  <span>500 Smart AI Conversations</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => { setAuthError(""); setIsSignUp(true); setSignupRole("new_dentist"); setIsAuthModalOpen(true); }}
              className="w-full py-5 border-2 border-[#0058bc]/20 text-[#0058bc] font-bold rounded-2xl hover:bg-[#0058bc] hover:text-white transition-all cursor-pointer"
            >
              Select Plan
            </button>
          </div>

          <div className="bg-[#0058bc]/5 border border-[#0058bc]/20 backdrop-blur-md p-12 rounded-[2.5rem] relative overflow-hidden hover:scale-[1.01] transition-all flex flex-col justify-between">
            <div className="absolute top-8 right-8 bg-[#0058bc] text-white px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
              Premium Selection
            </div>
            <div>
              <div className="text-[#0058bc] text-[10px] font-black mb-6 uppercase tracking-[0.2em]">
                Orchestrator Pro
              </div>
              <div className="text-5xl font-extrabold mb-10 text-[#181c23]">
                $399<span className="text-xl text-[#555f6f] font-normal">/mo</span>
              </div>
              <ul className="space-y-5 mb-12">
                <li className="flex items-center gap-4 font-semibold text-[#181c23]">
                  <span className="material-symbols-outlined text-[#0058bc] bg-[#0058bc]/20 p-1 rounded-full text-xs">
                    check
                  </span>
                  <span>Full Voice AI Autonomy</span>
                </li>
                <li className="flex items-center gap-4 font-semibold text-[#181c23]">
                  <span className="material-symbols-outlined text-[#0058bc] bg-[#0058bc]/20 p-1 rounded-full text-xs">
                    check
                  </span>
                  <span>Unlimited PMS Integrations</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => { setAuthError(""); setIsSignUp(true); setSignupRole("paid_dentist"); setIsAuthModalOpen(true); }}
              className="w-full py-5 cta-glow text-white font-bold rounded-2xl shadow-xl transition-all cursor-pointer hover:scale-[1.01]"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* Aesthetic High-Contrast Dentist Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-[#001a41]/50 backdrop-blur-md flex items-center justify-center z-[200] p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] border border-[#e0e2ed]/80 max-w-md w-full shadow-2xl relative overflow-hidden my-auto p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-[#0058bc] rounded-md flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[14px]">medical_services</span>
                  </div>
                  <span className="text-xs font-black text-[#005bc1] uppercase tracking-wider">Clinical Security Gate</span>
                </div>
                <h3 className="text-2xl font-black text-[#181c23] tracking-tight">
                  {isSignUp ? "Register Practice Portal" : "Practitioner Log In"}
                </h3>
                <p className="text-xs text-[#555f6f]">
                  {isSignUp
                    ? "Establish clinical records and provision active Voice AI models."
                    : "Access unified patient schedules and voice telemetry streams."}
                </p>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1 hover:bg-[#ecedf9] rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>

            {authError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{authError}</span>
              </div>
            )}

            {!isSignUp ? (
              // LOGIN FORM
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Practitioner Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g., new@dentisync.com or paid@dentisync.com"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-semibold text-[#181c23] focus:border-[#0070eb]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password (try: password123)"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-semibold text-[#181c23] focus:border-[#0070eb]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-[#0058bc] hover:bg-[#0070eb] text-white rounded-xl font-bold shadow-md shadow-blue-500/10 cursor-pointer text-sm"
                >
                  {authLoading ? "Verifying Credentials..." : "Authenticate Core Secure"}
                </button>
              </form>
            ) : (
              // SIGNUP FORM
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Practitioner Name</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Dr. Jordan Blake, DDS"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-semibold text-[#181c23] focus:border-[#0070eb]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-1">Clinic Center Brand</label>
                  <input
                    type="text"
                    value={signupClinic}
                    onChange={(e) => setSignupClinic(e.target.value)}
                    placeholder="Blake Integrative Dentistry"
                    className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-sm outline-none font-semibold text-[#181c23] focus:border-[#0070eb]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="jordan@blakedental.com"
                      className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-4 py-3 text-xs outline-none font-semibold text-[#181c23] focus:border-[#0070eb]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-1">Password</label>
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-[#f9f9ff] border border-[#e0e2ed] rounded-xl px-2 py-3 text-xs outline-none font-semibold text-[#181c23] focus:border-[#0070eb]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#181c23] uppercase tracking-wider mb-2">Select Trial vs Paid Tier</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSignupRole("new_dentist")}
                      className={`py-3 px-4 rounded-xl border text-left text-xs ${
                        signupRole === "new_dentist"
                          ? "border-[#0058bc] bg-[#0058bc]/5 font-bold text-[#0058bc]"
                          : "border-[#e0e2ed] text-gray-500 font-semibold"
                      }`}
                    >
                      <div className="text-[10px] uppercase font-black tracking-wider">Free Trial</div>
                      New Dentist
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupRole("paid_dentist")}
                      className={`py-3 px-4 rounded-xl border text-left text-xs ${
                        signupRole === "paid_dentist"
                          ? "border-[#0058bc] bg-[#0058bc]/5 font-bold text-[#0058bc]"
                          : "border-[#e0e2ed] text-gray-500 font-semibold"
                      }`}
                    >
                      <div className="text-[10px] uppercase font-black tracking-wider">Subscriber</div>
                      Paid Dentist
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-[#0058bc] hover:bg-[#0070eb] text-white rounded-xl font-bold shadow-md shadow-blue-500/10 cursor-pointer text-sm"
                >
                  {authLoading ? "Provisioning System..." : "Provision Practice Registry"}
                </button>
              </form>
            )}

            {/* Quick Fast-fill helpers */}
            <div className="border-t border-dashed border-[#e0e2ed] pt-4 space-y-3">
              <span className="text-[10px] font-black text-[#555f6f] uppercase tracking-wider block text-center">
                🔑 Fast-Track Test Credentials
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleQuickLogin("new@dentisync.com")}
                  disabled={authLoading}
                  type="button"
                  className="py-2.5 px-3 bg-[#f9f9ff] hover:bg-[#ecedf9] text-[#005bc1] border border-[#ecedf9] rounded-xl text-[10px] font-bold text-center transition-colors cursor-pointer"
                >
                  <div>Dr. Sarah (Trial)</div>
                  <div className="text-[8px] font-normal text-gray-400">new@dentisync.com</div>
                </button>
                <button
                  onClick={() => handleQuickLogin("paid@dentisync.com")}
                  disabled={authLoading}
                  type="button"
                  className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#005bc1] border border-blue-100 rounded-xl text-[10px] font-bold text-center transition-colors cursor-pointer"
                >
                  <div>Dr. Alexander (Paid)</div>
                  <div className="text-[8px] font-normal text-[#0058bc]/60">paid@dentisync.com</div>
                </button>
              </div>
            </div>

            <div className="text-center font-semibold text-xs border-t border-[#e0e2ed]/40 pt-4">
              <button
                type="button"
                onClick={() => { setAuthError(""); setIsSignUp(!isSignUp); }}
                className="text-[#005bc1] hover:underline cursor-pointer font-bold"
              >
                {isSignUp ? "Already have a practice portal? Log In" : "Need to register a new clinic? Register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
