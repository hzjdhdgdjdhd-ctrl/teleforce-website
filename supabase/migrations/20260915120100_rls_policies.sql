-- ============================================================
-- Row level security
--
-- Every table is locked by default. Nothing is readable without a policy,
-- so forgetting one fails closed rather than leaking.
--
-- The threat being defended against is not only an outsider: an agent with a
-- valid session must not be able to read the whole contact list, another
-- agent's leads, or anyone's QA scores.
-- ============================================================

alter table profiles         enable row level security;
alter table campaigns        enable row level security;
alter table campaign_members enable row level security;
alter table contact_batches  enable row level security;
alter table contacts         enable row level security;
alter table calls            enable row level security;
alter table leads            enable row level security;
alter table rebuttals        enable row level security;
alter table qa_reviews       enable row level security;
alter table audit_logs       enable row level security;

-- ------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------

create policy profiles_read_own on profiles
  for select using (id = auth.uid() or is_staff());

-- A user may edit their display name but never their own role: that would
-- let any agent promote themselves to admin.
create policy profiles_update_own on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- Campaigns and membership
-- ------------------------------------------------------------

create policy campaigns_read on campaigns
  for select using (in_campaign(id));

create policy campaigns_admin_write on campaigns
  for all using (is_admin()) with check (is_admin());

create policy campaign_members_read on campaign_members
  for select using (user_id = auth.uid() or is_staff());

create policy campaign_members_admin_write on campaign_members
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- Contact batches — staff only. Agents never see the upload log.
-- ------------------------------------------------------------

create policy contact_batches_read on contact_batches
  for select using (is_staff() and in_campaign(campaign_id));

create policy contact_batches_write on contact_batches
  for all using (is_staff() and in_campaign(campaign_id))
  with check (is_staff() and in_campaign(campaign_id));

-- ------------------------------------------------------------
-- Contacts
--
-- An agent sees only the contact they are currently working. They never get
-- to enumerate the list, which is both a data protection control and a
-- commercial one — the contact list is the asset being protected.
-- ------------------------------------------------------------

create policy contacts_agent_read_assigned on contacts
  for select using (
    assigned_to = auth.uid()
    or (is_staff() and in_campaign(campaign_id))
  );

-- Agents may only update the contact assigned to them, and only its working
-- fields. Reassigning to someone else is blocked by the with check.
create policy contacts_agent_update_assigned on contacts
  for update using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid() or assigned_to is null);

create policy contacts_staff_write on contacts
  for all using (is_staff() and in_campaign(campaign_id))
  with check (is_staff() and in_campaign(campaign_id));

-- ------------------------------------------------------------
-- Calls
-- ------------------------------------------------------------

create policy calls_agent_own on calls
  for select using (agent_id = auth.uid() or can_review());

create policy calls_agent_insert on calls
  for insert with check (agent_id = auth.uid() and in_campaign(campaign_id));

create policy calls_agent_update_own on calls
  for update using (agent_id = auth.uid()) with check (agent_id = auth.uid());

create policy calls_staff_all on calls
  for all using (is_staff() and in_campaign(campaign_id))
  with check (is_staff() and in_campaign(campaign_id));

-- ------------------------------------------------------------
-- Leads
-- ------------------------------------------------------------

create policy leads_agent_own on leads
  for select using (agent_id = auth.uid() or can_review());

create policy leads_agent_insert on leads
  for insert with check (agent_id = auth.uid() and in_campaign(campaign_id));

-- Agents cannot edit a lead after creating it. Changing a submitted lead is
-- a supervisor action with an audit trail, not something done quietly.
create policy leads_staff_write on leads
  for all using (is_staff() and in_campaign(campaign_id))
  with check (is_staff() and in_campaign(campaign_id));

-- ------------------------------------------------------------
-- Rebuttals — everyone in the campaign reads, staff edit
-- ------------------------------------------------------------

create policy rebuttals_read on rebuttals
  for select using (in_campaign(campaign_id));

create policy rebuttals_staff_write on rebuttals
  for all using (is_staff() and in_campaign(campaign_id))
  with check (is_staff() and in_campaign(campaign_id));

-- ------------------------------------------------------------
-- QA reviews
--
-- An agent may read reviews of their own calls — coaching only works if the
-- person being coached can see it — but may never write one.
-- ------------------------------------------------------------

create policy qa_reviews_read on qa_reviews
  for select using (
    can_review()
    or exists (select 1 from calls c where c.id = call_id and c.agent_id = auth.uid())
  );

create policy qa_reviews_reviewer_write on qa_reviews
  for insert with check (can_review() and reviewer_id = auth.uid());

create policy qa_reviews_reviewer_update on qa_reviews
  for update using (can_review()) with check (can_review());

-- ------------------------------------------------------------
-- Audit log — readable by admins, writable by nobody through the API.
-- Entries are written by SECURITY DEFINER functions only, so a client
-- cannot forge or delete history.
-- ------------------------------------------------------------

create policy audit_logs_admin_read on audit_logs
  for select using (is_admin());
