import 'dotenv/config';
import { supabase } from '../lib/supabase';
import { openai } from '../lib/openai';
import { getCalendarClient, CALENDAR_ID } from '../lib/google';

async function main() {
  console.log('Testing Supabase...');
  const { error: sbError } = await supabase.from('calls').select('call_sid').limit(1);
  if (sbError) throw new Error(`Supabase: ${sbError.message}`);
  console.log('✓ Supabase OK');

  console.log('Testing OpenAI...');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'say "ok" and nothing else' }],
    max_tokens: 5,
  });
  console.log('✓ OpenAI OK:', completion.choices[0].message.content);

  console.log('Testing Google Calendar...');
  const cal = getCalendarClient();
  const list = await cal.calendarList.list();
  console.log('✓ Google Calendar OK:', list.data.items?.length ?? 0, 'calendars');

  console.log('\nAll green ✓');
}

main().catch((e) => {
  console.error('✗ FAILED:', e.message);
  process.exit(1);
});
