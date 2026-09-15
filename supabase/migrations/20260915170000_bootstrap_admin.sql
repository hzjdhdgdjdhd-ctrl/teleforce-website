-- ============================================================
-- Bootstrap the first administrator
--
-- Backfills a profile for any auth user created before the provisioning
-- trigger existed, then promotes the named account and gives it access to
-- the HHCRO campaign.
--
-- Every step asserts. A migration that silently does nothing is worse than
-- one that fails, because the failure is discovered on the floor instead of
-- here.
-- ============================================================

do $$
declare
  admin_email constant text := 'info@teleforcetechnology.org';
  backfilled int;
  admin_id uuid;
  admin_role user_role;
begin
  -- Backfill profiles for users that predate the on_auth_user_created trigger.
  insert into profiles (id, email, display_name, role, active)
  select
    u.id,
    coalesce(u.email, ''),
    coalesce(
      nullif(u.raw_user_meta_data ->> 'display_name', ''),
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(u.email, 'user'), '@', 1)
    ),
    'agent',
    true
  from auth.users u
  left join profiles p on p.id = u.id
  where p.id is null;

  get diagnostics backfilled = row_count;
  raise notice 'backfilled % profile(s)', backfilled;

  -- The account must exist. If it does not, the address is wrong and every
  -- later step would fail in a more confusing way.
  select id into admin_id from profiles where email = admin_email;
  if admin_id is null then
    raise exception
      'No account found for %. Create it in Authentication > Users first.',
      admin_email;
  end if;

  update profiles
  set role = 'admin', active = true
  where id = admin_id;

  -- Campaign access. Admins bypass this through is_admin(), but making the
  -- membership explicit keeps the wallboard and reporting queries honest.
  insert into campaign_members (campaign_id, user_id)
  values ('hhcro', admin_id)
  on conflict do nothing;

  -- Assert the outcome rather than assuming it.
  select role into admin_role from profiles where id = admin_id;
  if admin_role is distinct from 'admin' then
    raise exception 'promotion failed: % is still %', admin_email, admin_role;
  end if;

  if not exists (
    select 1 from campaign_members
    where user_id = admin_id and campaign_id = 'hhcro'
  ) then
    raise exception 'campaign membership was not created for %', admin_email;
  end if;

  raise notice 'admin ready: % (%)', admin_email, admin_id;
end $$;
