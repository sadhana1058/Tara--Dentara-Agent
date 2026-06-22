import { config } from 'dotenv';
config({ path: '.env.local' });

const PROJECT_REF   = 'zeartjfhwwsqfaflyeco';
const ACCESS_TOKEN  = process.env.SUPABASE_ACCESS_TOKEN;

const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: 'create_patients_table',
    sql: `
      create table if not exists patients (
        id         uuid primary key default gen_random_uuid(),
        clinic_id  uuid references clinics(id) on delete cascade not null,
        name       text not null,
        phone      text not null,
        email      text,
        notes      text,
        created_at timestamptz not null default now(),
        unique(clinic_id, phone)
      );
      create index if not exists patients_clinic_id_idx on patients (clinic_id);
      create index if not exists patients_phone_idx     on patients (clinic_id, phone);
    `,
  },
];

async function runQuery(sql: string) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data?.message ?? JSON.stringify(data));
  return data;
}

async function main() {
  if (!ACCESS_TOKEN) {
    console.error('\n✗  SUPABASE_ACCESS_TOKEN is not set in .env.local\n');
    console.error('   Get yours at: https://supabase.com/dashboard/account/tokens');
    console.error('   Then add to .env.local:');
    console.error('   SUPABASE_ACCESS_TOKEN=sbp_xxxx...\n');
    process.exit(1);
  }

  console.log(`\nRunning ${MIGRATIONS.length} migration(s) on project ${PROJECT_REF}...\n`);

  for (const m of MIGRATIONS) {
    process.stdout.write(`  → ${m.name} ... `);
    try {
      await runQuery(m.sql);
      console.log('✓ done');
    } catch (e: any) {
      console.log('✗ FAILED');
      console.error(`    ${e.message}`);
      process.exit(1);
    }
  }

  console.log('\n✓  All migrations applied.\n');
}

main();
