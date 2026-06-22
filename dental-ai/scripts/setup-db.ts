import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

async function verifyTables() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  console.log('\nVerifying tables...');
  for (const table of ['clinics', 'calls', 'appointments']) {
    const { error } = await supabase.from(table).select('*').limit(1);
    console.log(`  ${table}:`, error ? `✗ ${error.message}` : '✓ ready');
  }
}

async function runWithPg(sql: string) {
  // Dynamic import — only used if pg is installed
  const { default: pg } = await import('pg');
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) throw new Error('no DATABASE_URL');

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log('✓ Schema applied via direct PostgreSQL connection.');
  } finally {
    await client.end();
  }
}

async function main() {
  const sqlPath = path.join(process.cwd(), 'supabase/schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Try direct DB connection first
  const hasDbUrl = !!(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);
  if (hasDbUrl) {
    try {
      await runWithPg(sql);
      await verifyTables();
      return;
    } catch (e: any) {
      console.warn('Direct connection failed:', e.message);
    }
  }

  // Fallback: print SQL and instructions
  console.log('\n────────────────────────────────────────────────────────');
  console.log('No DATABASE_URL found. Run the schema manually:');
  console.log('  1. Go to https://supabase.com/dashboard/project/zeartjfhwwsqfaflyeco/sql/new');
  console.log('  2. Paste the contents of  supabase/schema.sql');
  console.log('  3. Click "Run"');
  console.log('────────────────────────────────────────────────────────\n');

  console.log('Or add DATABASE_URL to .env.local (from Supabase Dashboard → Settings → Database → Connection string):');
  console.log('  DATABASE_URL=postgresql://postgres:[PASSWORD]@db.zeartjfhwwsqfaflyeco.supabase.co:5432/postgres\n');

  // Still verify what currently exists
  try { await verifyTables(); } catch {}
}

main().catch((e) => {
  console.error('✗ FAILED:', e.message);
  process.exit(1);
});
