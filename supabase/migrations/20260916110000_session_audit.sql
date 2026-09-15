-- Sign-outs are audited. An account that went quiet at 14:05 because it idled
-- out reads very differently from one that was signed out deliberately, and
-- during an incident that distinction is the whole investigation.

create or replace function audit_sign_out(reason text default 'manual')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into audit_logs (actor_id, actor_email, action, target, detail)
  values (
    auth.uid(),
    (select email from profiles where id = auth.uid()),
    'session.sign_out',
    'profiles/' || auth.uid(),
    jsonb_build_object('reason', reason)
  );

  -- Leaving an agent "available" on the wallboard after they have gone is
  -- how a supervisor ends up routing work to an empty desk.
  update agent_presence
  set status = 'offline', contact_id = null, call_id = null
  where user_id = auth.uid();
end;
$$;

revoke all on function audit_sign_out(text) from public;
grant execute on function audit_sign_out(text) to authenticated;
