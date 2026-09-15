-- ============================================================
-- HHCRO campaign reference data
--
-- Rebuttal wording is taken from the "WHAT AN AGENT CAN SAY" section of
-- Agent Compliance HHCRO.docx, or is a neutral acknowledgement. Nothing here
-- is invented sales copy: every claim an agent can make on this campaign is
-- constrained by that document, and a rebuttal that strays outside it is a
-- compliance failure waiting to happen.
-- ============================================================

insert into campaigns (id, name, script_id, script_version, active)
values ('hhcro', 'HHCRO Insulation Grant', 'hhcro-insulation', 1, true)
on conflict (id) do update
  set name = excluded.name,
      script_id = excluded.script_id,
      script_version = excluded.script_version;

insert into rebuttals (campaign_id, label, say, sort_order, active) values
  ('hhcro', 'Busy right now',
   'I completely understand. It will only take two minutes, and it is to check whether you qualify for a grant to have your property insulated. Would you rather I called back at a better time?',
   1, true),

  ('hhcro', 'Call me later',
   'Of course. What would suit you better, morning or afternoon? I will make a note and we will call you back then.',
   2, true),

  ('hhcro', 'Already done',
   'That is good to hear. Can I just check whether that was the loft, the cavity walls, or both? There may still be funding available for whichever has not been done.',
   3, true),

  ('hhcro', 'Not interested',
   'That is absolutely fine. Just so you know, the survey is free of charge and carries no obligation. Would you prefer I noted that you would rather not be contacted about this?',
   4, true),

  ('hhcro', 'Need to think about it',
   'That is completely reasonable. The grant is 100% subject to a survey of your property and your personal eligibility, so the survey is simply how we find out whether you qualify. It costs nothing either way.',
   5, true),

  ('hhcro', 'Who are you again?',
   'We are calling to advise all home owners of the grant that is available to get their homes insulated to the latest European energy saving standards.',
   6, true),

  ('hhcro', 'Who is paying for this?',
   'The grants for this insulation work are being funded by the utility companies, for example Eon or British Gas, as part of a government backed energy saving initiative.',
   7, true),

  ('hhcro', 'Is it really free?',
   'The HHCRO grant is 100% subject to survey of your property and your personal eligibility, such as income and benefit status. That is exactly what the free survey establishes.',
   8, true)
on conflict do nothing;
