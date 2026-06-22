import { NextRequest } from 'next/server';
import { runTurn } from '@/lib/conversation';
import { generateSpeech } from '@/lib/tts';
import { twimlResponse, escapeXml } from '@/lib/twiml';
import { endCall } from '@/lib/db';

const BASE_URL = process.env.PUBLIC_BASE_URL!;

export async function POST(req: NextRequest) {
  let callSid = '';
  try {
    const formData = await req.formData();
    callSid = String(formData.get('CallSid') || '');
    const speechResult = String(formData.get('SpeechResult') || '').trim();

    if (!callSid) {
      return twimlResponse(`<Say>Missing call ID. Goodbye.</Say><Hangup/>`);
    }

    if (!speechResult) {
      const audioUrl = await generateSpeech("I didn't catch that. Could you say it again?");
      return twimlResponse(`
        <Play>${escapeXml(audioUrl)}</Play>
        <Gather input="speech" speechTimeout="auto" action="${BASE_URL}/api/voice/gather" method="POST"/>
        <Say>I still didn't hear anything. Goodbye.</Say>
        <Hangup/>
      `);
    }

    console.log(`[${callSid}] step=gather_received speech="${speechResult}"`);
    const t0 = Date.now();
    const { reply, shouldHangup } = await runTurn(callSid, speechResult);
    console.log(`[${callSid}] step=turn_done ms=${Date.now() - t0} hangup=${shouldHangup}`);

    const audioUrl = await generateSpeech(reply);

    if (shouldHangup) {
      await endCall(callSid, 'completed');
      return twimlResponse(`
        <Play>${escapeXml(audioUrl)}</Play>
        <Hangup/>
      `);
    }

    return twimlResponse(`
      <Play>${escapeXml(audioUrl)}</Play>
      <Gather input="speech" speechTimeout="auto" action="${BASE_URL}/api/voice/gather" method="POST"/>
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
