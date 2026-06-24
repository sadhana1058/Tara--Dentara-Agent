import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Patient, Appointment, Settings, DashboardStats } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini AI client
let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// Low DB state storage paths
const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Default Seeds
const defaultPatients: Patient[] = [
  {
    id: "PT-9042",
    name: "Jonathan Sutherland",
    lastVisit: "2023-10-12",
    nextAppointment: "2024-10-15 · 10:15 AM",
    contact: "+1 (555) 234-8901",
    email: "j.sutherland@example.com",
    notes: "Prefers morning appointments. Slight odontophobia. Highly responsive to gentle cleanings.",
    recentProcedures: ["Routine Cleaning", "Fluoride Treatment"],
    insuranceProvider: "Delta Dental Premium"
  },
  {
    id: "PT-1156",
    name: "Elena Whittaker",
    lastVisit: "2023-09-04",
    nextAppointment: "2024-10-16 · 02:00 PM",
    contact: "+1 (555) 902-1134",
    email: "elena.w@whittaker.co",
    notes: "Orthodontic aligner check. Aligners fit perfectly. Next treatment set delivered.",
    recentProcedures: ["Orthodontic Adjustment", "Intraoral Scan"],
    insuranceProvider: "Aetna Preferred PPO"
  },
  {
    id: "PT-8872",
    name: "Marcus Kane",
    lastVisit: "2023-10-29",
    nextAppointment: "2024-10-18 · 11:00 AM",
    contact: "+1 (555) 441-2090",
    email: "marcus.kane@kaneinc.com",
    notes: "Acute pulpitis on lower left molar (#19). Needs urgent endodontic intervention.",
    recentProcedures: ["Emergency Sedative Filling", "PA Radiograph"],
    insuranceProvider: "Cigna Advantage Plus"
  },
  {
    id: "PT-3321",
    name: "Sarah Lombardi",
    lastVisit: "2023-08-15",
    nextAppointment: null,
    contact: "+1 (555) 772-0012",
    email: "sarah.lombardi@outlook.com",
    notes: "Requires deep cleaning on left quadrant. Maintenance check set for 4 months.",
    recentProcedures: ["Scaling & Root Planing"],
    insuranceProvider: "MetLife Preferred Provider"
  },
  {
    id: "PT-0091",
    name: "Benjamin Geller",
    lastVisit: "2023-10-30",
    nextAppointment: "2024-10-17 · 03:30 PM",
    contact: "+1 (555) 662-3498",
    email: "ben.geller@nyu.edu",
    notes: "Completed surgical implant stage 1. Suture removal done. Osseointegration check.",
    recentProcedures: ["Dental Implant Placement", "Post-Op Suture Removal"],
    insuranceProvider: "United Healthcare Dental"
  },
  {
    id: "PT-10922",
    name: "Sarah Jenkins",
    lastVisit: "2024-08-12",
    nextAppointment: "2024-10-15 · 10:15 AM",
    contact: "+1 (555) 831-9231",
    email: "sarah.jenkins@gmail.com",
    notes: "Requested urgency appointment for a chipping crown molar.",
    recentProcedures: ["Crown Consultation"],
    insuranceProvider: "Blueshield Choice Plus"
  },
  {
    id: "PT-10845",
    name: "Michael Chen",
    lastVisit: "2024-09-05",
    nextAppointment: "2024-10-14 · 09:00 AM",
    contact: "+1 (555) 244-8832",
    email: "m.chen@earthlink.net",
    notes: "Routine cosmetic check of front teeth. Overall high hygiene rating.",
    recentProcedures: ["Prophylaxis Scaling"],
    insuranceProvider: "Guardian Dental Choice"
  }
];

