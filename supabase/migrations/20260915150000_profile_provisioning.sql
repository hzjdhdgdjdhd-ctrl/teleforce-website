-- ============================================================
-- Profile provisioning
--
-- Every policy resolves the caller's role through `profiles`. Without a row
-- there, a freshly signed-up user has no role and every policy denies — the
-- app would authenticate them and then behave as though they did not exist.
--
-- So a profile is created by trigger at signup, always as 'agent'. Elevation
-- is a deliberate act by an existing admin, never something a signup can
-- grant itself.
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, display_name, role, active)
  values (
    new.id,
    coalesce(new.email, ''),
    -- Prefer a name supplied at signup; fall back to the local part of the
    -- email so the wallboard never shows a blank row.
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    'agent',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- Bootstrap: promote the first user to admin.
--
-- Someone has to be able to grant roles, and there is deliberately no
-- self-service path. This function is callable only by the service role,
-- so it cannot be reached from a browser session.
-- ------------------------------------------------------------

create or replace function promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  select id into target from profiles where email = target_email;
  if target is null then
    raise exception 'no profile for %; sign in through the app first', target_email;
  end if;

  update profiles set role = 'admin' where id = target;

  insert into audit_logs (actor_id, actor_email, action, target, detail)
  values (target, target_email, 'role.promote', 'profiles/' || target,
          jsonb_build_object('to', 'admin', 'via', 'promote_to_admin'));
end;
$$;

revoke all on function promote_to_admin(text) from public, authenticated, anon;

-- ------------------------------------------------------------
-- Audit role changes. A silent privilege escalation is the one change
-- nobody would notice and everybody would care about.
-- ------------------------------------------------------------

create or replace function audit_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    insert into audit_logs (actor_id, actor_email, action, target, detail)
    values (
      auth.uid(),
      (select email from profiles where id = auth.uid()),
      'role.change',
      'profiles/' || new.id,
      jsonb_build_object('from', old.role, 'to', new.role, 'subject', new.email)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_audit_role on profiles;
create trigger profiles_audit_role
  after update on profiles
  for each row execute function audit_role_change();
