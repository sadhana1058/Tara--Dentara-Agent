// Pre-GPT safety checks on raw speech input.
// These run BEFORE the text reaches the LLM so injection/emergency
// handling is deterministic and can't be bypassed by clever phrasing.

const INJECTION_PATTERNS = [
  /ignore\s+(your\s+)?(previous\s+|all\s+)?instructions/i,
  /forget\s+(everything|all|your)/i,
  /you\s+are\s+now\s+a/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /act\s+as\s+(if\s+you\s+are|a\s+different)/i,
  /your\s+new\s+(instructions|role|persona|system)/i,
  /disregard\s+(your|all|previous)/i,
  /override\s+(your\s+)?(instructions|rules|system)/i,
  /system\s+prompt/i,
  /jailbreak/i,
  /\[system\]/i,
  /assistant\s*:/i,
  /new\s+persona/i,
  /roleplay\s+as/i,
  /do\s+anything\s+now/i,
];

// Dental-specific life-threatening or time-critical emergencies
const LIFE_THREATENING_PATTERNS = [
  /\b(can'?t|cannot)\s+breathe/i,
  /\bairway\b/i,
  /going\s+to\s+(die|pass\s+out|faint)/i,
  /\bconvuls/i,
  /severe\s+swelling\s+(in\s+)?(my\s+)?(throat|neck)/i,
  /spreading\s+(fast|quickly|rapidly)/i,
  /\bcall\s+911\b/i,
  /\bneed\s+an?\s+ambulance\b/i,
];

const DENTAL_EMERGENCY_PATTERNS = [
  /\bemergency\b/i,
  /severe\s+(tooth\s*)?pain/i,
  /unbearable\s+(pain|toothache)/i,
  /excruciating/i,
  /knocked[\s-]?out\s+(my\s+)?tooth/i,
  /tooth\s+(got\s+)?knocked\s+out/i,
  /\bbroken\s+jaw\b/i,
  /\bcracked\s+jaw\b/i,
  /heavy\s+bleeding/i,
  /won'?t\s+stop\s+bleeding/i,
  /\babscess\b/i,
  /dental\s+abscess/i,
  /infected\s+(tooth|gum)/i,
  /\bswollen\s+(face|jaw|cheek)\b/i,
  /face\s+(is\s+)?(swollen|swelling)/i,
];

export type SafetyResult =
  | { safe: true }
  | { safe: false; type: 'injection' }
  | { safe: false; type: 'life_threatening' }
  | { safe: false; type: 'dental_emergency' };

export function checkSafety(text: string): SafetyResult {
  // Suspiciously long for natural speech — likely a pasted injection payload
  if (text.length > 450) return { safe: false, type: 'injection' };

  if (INJECTION_PATTERNS.some(p => p.test(text))) return { safe: false, type: 'injection' };
  if (LIFE_THREATENING_PATTERNS.some(p => p.test(text))) return { safe: false, type: 'life_threatening' };
  if (DENTAL_EMERGENCY_PATTERNS.some(p => p.test(text))) return { safe: false, type: 'dental_emergency' };

  return { safe: true };
}