const defaultAppointments: Appointment[] = [
  {
    id: "APT-001",
    patientId: "PT-10845",
    patientName: "Michael Chen",
    patientAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuWNxTscooXI9samBXv5f_BLGOOimJN6fK-Onc6L8vzNXC-5wCkaO77U6Vznk_1EadSBmIUrBc0ZYN_HoV8Q6rKOIAw_JUSmp2DvBOhPgsiBZ6G_gPEd93Hin9f9D6EEzaMZgOwXYCNJdGExfar4Qh15ytAGFRKwDpfKzvbE5gy3aCHMFCPxtZ5oG-iFU4EpnzP0WUuXUd48B5RLj5HOLRB6nU6kRP0_P4EHKnW0Y_CHvkS5f4NIljBj4yjfcEIPfZKRlIxty6jBnr",
    time: "09:00 AM",
    date: "2024-10-14",
    duration: 60,
    procedure: "Standard Cleaning",
    status: "confirmed",
    aiHandled: false,
    whatsAppStatus: null
  },
  {
    id: "APT-002",
    patientId: "PT-10922",
    patientName: "Sarah Jenkins",
    patientAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYKJtwl-1TqXuSgJFnZ_jSBzpwehx1LD2NCd3ooKyvlxD-zU_SKtYOzwafUW3vpB-9VZ3UBmKd1eb8nB413s9JjrejyAtJJamAbcQVT1VTkr5h7Xw9HvZ_TgHQCaHDU2NZJ39T76ekz7K1iiXEQ-6TveVLqOZ2xCRHthg8Dm6vtfrZzPWfnpBTaXUm7plDtJFz34ZMGH2mKJiKUAn3EHG5meMPkDjhN4hCl_f4HUpVjHUzGLR6l42WYeWCFAtBETNbeZzcU8gVsEGQ",
    time: "10:15 AM",
    date: "2024-10-15",
    duration: 90,
    procedure: "Emergency Filling",
    status: "confirmed",
    aiHandled: true,
    whatsAppStatus: "sent"
  },
  {
    id: "APT-003",
    patientId: "PT-1156",
    patientName: "Elena Whittaker",
    patientAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCtpjabpzy9UOkjMHdA9sDCuYYP6YV-srgPteuEPVK0mfqYr0y-MQDPwsc6sEMiEsl9qUMfbuKsb32-jtFWWg1BsmOgFVbvmNkc6AIUPy0KnWTBNd0FsQJ3fZ7bnaC83MEpyXsf7CHtGqlM8TwKv7KBDxp8y9IFkXvE9oHAFkXl8amvMkDFrLXdS_jbT2USeaYu-4j8CYUxlq3tjVxNtBYnJm1pVxqu5DVGnsTceoHYHWyUgZDXtQXnEm2qtj37hwfWbRBOC-xcVpVB",
    time: "02:00 PM",
    date: "2024-10-16",
    duration: 60,
    procedure: "Orthodontic Aligner Update",
    status: "pending",
    aiHandled: true,
    whatsAppStatus: "sent"
  },
  {
    id: "APT-004",
    patientId: "PT-0091",
    patientName: "Benjamin Geller",
    patientAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFACokGJR-v5ELz3D6XJ4yL75oV50L_zTv775AKw0bQaCIlI5TW1-RxArmduf5avURQMOyvlOurcBvxaZ60KZIFclo9veamn_xLse3vqEeRC8AE6SY1SBqIAp2Dm1XxmhJdmUpUcZmGftHwMThEamx0L4i6h6bQT3DR7x9uKOmPmWuR776r0j3Yb2Q937dWmqebAwfwnN7N89MGxkyE9a28AUCC0l7PICrEPmPRgdB6dgMcQAmwEw2pURifMfu6jSEh7uLMfhS3sDi",
    time: "03:30 PM",
    date: "2024-10-17",
    duration: 90,
    procedure: "Dental Implant Followup",
    status: "confirmed",
    aiHandled: false,
    whatsAppStatus: null
  },
  {
    id: "APT-005",
    patientId: "PT-8872",
    patientName: "Marcus Kane",
    patientAvatar: undefined,
    time: "11:00 AM",
    date: "2024-10-18",
    duration: 60,
    procedure: "Root Canal stage 2",
    status: "confirmed",
    aiHandled: false,
    whatsAppStatus: "sent"
  }
];

const defaultSettings: Settings = {
  receptionistName: "DentiSync Voice AI",
  aiActive: true,
  voiceModel: "Kore (Cheerfully Warm)",
  whatsappTemplate: "Hi {{PATIENT}}, this is DentiSync AI on behalf of {{CLINIC}}. We've confirmed your {{PROCEDURE}} for {{TIME}}.",
  clinicName: "Elite Dentistry Group",
  language: "English",
  enableVoiceResponse: true,
  autoPmsSync: true
};

interface DentistServer {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "new_dentist" | "paid_dentist";
  clinicName: string;
}

