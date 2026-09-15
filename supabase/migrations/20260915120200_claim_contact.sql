-- ============================================================
-- Atomic contact claiming
--
-- The read-then-write version of this has a race: two agents pull the same
-- "available" row before either writes back, and both dial the same
-- household. That is a data protection problem as well as an embarrassing
-- one, so claiming happens in one statement with row locking.
-- ============================================================

create or replace function claim_next_contact(target_campaign text)
returns contacts
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed contacts;
begin
  if not in_campaign(target_campaign) then
    raise exception 'not a member of campaign %', target_campaign
      using errcode = '42501';
  end if;

  -- Return the contact this agent is already working, if any. A refresh
  -- mid-call must not skip to a different person.
  select * into claimed
  from contacts
  where campaign_id = target_campaign
    and assigned_to = auth.uid()
    and status in ('assigned', 'in_call')
  limit 1;

  if found then
    return claimed;
  end if;

  -- SKIP LOCKED lets concurrent agents take different rows instead of
  -- queueing behind each other.
  select * into claimed
  from contacts
  where campaign_id = target_campaign
    and (
      status = 'available'
      or (status = 'callback' and callback_at is not null and callback_at <= now())
    )
  order by
    -- Due callbacks first: someone was promised a call at this time.
    case when status = 'callback' then 0 else 1 end,
    attempts asc,
    created_at asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update contacts
  set status = 'assigned',
      assigned_to = auth.uid(),
      assigned_at = now()
  where id = claimed.id
  returning * into claimed;

  return claimed;
end;
$$;

revoke all on function claim_next_contact(text) from public;
grant execute on function claim_next_contact(text) to authenticated;

-- ------------------------------------------------------------
-- Release a contact an agent abandoned without dispositioning.
-- Run on a schedule so a crashed browser does not strand a number.
-- ------------------------------------------------------------

create or replace function release_stale_assignments(older_than interval default '30 minutes')
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  released int;
begin
  update contacts
  set status = 'available', assigned_to = null, assigned_at = null
  where status in ('assigned', 'in_call')
    and assigned_at < now() - older_than;
  get diagnostics released = row_count;
  return released;
end;
$$;

revoke all on function release_stale_assignments(interval) from public;
