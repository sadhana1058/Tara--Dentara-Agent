# CLAUDE.md

Project context for Claude Code. Read this first on every session.

## What this is

Dental AI receptionist MVP. A patient calls a Twilio number → an AI (GPT-4o-mini with ElevenLabs voice) holds a real conversation → checks the dentist's Google Calendar → books a 30-min appointment → it appears in Google Calendar, Supabase, and a simple dashboard.

**MVP scope only.** Single dentist hardcoded via env vars. No multi-tenant, no auth UI, no reschedule/cancel, no reminders, no WhatsApp. Don't add these without being asked.

## Stack — do not substitute

- **Framework:** Next.js 14, App Router, TypeScript, Tailwind
- **Hosting:** Vercel (free tier)
- **DB + Storage:** Supabase (service role key, no RLS for MVP)
- **LLM:** OpenAI `gpt-4o-mini` via `openai` SDK (NOT GPT-4o — too slow/expensive)
- **TTS:** ElevenLabs `eleven_turbo_v2_5` model (NOT v2 — turbo is required for latency)
- **Voice:** Twilio `<Gather input="speech">` — turn-based, NOT Media Streams
- **Calendar:** `googleapis` SDK with manually-obtained refresh token
- **Dates/timezones:** ALWAYS Luxon. NEVER `new Date()` for timezone math.

## Folder structure

```
/app
  /api
    /voice/incoming/route.ts   # Twilio webhook: call starts
    /voice/gather/route.ts     # Twilio webhook: speech turn (main AI loop)
    /voice/status/route.ts     # Twilio webhook: call ended
    /availability/route.ts     # Tool endpoint: free slots for a date
    /book/route.ts             # Tool endpoint: create appointment
  /dashboard-7k3x/page.tsx     # Obscure URL = "auth" for MVP
/lib
  supabase.ts        # client
  openai.ts          # client + model constant
  google.ts          # calendar client factory
  tts.ts             # generateSpeech(text) → public URL
  prompt.ts          # systemPrompt() + TOOLS schema
  conversation.ts    # runTurn(callSid, userText) → { reply, shouldHangup }
  db.ts              # all DB queries live here
  twiml.ts           # twimlResponse() + escapeXml()
/types/index.ts      # shared types
/supabase/schema.sql # source of truth for DB schema
```

**Rule:** No DB queries inside route handlers. All queries go through `lib/db.ts`.

## Database schema (2 tables)

- `calls (call_sid PK, from_number, conversation JSONB, status, ended_reason, created_at, updated_at)`
- `appointments (id, call_sid FK, patient_name, patient_phone, start_time, end_time, calendar_event_id, status, created_at)`

`conversation` JSONB stores the full OpenAI message history including tool calls.

## Env vars (all required)

```
OPENAI_API_KEY
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GOOGLE_CALENDAR_ID         # dentist's email
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY  # service role, not anon
PUBLIC_BASE_URL            # Vercel URL, no trailing slash
CLINIC_TIMEZONE            # e.g. America/New_York
CLINIC_NAME                # e.g. Dr. Smith's Dental Office
```

Never hardcode any of these. Read from `process.env` and throw early if missing.

## Conventions

- **Route handlers** always export `async function POST(req: NextRequest)`. No GET unless explicitly needed.
- **TwiML responses** always go through `twimlResponse()` in `lib/twiml.ts`. Never hand-build XML strings.
- **Twilio sends `application/x-www-form-urlencoded`** — use `await req.formData()`, NOT `req.json()`.
- **Errors in voice routes** must return valid TwiML with `<Say>` fallback + `<Hangup/>`. Never return JSON to Twilio.
- **Tool calls from GPT** loop until a plain text reply OR safety cap of 6 iterations. See `lib/conversation.ts`.
- **Office hours:** Mon–Fri 9am–5pm in `CLINIC_TIMEZONE`. Slots are 30 min. Validate in `/api/book`, don't trust GPT.
- **Phone numbers** stored as digits only. Strip non-digits before insert.
- **Times** stored as ISO 8601 with timezone offset, never naive.

## What's already decided (don't relitigate)

- ✅ Turn-based voice with `<Gather>`, not Media Streams (Media Streams = 2-day refactor)
- ✅ ElevenLabs MP3 uploaded to Supabase Storage public bucket `audio`, URL passed to `<Play>`
- ✅ Single hardcoded dentist (env vars), no multi-tenant
- ✅ No Supabase RLS (we use service role key)
- ✅ Dashboard at obscure URL, no auth UI
- ✅ Vercel free tier, single deployment

## Known gotchas — check these before debugging

1. **Twilio trial accounts** can only call/text **verified** caller IDs. Add the test phone in Twilio Console first.
2. **Google Calendar timezones** — pass `timeZone` field in both `freebusy.query` and `events.insert`. Don't rely on Calendar inferring it.
3. **ElevenLabs voice ID** is the long alphanumeric string, NOT the voice name ("Rachel" ≠ voice ID).
4. **Supabase Storage bucket** must be PUBLIC for Twilio `<Play>` to fetch the URL. Test the URL in incognito.
5. **Twilio webhook timeout = 15 seconds.** Tool fetches must time out at 8s. Long GPT calls will kill the call.
6. **OpenAI tool call args** come as a JSON string in `tool_call.function.arguments` — must `JSON.parse()`.
7. **Past slots** — `/api/availability` must filter out times before `DateTime.now()`. GPT will try to book yesterday otherwise.
8. **Phone number spoken as words** — GPT must convert "five five five" → "555" before passing to `book_appointment`. This is in the system prompt; don't remove it.

## Latency target

End-to-end per turn: GPT (~1.5s) + ElevenLabs TTS (~1.5s) + Storage upload (~0.5s) ≈ 3.5–5s of dead air per turn. This is the architectural ceiling for `<Gather>` — acceptable for MVP. Don't try to optimize below 3s; the fix is Media Streams (out of scope).

## Testing approach

- **Always test endpoints with curl before touching voice.** `/api/availability` and `/api/book` must work standalone.
- **After every change to `conversation.ts` or `prompt.ts`**, make a real test call.
- **Log structure:** `console.log('[${callSid}] step=X ms=Y')` so latency is greppable in Vercel logs.

## When you (Claude) are unsure

- **Schema change?** Ask before editing. Mention it in `supabase/schema.sql` first.
- **Adding a dependency?** Ask. We chose this stack deliberately.
- **Refactoring?** Don't. Ugly working code beats clean broken code for an MVP. Refactor after launch.
- **Adding error retries?** Don't. Fail fast, log, return TwiML fallback. Retries hide real bugs.
- **"Should I add tests"?** No. MVP. Real phone call IS the test.

## Out of MVP scope (v2)

WhatsApp · reminders · reschedule/cancel · multi-tenant · dentist auth · emergency escalation · HIPAA BAAs · Twilio Media Streams · streaming TTS · admin UI for prompt editing.

If user asks for any of these, build them — but flag that they're outside the original MVP scope.