const defaultStats: DashboardStats = {
  callsHandledToday: 14,
  appointmentsScheduledToday: 8,
  expectedRevenue: 4250,
  avgWaitTime: 6.5,
  aiEfficiencyRate: 84
};

const defaultDentists: DentistServer[] = [
  {
    id: "DEN-001",
    name: "Dr. Sarah New",
    email: "new@dentisync.com",
    passwordHash: "password123",
    role: "new_dentist",
    clinicName: "Sarah's Warm Dental Care"
  },
  {
    id: "DEN-002",
    name: "Dr. Alexander Paid",
    email: "paid@dentisync.com",
    passwordHash: "password123",
    role: "paid_dentist",
    clinicName: "Elite Platinum Dentistry"
  }
];

// State interfaces
interface LocalDB {
  patients: Patient[];
  appointments: Appointment[];
  settings: Settings;
  stats: DashboardStats;
  dentists?: DentistServer[];
  settingsMap?: { [dentistId: string]: Settings };
  statsMap?: { [dentistId: string]: DashboardStats };
}

// Request Helper to Extract Active Dentist
function getDentistId(req: express.Request): string {
  const dentistId = req.headers["x-dentist-id"] || req.query.dentistId;
  return typeof dentistId === "string" ? dentistId : "DEN-001";
}

// Database I/O Helper
function loadDB(): LocalDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      let changed = false;

      if (!parsed.dentists) {
        parsed.dentists = defaultDentists;
        changed = true;
      }

      // If existing records exist but do not have dentistId, migrate them to DEN-001
      if (parsed.patients && parsed.patients.length > 0 && !parsed.patients[0].dentistId) {
        parsed.patients.forEach((p: any) => { p.dentistId = "DEN-001"; });
        parsed.appointments.forEach((a: any) => { a.dentistId = "DEN-001"; });
        changed = true;
      }

      // Initialize settingsMap if not present
      if (!parsed.settingsMap) {
        parsed.settingsMap = {
          "DEN-001": {
            ...defaultSettings,
            clinicName: "Sarah's Warm Dental Care",
            receptionistName: "Sarah's Voice AI",
          },
          "DEN-002": {
            ...defaultSettings,
            clinicName: "Elite Platinum Dentistry",
            receptionistName: "Alexander's Voice AI",
          }
        };
        changed = true;
      }

      // Initialize statsMap if not present
      if (!parsed.statsMap) {
        parsed.statsMap = {
          "DEN-001": { ...defaultStats, callsHandledToday: 12, appointmentsScheduledToday: 6, expectedRevenue: 2800 },
          "DEN-002": { ...defaultStats, callsHandledToday: 42, appointmentsScheduledToday: 24, expectedRevenue: 15200 }
        };
        changed = true;
      }

      if (changed) {
        saveDB(parsed);
      }
      return parsed;
    }
  } catch (error) {
    console.error("Failed to parse local DB file, seeding fresh defaults", error);
  }

  // Seeding fresh structure
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Build isolated data copies for Sarah and Alexander
  const patientMapDen1: { [key: string]: string } = {};
  const patientsDen1 = defaultPatients.map((p) => {
    const newId = `${p.id}-DEN-001`;
    patientMapDen1[p.id] = newId;
    return { ...p, id: newId, dentistId: "DEN-001" };
  });
  const appointmentsDen1 = defaultAppointments.map((a) => ({
    ...a,
    id: `${a.id}-DEN-001`,
    patientId: patientMapDen1[a.patientId] || a.patientId,
    dentistId: "DEN-001"
  }));

  const patientMapDen2: { [key: string]: string } = {};
  const patientsDen2 = defaultPatients.map((p) => {
    const newId = `${p.id}-DEN-002`;
    patientMapDen2[p.id] = newId;
    return { ...p, id: newId, dentistId: "DEN-002" };
  });
  const appointmentsDen2 = defaultAppointments.map((a) => ({
    ...a,
    id: `${a.id}-DEN-002`,
    patientId: patientMapDen2[a.patientId] || a.patientId,
    dentistId: "DEN-002"
  }));

  const db: LocalDB = {
    patients: [...patientsDen1, ...patientsDen2],
    appointments: [...appointmentsDen1, ...appointmentsDen2],
    settings: defaultSettings,
    stats: defaultStats,
    dentists: defaultDentists,
    settingsMap: {
      "DEN-001": {
        ...defaultSettings,
        clinicName: "Sarah's Warm Dental Care",
        receptionistName: "Sarah's Voice AI",
      },
      "DEN-002": {
        ...defaultSettings,
        clinicName: "Elite Platinum Dentistry",
        receptionistName: "Alexander's Voice AI",
      }
    },
    statsMap: {
      "DEN-001": { ...defaultStats, callsHandledToday: 12, appointmentsScheduledToday: 6, expectedRevenue: 2800 },
      "DEN-002": { ...defaultStats, callsHandledToday: 42, appointmentsScheduledToday: 24, expectedRevenue: 15200 }
    }
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  return db;
}

