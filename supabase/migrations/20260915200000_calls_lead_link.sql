-- The repository writes calls.lead_id when a call produces a lead, but the
-- column was never created — so closing a qualified call failed at the last
-- step, after the lead had already been written. Add it, and make the link
-- navigable in both directions.

alter table calls
  add column if not exists lead_id uuid references leads on delete set null;

create index if not exists calls_lead_idx on calls (lead_id) where lead_id is not null;
