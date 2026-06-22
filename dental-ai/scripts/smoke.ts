import { config } from 'dotenv';
config({ path: '.env.local' });

// Dynamic imports so env vars are populated before modules read process.env
async function main() {
  const { supabase } = await import('../lib/supabase');
  const { openai } = await import('../lib/openai');
  const { getCalendarClient } = await import('../lib/google');

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
