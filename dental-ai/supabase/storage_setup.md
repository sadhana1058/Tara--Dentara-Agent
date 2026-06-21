# Supabase Storage — Manual Setup

Create the audio bucket for ElevenLabs TTS files (Twilio `<Play>` fetches these directly).

## Steps

1. Go to **Supabase Dashboard → Storage**
2. Click **New bucket**
3. Name it **`audio`** (must match `AUDIO_BUCKET` constant in `lib/supabase.ts`)
4. Toggle **"Public bucket"** ON — Twilio must be able to fetch the URL without auth
5. Set **file size limit**: `5 MB`
6. Set **allowed MIME types**: `audio/mpeg`
7. Click **Save**

## Verify

Open the bucket and confirm the badge says **Public**. Test by uploading any `.mp3` file and opening its public URL in an incognito tab — it should play without authentication.

> **Why public?** Twilio's `<Play>` fetches the URL server-side from Twilio's infrastructure.
> It cannot pass Supabase auth headers, so a private bucket would return 400/403 and the call would go silent.