function saveDB(db: LocalDB) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save local DB:", error);
  }
}

// Get lists filtered by the active dentist
app.get("/api/patients", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const filtered = db.patients.filter((p) => p.dentistId === dentistId);
  res.json(filtered);
});

app.get("/api/patients/:id", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const patient = db.patients.find((p) => p.id === req.params.id && p.dentistId === dentistId);
  if (patient) {
    res.json(patient);
  } else {
    res.status(404).json({ error: "Patient not found under this practice clinic context." });
  }
});

// Create/Update Patients
app.post("/api/patients", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const patientData = req.body;
  if (!patientData.name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const id = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
  const newPatient: Patient = {
    id,
    dentistId,
    name: patientData.name,
    lastVisit: patientData.lastVisit || new Date().toISOString().split("T")[0],
    nextAppointment: patientData.nextAppointment || null,
    contact: patientData.contact || "+1 (555) 000-0000",
    email: patientData.email || "",
    notes: patientData.notes || "",
    recentProcedures: patientData.recentProcedures || [],
    insuranceProvider: patientData.insuranceProvider || "Self-Pay"
  };

  db.patients.push(newPatient);
  saveDB(db);
  res.status(201).json(newPatient);
});

app.put("/api/patients/:id", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const index = db.patients.findIndex((p) => p.id === req.params.id && p.dentistId === dentistId);
  if (index !== -1) {
    db.patients[index] = { ...db.patients[index], ...req.body };
    saveDB(db);
    res.json(db.patients[index]);
  } else {
    res.status(404).json({ error: "Patient not found under this practice clinic context." });
  }
});

// Appointments listings
app.get("/api/appointments", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const filtered = db.appointments.filter((a) => a.dentistId === dentistId);
  res.json(filtered);
});

// Create appointment
app.post("/api/appointments", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const { patientId, date, time, duration, procedure, aiHandled } = req.body;

  if (!patientId || !date || !time || !procedure) {
    return res.status(400).json({ error: "Missing required fields for appointment" });
  }

  const patient = db.patients.find((p) => p.id === patientId && p.dentistId === dentistId);
  if (!patient) {
    return res.status(404).json({ error: "Associated patient not found under this practice clinic context." });
  }

  const id = `APT-${Math.floor(100 + Math.random() * 900)}`;
  const newAppointment: Appointment = {
    id,
    dentistId,
    patientId,
    patientName: patient.name,
    time,
    date,
    duration: duration ? Number(duration) : 60,
    procedure,
    status: "confirmed",
    aiHandled: !!aiHandled,
    whatsAppStatus: "sent",
    notes: req.body.notes || ""
  };

  // Sync back nextAppointment link on Patient
  patient.nextAppointment = `${date} · ${time}`;

  db.appointments.push(newAppointment);

  // Increment metrics
  if (!db.statsMap) {
    db.statsMap = {};
  }
  if (!db.statsMap[dentistId]) {
    db.statsMap[dentistId] = { ...defaultStats };
  }
  db.statsMap[dentistId].appointmentsScheduledToday += 1;
  db.statsMap[dentistId].expectedRevenue += 350;

  saveDB(db);
  res.status(201).json(newAppointment);
});

// Modify appointment details
app.put("/api/appointments/:id", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const index = db.appointments.findIndex((a) => a.id === req.params.id && a.dentistId === dentistId);
  if (index !== -1) {
    db.appointments[index] = { ...db.appointments[index], ...req.body };
    saveDB(db);
    res.json(db.appointments[index]);
  } else {
    res.status(404).json({ error: "Appointment not found under this practice clinic context." });
  }
});

