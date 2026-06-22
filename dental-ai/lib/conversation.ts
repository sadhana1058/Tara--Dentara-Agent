import { openai, OPENAI_MODEL } from './openai';
import { systemPrompt, TOOLS } from './prompt';
import { getConversation, saveConversation } from './db';
import type { ConversationMessage, Clinic } from '@/types';

const BASE_URL = process.env.PUBLIC_BASE_URL!;

type TurnResult = {
  reply: string;
  shouldHangup: boolean;
};

async function callTool(name: string, args: any, callSid: string, clinic: Clinic | null): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    if (name === 'check_availability') {
      const res = await fetch(`${BASE_URL}/api/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, clinic_id: clinic?.id }),
        signal: controller.signal,
      });
      return await res.json();
    }
    if (name === 'book_appointment') {
      const res = await fetch(`${BASE_URL}/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...args, call_sid: callSid, clinic_id: clinic?.id }),
        signal: controller.signal,
      });
      return await res.json();
    }
    return { error: `unknown tool: ${name}` };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runTurn(callSid: string, userText: string, clinic: Clinic | null): Promise<TurnResult> {
  let conversation = await getConversation(callSid);

  if (conversation.length === 0) {
    conversation.push({ role: 'system', content: systemPrompt(clinic?.clinic_name) });
  }

  conversation.push({ role: 'user', content: userText });

  if (conversation.length > 22) {
    conversation = [conversation[0], ...conversation.slice(-20)];
  }

  let bookedThisTurn = false;
  let safetyCounter  = 0;

  while (safetyCounter++ < 6) {
    console.log(`[${callSid}] step=openai_call turn=${safetyCounter} messages=${conversation.length}`);
    const t0 = Date.now();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: conversation as any,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.6,
    });

    console.log(`[${callSid}] step=openai_done ms=${Date.now() - t0}`);

    const msg = completion.choices[0].message;
    conversation.push(msg as any);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        if (tc.type !== 'function') continue;
        let args: any = {};
        try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }

        console.log(`[${callSid}] step=tool_call name=${tc.function.name} args=${JSON.stringify(args)}`);
        const t1 = Date.now();
        const result = await callTool(tc.function.name, args, callSid, clinic);
        console.log(`[${callSid}] step=tool_done name=${tc.function.name} ms=${Date.now() - t1}`);

        if (tc.function.name === 'book_appointment' && result.success) bookedThisTurn = true;

        conversation.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue;
    }

    const reply = (msg.content || '').trim();
    await saveConversation(callSid, conversation);

    const lowered    = reply.toLowerCase();
    const goodbye    = /goodbye|have a (good|great) day|bye now|take care/.test(lowered);
    const shouldHangup = bookedThisTurn || goodbye;

    return { reply, shouldHangup };
  }

  await saveConversation(callSid, conversation);
  return { reply: "I'm having trouble processing that. Let me have someone call you back. Goodbye.", shouldHangup: true };
}
