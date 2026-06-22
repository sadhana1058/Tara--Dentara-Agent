import { NextRequest } from 'next/server';
import { endCall } from '@/lib/db';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const callSid = String(formData.get('CallSid') || '');
  const callStatus = String(formData.get('CallStatus') || '');

  if (callSid && (callStatus === 'completed' || callStatus === 'failed')) {
    try {
      await endCall(callSid, callStatus);
    } catch (e) {
      console.error('status update failed', e);
    }
  }
  return new Response('ok', { status: 200 });
}