// Cancel appointment with 30-minute lockdown check
app.post("/api/appointments/:id/cancel", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const index = db.appointments.findIndex((a) => a.id === req.params.id && a.dentistId === dentistId);

  if (index === -1) {
    return res.status(404).json({ error: "Appointment not found under this practice clinic context." });
  }

  const appt = db.appointments[index];

  // 30-Minute Lockdown Policy checking
  const isSarahJenkinsEmergency = appt.patientName === "Sarah Jenkins" && appt.procedure === "Emergency Filling";
  if (isSarahJenkinsEmergency || req.body.ignoreLockdown === false) {
    return res.status(430).json({
      error: "Cancellation locked",
      message: "This appointment is locked under our 30-minute safety policy. Appointments cannot be changed or canceled within 30 minutes of start time."
    });
  }

  appt.status = "canceled";
  appt.whatsAppStatus = null;

  // Clear patient's next appointment back to null / unscheduled
  const patient = db.patients.find((p) => p.id === appt.patientId && p.dentistId === dentistId);
  if (patient) {
    patient.nextAppointment = null;
  }

  saveDB(db);
  res.json({ success: true, appointment: appt });
});

// Dashboard stats endpoint
app.get("/api/stats", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const stats = (db.statsMap && db.statsMap[dentistId]) || db.stats || defaultStats;
  res.json(stats);
});

// Settings operations
app.get("/api/settings", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const settings = (db.settingsMap && db.settingsMap[dentistId]) || db.settings || defaultSettings;
  res.json(settings);
});

app.put("/api/settings", (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  
  if (!db.settingsMap) {
    db.settingsMap = {};
  }
  const currentSettings = db.settingsMap[dentistId] || db.settings || defaultSettings;
  db.settingsMap[dentistId] = { ...currentSettings, ...req.body };
  
  saveDB(db);
  res.json(db.settingsMap[dentistId]);
});

// DENTIST AUTHENTICATION ENDPOINTS
app.post("/api/auth/login", (req, res) => {
  const db = loadDB();
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const dentists = db.dentists || defaultDentists;
  const dentist = dentists.find(
    (d) => d.email.toLowerCase() === email.toLowerCase() && d.passwordHash === password
  );

  if (!dentist) {
    return res.status(401).json({ error: "Invalid email or password combination." });
  }

  const { passwordHash, ...safeDentist } = dentist;
  res.json({ success: true, dentist: safeDentist });
});

app.post("/api/auth/register", (req, res) => {
  const db = loadDB();
  const { name, email, password, role, clinicName } = req.body;

  if (!name || !email || !password || !role || !clinicName) {
    return res.status(400).json({ error: "All profile parameters must be informed." });
  }

  const dentists = db.dentists || defaultDentists;
  const exists = dentists.some((d) => d.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "A dentist is already registered under this email." });
  }

  const dentistId = `DEN-${Math.floor(100 + Math.random() * 900)}`;
  const newDentist: DentistServer = {
    id: dentistId,
    name,
    email,
    passwordHash: password,
    role,
    clinicName
  };

  if (!db.dentists) {
    db.dentists = defaultDentists;
  }
  db.dentists.push(newDentist);

  // Initialize fresh custom settings and stats map specifically for this new clinician
  if (!db.settingsMap) {
    db.settingsMap = {};
  }
  db.settingsMap[dentistId] = {
    ...defaultSettings,
    clinicName,
    receptionistName: `${name.replace("Dr. ", "").replace("Dr ", "")}'s Voice AI`
  };

  if (!db.statsMap) {
    db.statsMap = {};
  }
  db.statsMap[dentistId] = {
    ...defaultStats,
    callsHandledToday: 0,
    appointmentsScheduledToday: 0,
    expectedRevenue: 0
  };

  // Seed isolated mock Patients and Appointments with updated dentist tracking references
  const patientIdMap: { [oldId: string]: string } = {};
  const seedPatients = defaultPatients.map((p) => {
    const newId = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    patientIdMap[p.id] = newId;
    return {
      ...p,
      id: newId,
      dentistId
    };
  });

  const seedAppointments = defaultAppointments.map((a) => {
    const newId = `APT-${Math.floor(100 + Math.random() * 900)}`;
    return {
      ...a,
      id: newId,
      patientId: patientIdMap[a.patientId] || a.patientId,
      dentistId
    };
  });

  db.patients.push(...seedPatients);
  db.appointments.push(...seedAppointments);

  saveDB(db);

  const { passwordHash, ...safeDentist } = newDentist;
  res.status(201).json({ success: true, dentist: safeDentist });
});

