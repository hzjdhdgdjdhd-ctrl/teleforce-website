-- ============================================================
-- Claim a specific contact by phone number
--
-- Agents cannot enumerate contacts — that is deliberate, and it is what
-- stops a leaver walking out with the list. But a customer who rings back,
-- or a callback due now, has to be findable.
--
-- So lookup is a function rather than a query: it matches one number, claims
-- it for the caller, and returns nothing at all on a miss. An agent can
-- confirm a number they already have; they cannot browse.
-- ============================================================

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

  -- Accept whatever the agent pasted: spaces, brackets, +44, a missing
  -- leading zero. Compare on digits alone.
  normalised := regexp_replace(coalesce(target_phone, ''), '[^0-9]', '', 'g');

  if length(normalised) < 9 then
    return null;
  end if;

  -- Match on the last 9 digits, which is the part that identifies a UK
  -- subscriber regardless of how the prefix was written.
  normalised := right(normalised, 9);

  select * into claimed
  from contacts
  where campaign_id = target_campaign
    and right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) = normalised
    and status <> 'dnc'
  order by
    -- Prefer one already assigned to this agent, then anything workable.
    case when assigned_to = auth.uid() then 0 else 1 end,
    created_at asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  -- Never hand over a contact another agent is mid-call with.
  if claimed.assigned_to is not null
     and claimed.assigned_to <> auth.uid()
     and claimed.status = 'in_call' then
    raise exception 'that number is currently being worked by another agent'
      using errcode = '55006';
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

revoke all on function claim_contact_by_phone(text, text) from public;
grant execute on function claim_contact_by_phone(text, text) to authenticated;
