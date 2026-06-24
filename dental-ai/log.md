# Go-Live Log

## STEP 1 — Fix ElevenLabs 402

### Actions
- Updated `ELEVENLABS_VOICE_ID` in `.env.local` to `21m00Tcm4TlvDq8ikWAM` (Rachel — free premade)
- Verified `lib/tts.ts` reads voice ID from `process.env.ELEVENLABS_VOICE_ID` (no hardcoding)
- Created `scripts/test-tts.ts`

### Smoke Test 1 Result
✅ PASS (partial) — Rachel `21m00Tcm4TlvDq8ikWAM` → 402. Switched to Eric `cjVigY5qzO86Huf0OWal` → ElevenLabs call succeeded.
Error changed to "Bucket not found" — TTS works, Supabase audio bucket missing. Proceeding to Step 2.

## STEP 2 — Create Supabase audio bucket (manual)
✅ PASS — Bucket `audio` created (public). Re-ran test-tts.ts → URL returned: https://zeartjfhwwsqfaflyeco.supabase.co/storage/v1/object/public/audio/...mp3

## STEP 3 — Seed clinic row
✅ PASS — Clinic already existed: `26176ebf-1e12-4158-ab88-5392f790496f` "Dr. Smith's Dental Office"
  - google_calendar_id: sadhanasaravanan103@gmail.com ✓
  - google_refresh_token: ✓ set
  - test-clinic.ts confirmed 2 rows (Smile Dental has no refresh token — not used)

## STEP 4 — Clinic resolution in incoming route
✅ PASS — Incoming webhook with `?clinic_id=26176ebf...` returned valid TwiML with `<Play>` URL
  - calls row `test-call-001`: clinic_id = `26176ebf-1e12-4158-ab88-5392f790496f` (non-null ✓)
  - clinic_id threads through gather URL query param ✓
  - gather → runTurn(clinic) → callTool passes clinic_id to /api/book ✓
NOTE: action URL is relative (no BASE_URL set locally) — will be absolute on Vercel.

## STEP 5 — Full booking chain
✅ PASS (5a) — /api/availability returned 16 slots for 2026-06-24
✅ PASS (5b) — /api/book returned success, appointment_id: fc01aed8-fe4b-4c7b-b563-e6074112922a
  - Supabase appointments row: clinic_id ✓, calendar_event_id: bf03u6ehih73861dppidvcolvk ✓
  - Google Calendar event created ✓

## STEP 6 — Deploy to Vercel
STATUS: WAITING for user to push + deploy.
