-- ============================================================
-- Website enquiries
--
-- The public site previously printed a personal Gmail address as its only
-- contact route. Replacing it with a mailbox is blocked on mail routing, so
-- enquiries are captured here instead: no address is exposed, nothing
-- bounces, and every enquiry is retained with a timestamp.
--
-- This table is the one place in the schema an anonymous caller may write.
-- It is therefore also the one place that needs abuse controls.
-- ============================================================

create type enquiry_status as enum ('new', 'read', 'responded', 'spam');

create table enquiries (
  id            uuid primary key default gen_random_uuid(),

  name          text not null,
  email         text not null,
  organisation  text not null,
  role          text,
  interest      text,
  volume        text,
  message       text not null,

  status        enquiry_status not null default 'new',
  -- Free-text note from whoever handled it.
  handled_note  text,
  handled_by    uuid references auth.users,
  handled_at    timestamptz,

  -- Kept for abuse investigation only, never displayed.
  user_agent    text,
  source_page   text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users,

  -- Cheap structural validation. Anything failing these is a bot or a
  -- mistake, and either way is not worth storing.
  constraint enquiries_email_shape check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  constraint enquiries_name_length check (char_length(name) between 1 and 200),
  constraint enquiries_org_length check (char_length(organisation) between 1 and 200),
  constraint enquiries_message_length check (char_length(message) between 20 and 5000)
);

create trigger enquiries_touch before update on enquiries
  for each row execute function touch_updated_at();

create index enquiries_status_idx on enquiries (status, created_at desc);

alter table enquiries enable row level security;

-- Anonymous visitors may submit and nothing else. No select policy exists
-- for anon, so a submitted enquiry cannot be read back — an enquiry form
-- that lets you enumerate other people's enquiries is a data breach.
create policy enquiries_public_insert on enquiries
  for insert to anon, authenticated
  with check (true);

create policy enquiries_staff_read on enquiries
  for select using (is_staff());

create policy enquiries_staff_update on enquiries
  for update using (is_staff()) with check (is_staff());
