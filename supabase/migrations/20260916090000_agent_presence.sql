-- ============================================================
-- Agent presence
--
-- Deliberately a table rather than a Realtime Presence channel. Presence
-- channels are ephemeral: they vanish on reconnect and cannot be queried,
-- so a supervisor loading the wallboard mid-shift would see an empty floor
-- until every agent happened to send something. A row survives a refresh and
-- can be reported on afterwards.
--
-- Staleness is handled by heartbeat rather than by trusting a disconnect
-- event, because a closed laptop lid never sends one.
-- ============================================================

create type agent_status as enum (
  'available', 'talking', 'wrap', 'break', 'offline'
);

create table agent_presence (
  user_id       uuid primary key references auth.users on delete cascade,
  campaign_id   text references campaigns on delete set null,

  status        agent_status not null default 'offline',
  -- What they are working right now. Nullable: an available agent has none.
  contact_id    uuid references contacts on delete set null,
  call_id       uuid references calls on delete set null,
  -- When the current state began, so the wallboard can show a live timer
  -- without the client having to remember anything.
  state_since   timestamptz not null default now(),
  -- Set when the agent confirms they dialled, so "talking" time is the
  -- conversation rather than time spent looking at the record.
  dial_started_at timestamptz,

  last_seen_at  timestamptz not null default now(),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users
);

create trigger agent_presence_touch before update on agent_presence
  for each row execute function touch_updated_at();

create index agent_presence_campaign_idx on agent_presence (campaign_id, status);

alter table agent_presence enable row level security;

-- Supervisors see the floor. Agents see only themselves — one agent watching
-- another's call timer is surveillance, not operations.
create policy agent_presence_read on agent_presence
  for select using (user_id = auth.uid() or is_staff());

create policy agent_presence_write_own on agent_presence
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- Reporting a state is one call. Doing it as an upsert from the client
-- would let an agent write someone else's row if the policy ever loosened.
-- ------------------------------------------------------------

create or replace function report_presence(
  new_status agent_status,
  target_campaign text default null,
  target_contact uuid default null,
  target_call uuid default null,
  dialled_at timestamptz default null
)
returns agent_presence
language plpgsql
security definer
set search_path = public
as $$
declare
  result agent_presence;
  previous agent_status;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select status into previous from agent_presence where user_id = auth.uid();

  insert into agent_presence (
    user_id, campaign_id, status, contact_id, call_id,
    dial_started_at, state_since, last_seen_at, updated_by
  )
  values (
    auth.uid(), target_campaign, new_status, target_contact, target_call,
    dialled_at, now(), now(), auth.uid()
  )
  on conflict (user_id) do update set
    campaign_id = excluded.campaign_id,
    status = excluded.status,
    contact_id = excluded.contact_id,
    call_id = excluded.call_id,
    dial_started_at = excluded.dial_started_at,
    -- Only restart the timer when the state actually changed. A heartbeat
    -- that reset it would make every agent look permanently fresh.
    state_since = case
      when agent_presence.status is distinct from excluded.status
        then now()
      else agent_presence.state_since
    end,
    last_seen_at = now(),
    updated_by = auth.uid()
  returning * into result;

  if previous is distinct from new_status then
    insert into audit_logs (actor_id, action, target, detail)
    values (auth.uid(), 'presence.change', 'agent_presence/' || auth.uid(),
            jsonb_build_object('from', previous, 'to', new_status));
  end if;

  return result;
end;
$$;

revoke all on function report_presence(agent_status, text, uuid, uuid, timestamptz) from public;
grant execute on function report_presence(agent_status, text, uuid, uuid, timestamptz) to authenticated;

-- ------------------------------------------------------------
-- Mark agents offline when their heartbeat stops. A closed laptop never
-- sends a disconnect, so without this the wallboard shows a floor that
-- went home an hour ago.
-- ------------------------------------------------------------

create or replace function expire_stale_presence(older_than interval default '90 seconds')
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  expired int;
begin
  update agent_presence
  set status = 'offline', contact_id = null, call_id = null
  where status <> 'offline' and last_seen_at < now() - older_than;
  get diagnostics expired = row_count;
  return expired;
end;
$$;

revoke all on function expire_stale_presence(interval) from public;
grant execute on function expire_stale_presence(interval) to authenticated;

-- ------------------------------------------------------------
-- Realtime. Only these tables are published: the wallboard needs to know
-- that something changed, and refetches aggregates itself.
-- ------------------------------------------------------------

alter publication supabase_realtime add table agent_presence;
alter publication supabase_realtime add table calls;
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table contacts;
