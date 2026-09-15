-- ============================================================
-- QA review queue
--
-- Reviewers need calls that produced a lead, with enough context to judge
-- them without opening six tabs. One function rather than a view so the
-- access check is explicit and the day window is computed the same way as
-- the wallboard.
-- ============================================================

create or replace function qa_queue(
  target_campaign text default 'hhcro',
  only_unreviewed boolean default false,
  limit_rows int default 100
)
returns table (
  call_id uuid,
  lead_id uuid,
  agent_id uuid,
  agent_name text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds int,
  disposition call_disposition,
  checkpoints_reached text[],
  rebuttals_used text[],
  answers jsonb,
  notes text,
  customer_name text,
  customer_phone text,
  compliance_score int,
  billable boolean,
  lead_status lead_status,
  reviewed boolean,
  review_passed boolean,
  reviewer_name text,
  reviewed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not can_review() then
    raise exception 'QA access required' using errcode = '42501';
  end if;

  return query
  select
    c.id, l.id, c.agent_id, ap.display_name,
    c.started_at, c.ended_at, c.duration_seconds, c.disposition,
    c.checkpoints_reached, c.rebuttals_used, c.answers, c.notes,
    nullif(trim(coalesce(ct.first_name,'') || ' ' || coalesce(ct.last_name,'')), ''),
    ct.phone,
    l.compliance_score, l.billable, l.status,
    (r.id is not null), r.passed, rp.display_name, r.reviewed_at
  from calls c
  join profiles ap on ap.id = c.agent_id
  left join leads l on l.call_id = c.id
  left join contacts ct on ct.id = c.contact_id
  -- Most recent review only; a call can be reviewed more than once.
  left join lateral (
    select * from qa_reviews q
    where q.call_id = c.id
    order by q.reviewed_at desc
    limit 1
  ) r on true
  left join profiles rp on rp.id = r.reviewer_id
  where c.campaign_id = target_campaign
    -- Only scripted calls are worth a reviewer's time. A no-answer has
    -- nothing to score.
    and c.disposition is not null
    and c.disposition in ('qualified','terminated_ineligible','terminated_property')
    and (not only_unreviewed or r.id is null)
    -- A team leader reviews their own team; supervisors and QA see all.
    and (is_staff() or (is_team_leader() and leads_user(c.agent_id))
         or current_role_name() = 'qa')
  order by
    -- Unreviewed billable leads first: those are the ones being invoiced.
    (r.id is not null),
    (l.billable is not true),
    c.started_at desc
  limit greatest(1, least(limit_rows, 500));
end;
$$;

revoke all on function qa_queue(text, boolean, int) from public;
grant execute on function qa_queue(text, boolean, int) to authenticated;

-- ------------------------------------------------------------
-- Submitting a review. Writing the lead status here keeps the two in step:
-- a review that passes but leaves the lead qa_pending is worse than no
-- review at all, because the queue looks clear and the lead never ships.
-- ------------------------------------------------------------

create or replace function submit_qa_review(
  target_call uuid,
  passed boolean,
  coaching text default '',
  overridden text[] default '{}',
  supervisor_note text default null
)
returns qa_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  review qa_reviews;
  target_lead uuid;
  score int;
begin
  if not can_review() then
    raise exception 'QA access required' using errcode = '42501';
  end if;

  select l.id, l.compliance_score into target_lead, score
  from leads l where l.call_id = target_call;

  insert into qa_reviews (
    call_id, lead_id, reviewer_id, compliance_score, passed,
    overridden_failures, coaching_notes, supervisor_comments
  )
  values (
    target_call, target_lead, auth.uid(), coalesce(score, 0), passed,
    coalesce(overridden, '{}'), coalesce(coaching, ''), supervisor_note
  )
  returning * into review;

  if target_lead is not null then
    update leads
    set status = case when passed then 'qa_passed' else 'qa_failed' end,
        -- A reviewer failing a lead is the final word on whether it can be
        -- invoiced, regardless of what the automatic score said.
        billable = case when passed then billable else false end
    where id = target_lead;
  end if;

  insert into audit_logs (actor_id, action, target, detail)
  values (auth.uid(), 'qa.review', 'calls/' || target_call,
          jsonb_build_object('passed', passed, 'lead', target_lead));

  return review;
end;
$$;

revoke all on function submit_qa_review(uuid, boolean, text, text[], text) from public;
grant execute on function submit_qa_review(uuid, boolean, text, text[], text) to authenticated;
