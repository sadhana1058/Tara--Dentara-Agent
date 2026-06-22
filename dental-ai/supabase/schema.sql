-- ── Clinics ────────────────────────────────────────────────────────────────
create table if not exists clinics (
  id                   uuid primary key default gen_random_uuid(),
  clinic_name          text not null,
  doctor_name          text not null,
  google_calendar_id   text not null,        -- doctor's Gmail / calendar ID
  google_refresh_token text,                  -- per-clinic OAuth refresh token
  username             text not null unique,
  password_hash        text not null,
  created_at           timestamptz not null default now()
);

-- ── Calls ──────────────────────────────────────────────────────────────────
create table if not exists calls (
  call_sid     text primary key,
  clinic_id    uuid references clinics(id) on delete set null,
  from_number  text,
  conversation jsonb not null default '[]'::jsonb,
  status       text not null default 'active',   -- 'active' | 'completed' | 'error'
  ended_reason text,                              -- 'booked' | 'hangup' | 'error' | 'timeout'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists calls_created_at_idx on calls (created_at desc);
create index if not exists calls_status_idx     on calls (status);
create index if not exists calls_clinic_id_idx  on calls (clinic_id);

-- ── Appointments ───────────────────────────────────────────────────────────
create table if not exists appointments (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid references clinics(id) on delete set null,
  call_sid          text references calls(call_sid) on delete set null,
  patient_name      text not null,
  patient_phone     text not null,
  start_time        timestamptz not null,
  end_time          timestamptz not null,
  calendar_event_id text,
  status            text not null default 'confirmed',  -- 'confirmed' | 'cancelled'
  created_at        timestamptz not null default now()
);

create index if not exists appointments_start_time_idx  on appointments (start_time);
create index if not exists appointments_call_sid_idx    on appointments (call_sid);
create index if not exists appointments_clinic_id_idx   on appointments (clinic_id);

-- ── updated_at trigger ─────────────────────────────────────────────────────
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

-- ── Migration: add clinic_id to existing tables if missing ─────────────────
alter table calls        add column if not exists clinic_id uuid references clinics(id) on delete set null;
alter table appointments add column if not exists clinic_id uuid references clinics(id) on delete set null;

-- ── Patients ───────────────────────────────────────────────────────────────
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
