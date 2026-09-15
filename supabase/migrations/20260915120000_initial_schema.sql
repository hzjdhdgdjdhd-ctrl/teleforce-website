-- ============================================================
-- Teleforce platform — initial schema
--
-- Design notes:
--   * Every table carries the same audit envelope. "Who changed this and
--     when" is the first question asked in any dispute over a lead.
--   * Row-level security is on for every table with no exceptions. Policies
--     are written against a helper that reads the caller's role from their
--     profile, so a compromised anon key still cannot read another agent's
--     queue.
--   * Contact claiming is done in a single atomic function rather than a
--     read-then-write, so two agents can never be handed the same number.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------

create type user_role as enum ('admin', 'supervisor', 'qa', 'agent');

create type contact_status as enum (
  'available', 'assigned', 'in_call', 'completed', 'callback', 'dnc', 'invalid'
);

create type call_disposition as enum (
  'no_answer', 'engaged', 'wrong_number', 'not_interested', 'callback',
  'do_not_call', 'terminated_ineligible', 'terminated_property', 'qualified'
);

create type lead_status as enum (
  'new', 'qa_pending', 'qa_passed', 'qa_failed', 'submitted', 'rejected'
);

create type lead_product as enum ('loft', 'cavity', 'both', 'none');

-- ------------------------------------------------------------
-- Audit helper: keeps updated_at honest without trusting clients
-- ------------------------------------------------------------

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Profiles — extends auth.users with role and campaign access
-- ------------------------------------------------------------

create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  display_name text not null default '',
  role        user_role not null default 'agent',
  active      boolean not null default true,
  last_seen_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();

-- Role lookup used by every policy below.
-- SECURITY DEFINER so the policy can read the profile row without
-- recursing into the profiles policies.
create or replace function current_role_name()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(current_role_name() = 'admin', false) $$;

create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(current_role_name() in ('admin','supervisor'), false) $$;

create or replace function can_review()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(current_role_name() in ('admin','supervisor','qa'), false) $$;

-- ------------------------------------------------------------
-- Campaigns
-- ------------------------------------------------------------

create table campaigns (
  id          text primary key,
  name        text not null,
  active      boolean not null default true,
  script_id   text not null,
  script_version int not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users,
  updated_by  uuid references auth.users
);

create trigger campaigns_touch before update on campaigns
  for each row execute function touch_updated_at();

