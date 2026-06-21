-- Call conversations: one row per phone call
create table if not exists calls (
  call_sid text primary key,
  from_number text,
  conversation jsonb not null default '[]'::jsonb,
  status text not null default 'active',  -- 'active' | 'completed' | 'error'
  ended_reason text,                       -- 'booked' | 'hangup' | 'error' | 'timeout'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calls_created_at_idx on calls (created_at desc);
create index if not exists calls_status_idx on calls (status);

-- Booked appointments
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  call_sid text references calls(call_sid) on delete set null,
  patient_name text not null,
  patient_phone text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  calendar_event_id text,
  status text not null default 'confirmed', -- 'confirmed' | 'cancelled'
  created_at timestamptz not null default now()
);

create index if not exists appointments_start_time_idx on appointments (start_time);
create index if not exists appointments_call_sid_idx on appointments (call_sid);

-- Trigger to keep updated_at fresh on calls
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists calls_set_updated_at on calls;
create trigger calls_set_updated_at
  before update on calls
  for each row execute function set_updated_at();
