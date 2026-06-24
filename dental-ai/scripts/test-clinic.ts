import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const { supabase } = await import('../lib/supabase');
  const { data, error } = await supabase
    .from('clinics')
    .select('id, clinic_name, doctor_name, username, google_calendar_id, google_refresh_token');
  if (error) throw new Error(error.message);
  console.log(`✓ ${data.length} clinic(s) found:`);
  data.forEach(c => {
    console.log(`  ID:             ${c.id}`);
    console.log(`  Clinic:         ${c.clinic_name}`);
    console.log(`  Calendar:       ${c.google_calendar_id}`);
    console.log(`  Refresh token:  ${c.google_refresh_token ? '✓ set' : '✗ MISSING'}`);
    console.log('');
  });
}

main().catch((e) => { console.error('✗ FAILED:', e.message); process.exit(1); });
