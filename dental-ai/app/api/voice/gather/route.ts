import { NextRequest } from 'next/server';
import { runTurn } from '@/lib/conversation';
import { generateSpeech } from '@/lib/tts';
import { twimlResponse, escapeXml } from '@/lib/twiml';
import { endCall, getClinicForCall } from '@/lib/db';

const BASE_URL = process.env.PUBLIC_BASE_URL!;

export async function POST(req: NextRequest) {
  let callSid = '';
  try {
    const formData    = await req.formData();
    callSid           = String(formData.get('CallSid') || '');
    const speechResult = String(formData.get('SpeechResult') || '').trim();
    const clinicId    = req.nextUrl.searchParams.get('clinic_id') ?? undefined;

    if (!callSid) {
      return twimlResponse(`<Say>Missing call ID. Goodbye.</Say><Hangup/>`);
    }

    if (!speechResult) {
      const audioUrl = await generateSpeech("I didn't catch that. Could you say it again?");
      const gatherUrl = `${BASE_URL}/api/voice/gather${clinicId ? `?clinic_id=${clinicId}` : ''}`;
      return twimlResponse(`
        <Play>${escapeXml(audioUrl)}</Play>
        <Gather input="speech" speechTimeout="auto" action="${escapeXml(gatherUrl)}" method="POST"/>
        <Say>I still didn't hear anything. Goodbye.</Say>
        <Hangup/>
      `);
    }

    // Look up clinic from the call record (most reliable source)
    const clinic = await getClinicForCall(callSid);

    console.log(`[${callSid}] step=gather_received speech="${speechResult}" clinic=${clinic?.id ?? 'unknown'}`);
    const t0 = Date.now();
    const { reply, shouldHangup } = await runTurn(callSid, speechResult, clinic);
    const t1 = Date.now();
    const audioUrl = await generateSpeech(reply);
    const t2 = Date.now();
    console.log(`[${callSid}] gpt=${t1 - t0}ms tts=${t2 - t1}ms total=${t2 - t0}ms hangup=${shouldHangup}`);

    const gatherUrl = `${BASE_URL}/api/voice/gather${clinicId ? `?clinic_id=${clinicId}` : ''}`;

    if (shouldHangup) {
      await endCall(callSid, 'completed');
      return twimlResponse(`
        <Play>${escapeXml(audioUrl)}</Play>
        <Hangup/>
      `);
    }

    return twimlResponse(`
      <Play>${escapeXml(audioUrl)}</Play>
      <Gather input="speech" speechTimeout="auto" action="${escapeXml(gatherUrl)}" method="POST"/>
      <Say>Are you still there? Goodbye.</Say>
      <Hangup/>
    `);
  } catch (err: any) {
    console.error('gather error:', err);
    if (callSid) {
      try { await endCall(callSid, 'error'); } catch {}
    }
    return twimlResponse(`<Say>Sorry, we're having technical difficulties. Please call back. Goodbye.</Say><Hangup/>`);
  }
}
