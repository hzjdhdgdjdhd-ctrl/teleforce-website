-- ============================================================
-- Team Leader and Viewer roles
--
-- A team leader sits between supervisor and agent: they run a team, so they
-- can see its calls, reassign its leads and coach its agents — but they
-- cannot delete campaigns, manage administrators or touch the website.
--
-- "Their team" has to mean something in SQL, so teams are explicit rather
-- than inferred. Without that, team_leader collapses into supervisor.
-- ============================================================

alter type user_role add value if not exists 'team_leader';
alter type user_role add value if not exists 'viewer';
