import { NextRequest } from 'next/server';
import { createCall, getClinicById } from '@/lib/db';
import { generateSpeech } from '@/lib/tts';
import { twimlResponse, escapeXml } from '@/lib/twiml';

const BASE_URL = process.env.PUBLIC_BASE_URL!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid   = String(formData.get('CallSid') || '');
    const from      = String(formData.get('From') || '') || null;

    // clinic_id passed as query param in the Twilio webhook URL
    const clinicId  = req.nextUrl.searchParams.get('clinic_id') ?? undefined;

    if (!callSid) {
      return twimlResponse(`<Say>Missing call SID.</Say><Hangup/>`);
    }

    await createCall(callSid, from, clinicId);

    const clinic     = clinicId ? await getClinicById(clinicId) : null;
    const clinicName = clinic?.clinic_name ?? process.env.CLINIC_NAME ?? "the dental office";

    const greeting = `Hello, thank you for calling ${clinicName}. How can I help you today?`;
    const audioUrl = await generateSpeech(greeting);

    const gatherUrl = `${BASE_URL}/api/voice/gather${clinicId ? `?clinic_id=${clinicId}` : ''}`;

    return twimlResponse(`
      <Play>${escapeXml(audioUrl)}</Play>
      <Gather input="speech" speechTimeout="auto" action="${escapeXml(gatherUrl)}" method="POST">
      </Gather>
      <Say>I didn't hear anything. Goodbye.</Say>
      <Hangup/>
    `);
  } catch (err: any) {
    console.error('incoming error:', err);
    return twimlResponse(`<Say>We're having technical difficulties. Please call back later.</Say><Hangup/>`);
  }
}