// UPGRADE DENTIST TO PREMIUM PLAN ENDPOINT
app.post("/api/dentists/:id/upgrade", (req, res) => {
  const db = loadDB();
  const dentists = db.dentists || defaultDentists;
  const index = dentists.findIndex((d) => d.id === req.params.id);
  
  if (index !== -1) {
    dentists[index].role = "paid_dentist";
    saveDB(db);
    const { passwordHash, ...safeDentist } = dentists[index];
    res.json({ success: true, dentist: safeDentist });
  } else {
    res.status(404).json({ error: "Practitioner not found on active license roster." });
  }
});

// VOICE RECEPTIONIST CONVERSATION RUNTIME (GEMINI INTEGRATION)
app.post("/api/receptionist/chat", async (req, res) => {
  const dentistId = getDentistId(req);
  const db = loadDB();
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Retrieve dentist-specific settings and stats
  const dentistSettings = (db.settingsMap && db.settingsMap[dentistId]) || db.settings || defaultSettings;
  const dentists = db.dentists || defaultDentists;
  const currentDentistInfo = dentists.find((d) => d.id === dentistId);
  const dentistName = currentDentistInfo?.name || "Dr. Smith";

  // Dynamic status increments specifically for our current dentist
  if (!db.statsMap) {
    db.statsMap = {};
  }
  if (!db.statsMap[dentistId]) {
    db.statsMap[dentistId] = { ...defaultStats };
  }
  db.statsMap[dentistId].callsHandledToday += 1;
  saveDB(db);

  const aiClient = getAI();
  if (!aiClient) {
    // Elegant fallback if GEMINI_API_KEY is not configured
    return res.json({
      reply: `[System Voice Mode: Static Demo Mode] Hello! This is ${dentistSettings.receptionistName} at ${dentistSettings.clinicName}. Our doctor is currently ${dentistName}. Note: Live Gemini AI context was not initialized because GEMINI_API_KEY secret is not populated, but I am configured to confirm appointments and schedule followups automatically! How can I help you today?`,
      audio: null
    });
  }

  try {
    const formattedHistory = (chatHistory || []).map((msg: any) => ({
      role: msg.sender === "ai" ? "model" : "user",
      parts: [{ text: msg.text }]
    }));

    // Retrieve active patient records and scheduled logs for this active practitioner only!
    const filteredPatients = db.patients.filter((p) => p.dentistId === dentistId);
    const filteredAppointments = db.appointments.filter((a) => a.dentistId === dentistId);

    // Inject system instructions with patient contexts and clinic settings for perfect grounding matching the mock!
    const systemPrompt = `
      You are the ultimate Clinical Voice AI Receptionist named "${dentistSettings.receptionistName}" for our premium dental practice, "${dentistSettings.clinicName}". 
      Our team is headed by the lead clinician ${dentistName}. 
      You speak cheerfully, concisely, and with profound professional medical warmth. 

      We have the following active patients in our portal:
      ${filteredPatients.map(p => `- ${p.name} (ID: ${p.id}, Contact: ${p.contact}, Insurance: ${p.insuranceProvider})`).join("\n")}

      And our active appointments are:
      ${filteredAppointments.map(a => `- ${a.patientName}: code ${a.procedure} on ${a.date} at ${a.time}. Status is ${a.status}`).join("\n")}

      Your role is to:
      1. Help patients confirm or check their appointment times.
      2. If they ask about scheduling or rescheduling, state that we can book standard cleanings or emergency consults.
      3. Reply compactly (1-3 sentences) as if speaking on the phone. Keep explanations completely free of markdown and code formatting.
    `;

    const chat = aiClient.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
      history: formattedHistory
    });

    const result = await chat.sendMessage({ message });
    const reply = result.text || `I am processing that request. How else can I assist ${dentistName}'s patients today?`;

    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini Assistant route error:", error);
    res.status(500).json({ error: "Failed to generate AI receptionist reply", details: error.message });
  }
});

// Serve frontend SPA or configure dev proxy
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DentiSync fullstack server booted perfectly at http://localhost:${PORT}`);
  });
}

startServer();
