-- ============================================================
-- Editable call scripts
--
-- The qualification flow was compiled into the agent bundle. That makes a
-- wording change a deployment, which in practice means it does not happen —
-- so the script drifts from what agents actually say.
--
-- Scripts live here instead: drafted, validated, then published. Agents load
-- the published version; a draft is never served to a live call.
-- ============================================================

create table scripts (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null references campaigns on delete cascade,

  name        text not null,
  -- Bumped on every publish so a call can be replayed against the exact
  -- wording the agent saw, even after later edits.
  version     int not null default 1,
  entry       text not null,
  -- The node graph. Shape is validated by validateScript() in @teleforce/core
  -- before publish; storing it as one document keeps a version atomic.
  nodes       jsonb not null default '{}'::jsonb,

  published   boolean not null default false,
  published_at timestamptz,
  published_by uuid references auth.users,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users,
  updated_by  uuid references auth.users
);

create trigger scripts_touch before update on scripts
  for each row execute function touch_updated_at();

create index scripts_campaign_idx on scripts (campaign_id, version desc);

-- Exactly one published script per campaign. Two live versions would mean
-- agents on the same campaign qualifying against different rules.
create unique index scripts_one_published on scripts (campaign_id)
  where published;

alter table scripts enable row level security;

-- Agents read the published script only. A draft must never reach a call.
create policy scripts_read_published on scripts
  for select using (in_campaign(campaign_id) and (published or is_staff()));

create policy scripts_staff_write on scripts
  for all using (is_staff() and in_campaign(campaign_id))
  with check (is_staff() and in_campaign(campaign_id));

-- ------------------------------------------------------------
-- Publishing swaps atomically: the previous version is unpublished and the
-- new one promoted in one statement, so there is no instant where a campaign
-- has no script.
-- ------------------------------------------------------------

create or replace function publish_script(script_id uuid)
returns scripts
language plpgsql
security definer
set search_path = public
as $$
declare
  target scripts;
begin
  select * into target from scripts where id = script_id;
  if not found then
    raise exception 'script % does not exist', script_id;
  end if;

  if not (is_staff() and in_campaign(target.campaign_id)) then
    raise exception 'not permitted to publish for campaign %', target.campaign_id
      using errcode = '42501';
  end if;

  if target.nodes = '{}'::jsonb then
    raise exception 'refusing to publish an empty script';
  end if;

  update scripts set published = false
  where campaign_id = target.campaign_id and published and id <> script_id;

  update scripts
  set published = true,
      published_at = now(),
      published_by = auth.uid(),
      version = version + 1
  where id = script_id
  returning * into target;

  insert into audit_logs (actor_id, action, target, detail)
  values (auth.uid(), 'script.publish', 'scripts/' || script_id,
          jsonb_build_object('campaign', target.campaign_id, 'version', target.version));

  return target;
end;
$$;

revoke all on function publish_script(uuid) from public;
grant execute on function publish_script(uuid) to authenticated;
