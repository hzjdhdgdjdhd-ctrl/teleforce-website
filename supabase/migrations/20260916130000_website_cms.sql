-- ============================================================
-- Website content
--
-- Content is versioned rather than edited in place. A marketing change that
-- reads badly needs to be undone in seconds, and "restore the previous
-- version" is only possible if the previous version still exists.
--
-- One row per version, one published version per section. The live site
-- reads published rows only, so a half-finished draft can never appear.
-- ============================================================

create table site_content (
  id          uuid primary key default gen_random_uuid(),
  -- 'hero', 'services', 'about', 'contact', 'footer', 'seo'
  section     text not null,
  version     int not null default 1,
  -- Shape varies by section; validated by the editor, not by the database.
  -- A rigid column per field would make adding a bullet point a migration.
  content     jsonb not null default '{}'::jsonb,

  published   boolean not null default false,
  published_at timestamptz,
  published_by uuid references auth.users,

  note        text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users,
  updated_by  uuid references auth.users
);

create trigger site_content_touch before update on site_content
  for each row execute function touch_updated_at();

create index site_content_section_idx on site_content (section, version desc);

-- One live version per section. Two would mean the page rendering
-- differently depending on which row a query happened to return first.
create unique index site_content_one_published on site_content (section)
  where published;

alter table site_content enable row level security;

-- The public website reads published content anonymously. That is the whole
-- point of a CMS, and published content is by definition public.
create policy site_content_public_read on site_content
  for select using (published);

create policy site_content_staff_read on site_content
  for select using (is_staff());

-- Editing the website is an admin power. A team leader running a floor has
-- no business changing what the company says publicly.
create policy site_content_admin_write on site_content
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- Publishing swaps atomically and bumps the version, so a rollback has a
-- distinct version to return to rather than overwriting history.
-- ------------------------------------------------------------

create or replace function publish_site_content(content_id uuid)
returns site_content
language plpgsql
security definer
set search_path = public
as $$
declare
  target site_content;
begin
  if not is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  select * into target from site_content where id = content_id;
  if not found then
    raise exception 'content % does not exist', content_id;
  end if;

  update site_content set published = false
  where section = target.section and published and id <> content_id;

  update site_content
  set published = true, published_at = now(), published_by = auth.uid()
  where id = content_id
  returning * into target;

  insert into audit_logs (actor_id, action, target, detail)
  values (auth.uid(), 'site.publish', 'site_content/' || content_id,
          jsonb_build_object('section', target.section, 'version', target.version));

  return target;
end;
$$;

-- Rolling back publishes an older version as a new one rather than mutating
-- it, so the history stays append-only and the rollback itself is audited.
create or replace function rollback_site_content(content_id uuid)
returns site_content
language plpgsql
security definer
set search_path = public
as $$
declare
  source site_content;
  copy_id uuid;
  next_version int;
begin
  if not is_admin() then
    raise exception 'administrator access required' using errcode = '42501';
  end if;

  select * into source from site_content where id = content_id;
  if not found then
    raise exception 'content % does not exist', content_id;
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from site_content where section = source.section;

  insert into site_content (section, version, content, note, created_by, updated_by)
  values (
    source.section, next_version, source.content,
    'Rolled back to version ' || source.version, auth.uid(), auth.uid()
  )
  returning id into copy_id;

  insert into audit_logs (actor_id, action, target, detail)
  values (auth.uid(), 'site.rollback', 'site_content/' || copy_id,
          jsonb_build_object('section', source.section,
                             'restoredFrom', source.version,
                             'newVersion', next_version));

  return publish_site_content(copy_id);
end;
$$;

revoke all on function publish_site_content(uuid) from public;
revoke all on function rollback_site_content(uuid) from public;
grant execute on function publish_site_content(uuid) to authenticated;
grant execute on function rollback_site_content(uuid) to authenticated;
