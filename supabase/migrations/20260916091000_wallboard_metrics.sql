-- ============================================================
-- Wallboard aggregates
--
-- Computed in one round trip rather than assembled client-side, so every
-- screen in the room shows the same numbers. A supervisor and a team leader
-- disagreeing about the conversion rate because their browsers counted
-- differently is worse than either number being slightly stale.
--
-- "Today" is the operating day in UK local time, not UTC. A shift that runs
-- past midnight UTC is still the same working day to the floor.
-- ============================================================

create or replace function wallboard_metrics(target_campaign text default 'hhcro')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  day_start timestamptz;
  result jsonb;
begin
  if not (is_staff() and in_campaign(target_campaign)) then
    raise exception 'supervisor access required' using errcode = '42501';
  end if;

  day_start := date_trunc('day', now() at time zone 'Europe/London')
                 at time zone 'Europe/London';

  select jsonb_build_object(
    'generatedAt', now(),
    'dayStart', day_start,

    'agents', (
      select jsonb_build_object(
        'online', count(*) filter (where status <> 'offline'),
        'available', count(*) filter (where status = 'available'),
        'talking', count(*) filter (where status = 'talking'),
        'wrap', count(*) filter (where status = 'wrap'),
        'onBreak', count(*) filter (where status = 'break'),
        'offline', count(*) filter (where status = 'offline')
      )
      from agent_presence
      where campaign_id is not distinct from target_campaign
         or campaign_id is null
    ),

    'calls', (
      select jsonb_build_object(
        'today', count(*),
        'completed', count(*) filter (where ended_at is not null),
        -- Average handle time over calls that actually connected. Including
        -- no-answers would drag it toward zero and hide a real problem.
        'averageHandleSeconds', coalesce(
          round(avg(duration_seconds) filter (
            where duration_seconds is not null
              and disposition not in ('no_answer', 'engaged', 'wrong_number')
          ))::int, 0)
      )
      from calls
      where campaign_id = target_campaign and started_at >= day_start
    ),

    'leads', (
      select jsonb_build_object(
        'qualified', count(*),
        'billable', count(*) filter (where billable),
        'appointments', count(*) filter (where appointment_at is not null),
        'averageCompliance', coalesce(round(avg(compliance_score))::int, 0)
      )
      from leads
      where campaign_id = target_campaign and created_at >= day_start
    ),

    'queue', (
      select jsonb_build_object(
        'waiting', count(*) filter (where status = 'available'),
        'claimed', count(*) filter (where status = 'assigned'),
        'inCall', count(*) filter (where status = 'in_call'),
        'completed', count(*) filter (where status = 'completed'),
        'callback', count(*) filter (where status = 'callback'),
        'dnc', count(*) filter (where status = 'dnc'),
        'invalid', count(*) filter (where status = 'invalid'),
        'total', count(*)
      )
      from contacts
      where campaign_id = target_campaign
    )
  ) into result;

  -- Conversion is qualified leads over calls that reached a human. Dividing
  -- by every dial would flatter the floor by counting unanswered numbers.
  result := jsonb_set(
    result,
    '{conversionRate}',
    to_jsonb(
      coalesce(
        round(
          (result -> 'leads' ->> 'qualified')::numeric
          / nullif((
              select count(*) from calls
              where campaign_id = target_campaign
                and started_at >= day_start
                and disposition is not null
                and disposition not in ('no_answer', 'engaged', 'wrong_number')
            ), 0) * 100,
          1
        ),
        0
      )
    )
  );

  return result;
end;
$$;

revoke all on function wallboard_metrics(text) from public;
grant execute on function wallboard_metrics(text) to authenticated;

-- ------------------------------------------------------------
-- The agent table. One query joining presence to the customer being worked,
-- so the wallboard does not fan out a request per agent.
-- ------------------------------------------------------------

create or replace function wallboard_agents(target_campaign text default 'hhcro')
returns table (
  user_id uuid,
  display_name text,
  email text,
  role user_role,
  status agent_status,
  state_since timestamptz,
  dial_started_at timestamptz,
  campaign_id text,
  customer_name text,
  customer_phone text,
  call_id uuid,
  checkpoints_reached int,
  calls_today bigint,
  leads_today bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (is_staff() and in_campaign(target_campaign)) then
    raise exception 'supervisor access required' using errcode = '42501';
  end if;

  return query
  select
    p.user_id,
    pr.display_name,
    pr.email,
    pr.role,
    p.status,
    p.state_since,
    p.dial_started_at,
    p.campaign_id,
    nullif(trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')), ''),
    c.phone,
    p.call_id,
    coalesce(array_length(cl.checkpoints_reached, 1), 0),
    (select count(*) from calls x
      where x.agent_id = p.user_id
        and x.started_at >= date_trunc('day', now() at time zone 'Europe/London')
                              at time zone 'Europe/London'),
    (select count(*) from leads y
      where y.agent_id = p.user_id
        and y.created_at >= date_trunc('day', now() at time zone 'Europe/London')
                              at time zone 'Europe/London')
  from agent_presence p
  join profiles pr on pr.id = p.user_id
  left join contacts c on c.id = p.contact_id
  left join calls cl on cl.id = p.call_id
  where pr.active
  order by
    -- Busy agents first: a supervisor scanning the board cares about who is
    -- mid-call, not who logged off this morning.
    case p.status
      when 'talking' then 0
      when 'wrap' then 1
      when 'available' then 2
      when 'break' then 3
      else 4
    end,
    pr.display_name;
end;
$$;

revoke all on function wallboard_agents(text) from public;
grant execute on function wallboard_agents(text) to authenticated;
