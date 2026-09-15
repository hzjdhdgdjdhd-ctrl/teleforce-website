-- ============================================================
-- Claim and mark in-call in one statement
--
-- The app claimed a contact through the SECURITY DEFINER function, then did
-- a second UPDATE from the browser to set status = 'in_call'. That second
-- write goes through RLS as the agent and was failing the WITH CHECK, so a
-- contact could be claimed and then immediately error out — leaving the row
-- assigned with the agent staring at a permission message.
--
-- Claiming and marking in-call are one action, so they belong in one
-- statement. The browser no longer writes to contacts at claim time at all.
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

  select * into claimed
  from contacts
  where campaign_id = target_campaign
    and (
      status = 'available'
      or (status = 'callback' and callback_at is not null and callback_at <= now())
    )
  order by
    case when status = 'callback' then 0 else 1 end,
    attempts asc,
    created_at asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update contacts
  set status = 'in_call',
      assigned_to = auth.uid(),
      assigned_at = now()
  where id = claimed.id
  returning * into claimed;

  return claimed;
end;
$$;

-- Same for the lookup path.
create or replace function claim_contact_by_phone(
  target_campaign text,
  target_phone text
)
returns contacts
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed contacts;
  normalised text;
begin
  if not in_campaign(target_campaign) then
    raise exception 'not a member of campaign %', target_campaign
      using errcode = '42501';
  end if;

  normalised := regexp_replace(coalesce(target_phone, ''), '[^0-9]', '', 'g');
  if length(normalised) < 9 then
    return null;
  end if;
  normalised := right(normalised, 9);

  select * into claimed
  from contacts
  where campaign_id = target_campaign
    and right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) = normalised
    and status <> 'dnc'
  order by
    case when assigned_to = auth.uid() then 0 else 1 end,
    created_at asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  if claimed.assigned_to is not null
     and claimed.assigned_to <> auth.uid()
     and claimed.status = 'in_call' then
    raise exception 'that number is currently being worked by another agent'
      using errcode = '55006';
  end if;

  update contacts
  set status = 'in_call',
      assigned_to = auth.uid(),
      assigned_at = now()
  where id = claimed.id
  returning * into claimed;

  return claimed;
end;
$$;

-- ------------------------------------------------------------
-- Dispositioning is also an update the browser should not have to get past
-- RLS by itself. One function, one audit point, and the agent can only ever
-- close a contact that is actually theirs.
-- ------------------------------------------------------------

create or replace function close_contact(
  target_contact uuid,
  new_status contact_status,
  new_notes text default null,
  new_callback_at timestamptz default null
)
returns contacts
language plpgsql
security definer
set search_path = public
as $$
declare
  updated contacts;
begin
  select * into updated from contacts where id = target_contact;
  if not found then
    raise exception 'contact % does not exist', target_contact;
  end if;

  if updated.assigned_to is distinct from auth.uid() and not is_staff() then
    raise exception 'that contact is not assigned to you'
      using errcode = '42501';
  end if;

  update contacts
  set status = new_status,
      attempts = attempts + 1,
      last_attempt_at = now(),
      callback_at = coalesce(new_callback_at, callback_at),
      notes = coalesce(nullif(new_notes, ''), notes),
      assigned_to = null,
      assigned_at = null
  where id = target_contact
  returning * into updated;

  return updated;
end;
$$;

revoke all on function close_contact(uuid, contact_status, text, timestamptz) from public;
grant execute on function close_contact(uuid, contact_status, text, timestamptz) to authenticated;
