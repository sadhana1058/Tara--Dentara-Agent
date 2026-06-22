import { config } from 'dotenv';
config({ path: '.env.local' });

import bcrypt from 'bcryptjs';

async function main() {
  const { supabase } = await import('../lib/supabase');

  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.log('Usage: npm run add-clinic "<clinic_name>" "<doctor_name>" "<gmail>" "<username>" "<password>"');
    console.log('Example: npm run add-clinic "Smile Dental" "Dr. Sarah Lee" "sarah@gmail.com" "sarah" "mypassword"');
    process.exit(1);
  }

  const [clinicName, doctorName, gmail, username, password] = args;
  const passwordHash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('clinics')
    .insert({
      clinic_name:          clinicName,
      doctor_name:          doctorName,
      google_calendar_id:   gmail,
      google_refresh_token: null, // add manually after OAuth Playground
      username,
      password_hash:        passwordHash,
    })
    .select('id, clinic_name, doctor_name, username')
    .single();

  if (error) throw new Error(error.message);

  console.log('✓ Clinic created:');
  console.log(`  ID:       ${data.id}`);
  console.log(`  Clinic:   ${data.clinic_name}`);
  console.log(`  Doctor:   ${data.doctor_name}`);
  console.log(`  Username: ${data.username}`);
  console.log('');
  console.log('Twilio webhook URL (set this in Twilio console):');
  console.log(`  https://YOUR_VERCEL_URL/api/voice/incoming?clinic_id=${data.id}`);
  console.log('');
  console.log('Next: add google_refresh_token for this clinic via SQL:');
  console.log(`  update clinics set google_refresh_token = 'YOUR_TOKEN' where id = '${data.id}';`);
}

main().catch((e) => {
  console.error('✗ FAILED:', e.message);
  process.exit(1);
});