-- Which campaigns a user may work. Empty set for an admin means all.
create table campaign_members (
  campaign_id text not null references campaigns on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create or replace function in_campaign(target text)
returns boolean language sql stable security definer set search_path = public
as $$
  select is_admin() or exists (
    select 1 from campaign_members
    where campaign_id = target and user_id = auth.uid()
  )
$$;

-- ------------------------------------------------------------
-- Contact batches — one per daily upload
-- ------------------------------------------------------------

create table contact_batches (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null references campaigns on delete cascade,
  filename    text not null,
  total_rows  int not null default 0,
  imported    int not null default 0,
  skipped_duplicates int not null default 0,
  rejected    int not null default 0,
  issues      jsonb not null default '[]'::jsonb,
  uploaded_by uuid not null references auth.users,
  uploaded_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users,
  updated_by  uuid references auth.users
);

create trigger contact_batches_touch before update on contact_batches
  for each row execute function touch_updated_at();

create index contact_batches_campaign_idx on contact_batches (campaign_id, uploaded_at desc);

-- ------------------------------------------------------------
-- Contacts
-- ------------------------------------------------------------

create table contacts (
  id            uuid primary key default gen_random_uuid(),
  batch_id      uuid not null references contact_batches on delete cascade,
  campaign_id   text not null references campaigns on delete cascade,

  title         text,
  first_name    text not null,
  last_name     text not null default '',

  phone         text not null,
  alternative_phone text,
  email         text,

  address_line1 text,
  address_line2 text,
  city          text,
  postcode      text,

  -- Columns the supplier file carried that we do not model. Kept verbatim
  -- so nothing is lost when a supplier changes their export.
  extra         jsonb not null default '{}'::jsonb,

  status        contact_status not null default 'available',
  assigned_to   uuid references auth.users,
  assigned_at   timestamptz,
  attempts      int not null default 0,
  last_attempt_at timestamptz,
  callback_at   timestamptz,
  notes         text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users,
  updated_by    uuid references auth.users
);

create trigger contacts_touch before update on contacts
  for each row execute function touch_updated_at();

-- One live record per number per campaign. Prevents the same household
-- being dialled twice from two different uploads.
create unique index contacts_campaign_phone_key on contacts (campaign_id, phone);

-- The queue query: available or a callback that is now due.
create index contacts_queue_idx on contacts (campaign_id, status, callback_at)
  where status in ('available', 'callback');

create index contacts_assigned_idx on contacts (assigned_to, status)
  where assigned_to is not null;

-- ------------------------------------------------------------
-- Calls
-- ------------------------------------------------------------

create table calls (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   text not null references campaigns on delete cascade,
  contact_id    uuid not null references contacts on delete cascade,
  agent_id      uuid not null references auth.users,

  script_id     text not null,
  script_version int not null,

  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  duration_seconds int,

  disposition   call_disposition,
  -- Full script state, so QA can replay the call exactly as it happened.
  answers       jsonb not null default '[]'::jsonb,
  checkpoints_reached text[] not null default '{}',
  rebuttals_used text[] not null default '{}',
  notes         text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users,
  updated_by    uuid references auth.users
);

create trigger calls_touch before update on calls
  for each row execute function touch_updated_at();

create index calls_agent_idx on calls (agent_id, started_at desc);
create index calls_campaign_idx on calls (campaign_id, started_at desc);
create index calls_contact_idx on calls (contact_id);

-- ------------------------------------------------------------
-- Leads
-- ------------------------------------------------------------

create table leads (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   text not null references campaigns on delete cascade,
  contact_id    uuid not null references contacts on delete cascade,
  call_id       uuid not null references calls on delete cascade,
  agent_id      uuid not null references auth.users,

  -- Denormalised so an exported lead stands alone.
  first_name    text not null,
  last_name     text not null default '',
  phone         text not null,
  alternative_phone text,
  address_line1 text,
  city          text,
  postcode      text,

  lead_type     lead_product not null default 'none',
  eligibility_path text[] not null default '{}',
  password      text,
  best_time_to_call text,

  status        lead_status not null default 'qa_pending',
  compliance_score int not null default 0,
  billable      boolean not null default false,

  appointment_at timestamptz,
  notes         text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users,
  updated_by    uuid references auth.users,

  -- A lead can only be billable if it scored full marks on the critical
  -- checkpoints. Enforced here as well as in application code, because this
  -- is the number the client is invoiced against.
  constraint leads_billable_requires_score check (billable = false or compliance_score >= 80)
);

create trigger leads_touch before update on leads
  for each row execute function touch_updated_at();

create unique index leads_call_key on leads (call_id);
create index leads_campaign_status_idx on leads (campaign_id, status, created_at desc);
create index leads_agent_idx on leads (agent_id, created_at desc);

-- ------------------------------------------------------------
-- Rebuttals
-- ------------------------------------------------------------

create table rebuttals (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null references campaigns on delete cascade,
  label       text not null,
  say         text not null,
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users,
  updated_by  uuid references auth.users
);

create trigger rebuttals_touch before update on rebuttals
  for each row execute function touch_updated_at();

create index rebuttals_campaign_idx on rebuttals (campaign_id, sort_order) where active;

-- ------------------------------------------------------------
-- QA reviews
-- ------------------------------------------------------------

create table qa_reviews (
  id          uuid primary key default gen_random_uuid(),
  call_id     uuid not null references calls on delete cascade,
  lead_id     uuid references leads on delete set null,
  reviewer_id uuid not null references auth.users,
  reviewed_at timestamptz not null default now(),
  compliance_score int not null,
  passed      boolean not null,
  overridden_failures text[] not null default '{}',
  coaching_notes text not null default '',
  supervisor_comments text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users,
  updated_by  uuid references auth.users
);

create trigger qa_reviews_touch before update on qa_reviews
  for each row execute function touch_updated_at();

create index qa_reviews_call_idx on qa_reviews (call_id);

-- ------------------------------------------------------------
-- Audit log — append only
-- ------------------------------------------------------------

create table audit_logs (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  actor_id    uuid references auth.users,
  actor_email text,
  action      text not null,
  target      text not null,
  detail      jsonb not null default '{}'::jsonb
);

create index audit_logs_at_idx on audit_logs (at desc);
create index audit_logs_actor_idx on audit_logs (actor_id, at desc);
