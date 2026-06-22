import { supabase, AUDIO_BUCKET } from './supabase';
import crypto from 'crypto';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
  throw new Error('Missing ElevenLabs env vars');
}

export async function generateSpeech(text: string): Promise<string> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs failed: ${res.status} ${errText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const filename = `${crypto.randomUUID()}.mp3`;

  const { error: uploadErr } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(filename, buffer, {
      contentType: 'audio/mpeg',
      cacheControl: '3600',
    });

  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
