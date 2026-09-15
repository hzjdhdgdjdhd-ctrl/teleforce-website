-- Teams. Separate migration because a new enum value cannot be used in the
-- same transaction that adds it.

create table teams (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null references campaigns on delete cascade,
  name        text not null,
  leader_id   uuid references auth.users on delete set null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users,
  updated_by  uuid references auth.users
);

create trigger teams_touch before update on teams
  for each row execute function touch_updated_at();

create table team_members (
  team_id   uuid not null references teams on delete cascade,
  user_id   uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index team_members_user_idx on team_members (user_id);

-- Is the caller the leader of a team that this user belongs to?
create or replace function leads_user(target_user uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from teams t
    join team_members m on m.team_id = t.id
    where t.leader_id = auth.uid()
      and t.active
      and m.user_id = target_user
  )
$$;

create or replace function is_team_leader()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(current_role_name() = 'team_leader', false) $$;

-- Staff now includes team leaders for read purposes, but the write policies
-- below stay narrower: seeing the floor is not the same as changing it.
create or replace function can_review()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce(
    current_role_name() in ('admin','supervisor','qa','team_leader'), false)
$$;

alter table teams enable row level security;
alter table team_members enable row level security;

create policy teams_read on teams
  for select using (
    is_staff() or leader_id = auth.uid()
    or exists (select 1 from team_members m
               where m.team_id = id and m.user_id = auth.uid())
  );

create policy teams_admin_write on teams
  for all using (is_admin()) with check (is_admin());

create policy team_members_read on team_members
  for select using (
    is_staff() or user_id = auth.uid()
    or exists (select 1 from teams t where t.id = team_id and t.leader_id = auth.uid())
  );

create policy team_members_admin_write on team_members
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- Extend the existing policies rather than replacing them, so nothing that
-- worked before changes behaviour.
-- ------------------------------------------------------------

create policy calls_team_leader_read on calls
  for select using (is_team_leader() and leads_user(agent_id));

create policy leads_team_leader_read on leads
  for select using (is_team_leader() and leads_user(agent_id));

-- Reassigning a lead within their own team is the point of the role.
create policy leads_team_leader_update on leads
  for update using (is_team_leader() and leads_user(agent_id))
  with check (is_team_leader());

create policy contacts_team_leader_read on contacts
  for select using (
    is_team_leader()
    and (assigned_to is null or leads_user(assigned_to))
  );

create policy agent_presence_team_leader_read on agent_presence
  for select using (is_team_leader() and leads_user(user_id));

create policy qa_reviews_team_leader on qa_reviews
  for select using (
    is_team_leader()
    and exists (select 1 from calls c where c.id = call_id and leads_user(c.agent_id))
  );

-- ------------------------------------------------------------
-- The wallboard functions gate on is_staff(). Team leaders need the board
-- too, but scoped to their own team — so they get their own entry point
-- rather than a loosened version of the supervisor one.
-- ------------------------------------------------------------

create or replace function wallboard_agents(target_campaign text default 'hhcro')
returns table (
  user_id uuid, display_name text, email text, role user_role,
  status agent_status, state_since timestamptz, dial_started_at timestamptz,
  campaign_id text, customer_name text, customer_phone text, call_id uuid,
  checkpoints_reached int, calls_today bigint, leads_today bigint
)
language plpgsql security definer set search_path = public
as $$
declare
  day_start timestamptz := date_trunc('day', now() at time zone 'Europe/London')
                             at time zone 'Europe/London';
begin
  if not (in_campaign(target_campaign)
          and (is_staff() or is_team_leader())) then
    raise exception 'supervisor access required' using errcode = '42501';
  end if;

  return query
  select
    p.user_id, pr.display_name, pr.email, pr.role, p.status, p.state_since,
    p.dial_started_at, p.campaign_id,
    nullif(trim(coalesce(c.first_name, '') || ' ' || coalesce(c.last_name, '')), ''),
    c.phone, p.call_id,
    coalesce(array_length(cl.checkpoints_reached, 1), 0),
    (select count(*) from calls x where x.agent_id = p.user_id and x.started_at >= day_start),
    (select count(*) from leads y where y.agent_id = p.user_id and y.created_at >= day_start)
  from agent_presence p
  join profiles pr on pr.id = p.user_id
  left join contacts c on c.id = p.contact_id
  left join calls cl on cl.id = p.call_id
  where pr.active
    -- A team leader sees their own team and nobody else's.
    and (is_staff() or leads_user(p.user_id))
  order by
    case p.status
      when 'talking' then 0 when 'wrap' then 1 when 'available' then 2
      when 'break' then 3 else 4
    end,
    pr.display_name;
end;
$$;

create or replace function wallboard_metrics(target_campaign text default 'hhcro')
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  day_start timestamptz;
  result jsonb;
begin
  if not (in_campaign(target_campaign)
          and (is_staff() or is_team_leader())) then
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
        'offline', count(*) filter (where status = 'offline'))
      from agent_presence
      where (campaign_id is not distinct from target_campaign or campaign_id is null)
        and (is_staff() or leads_user(user_id))),
    'calls', (
      select jsonb_build_object(
        'today', count(*),
        'completed', count(*) filter (where ended_at is not null),
        'averageHandleSeconds', coalesce(round(avg(duration_seconds) filter (
          where duration_seconds is not null
            and disposition not in ('no_answer','engaged','wrong_number')))::int, 0))
      from calls
      where campaign_id = target_campaign and started_at >= day_start
        and (is_staff() or leads_user(agent_id))),
    'leads', (
      select jsonb_build_object(
        'qualified', count(*),
        'billable', count(*) filter (where billable),
        'appointments', count(*) filter (where appointment_at is not null),
        'averageCompliance', coalesce(round(avg(compliance_score))::int, 0))
      from leads
      where campaign_id = target_campaign and created_at >= day_start
        and (is_staff() or leads_user(agent_id))),
    'queue', (
      select jsonb_build_object(
        'waiting', count(*) filter (where status = 'available'),
        'claimed', count(*) filter (where status = 'assigned'),
        'inCall', count(*) filter (where status = 'in_call'),
        'completed', count(*) filter (where status = 'completed'),
        'callback', count(*) filter (where status = 'callback'),
        'dnc', count(*) filter (where status = 'dnc'),
        'invalid', count(*) filter (where status = 'invalid'),
        'total', count(*))
      from contacts where campaign_id = target_campaign)
  ) into result;

  result := jsonb_set(result, '{conversionRate}', to_jsonb(coalesce(round(
    (result -> 'leads' ->> 'qualified')::numeric
    / nullif((select count(*) from calls
              where campaign_id = target_campaign and started_at >= day_start
                and disposition is not null
                and disposition not in ('no_answer','engaged','wrong_number')
                and (is_staff() or leads_user(agent_id))), 0) * 100, 1), 0)));

  return result;
end;
$$;

revoke all on function wallboard_metrics(text) from public;
revoke all on function wallboard_agents(text) from public;
grant execute on function wallboard_metrics(text) to authenticated;
grant execute on function wallboard_agents(text) to authenticated;
