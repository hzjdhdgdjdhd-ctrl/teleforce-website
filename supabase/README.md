# Supabase backend

Postgres schema, row-level security and the atomic contact-claim function.

## Status

The migrations here are **not yet applied to any project**, and could not be
executed locally — Docker is not installed on this machine, so `supabase start`
was unavailable. Treat the SQL as reviewed but unverified until the first
`db push` succeeds.

## One-time setup

```bash
npx supabase login          # opens a browser; authorise once, token is stored locally
npx supabase projects create teleforce --region eu-west-2 --org-id <your-org>
npx supabase link --project-ref <ref-from-the-previous-command>
npx supabase db push        # applies every migration in order
```

`eu-west-2` (London) keeps UK personal data in the UK, which matters for the
claims made on the public site's data protection page.

Then point the apps at it:

```bash
cat > apps/agent/.env.local <<'ENV'
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from the dashboard>
ENV
```

Without those variables the apps fall back to browser-local storage and show a
**"Local storage — not synced"** badge in the header, so nobody works a day's
calls thinking they are saved when they are not.

## Regenerating types

`packages/data/src/database.types.ts` is hand-written to mirror these
migrations. Once a project is linked, replace it with generated output:

```bash
npx supabase gen types typescript --linked > packages/data/src/database.types.ts
```

## Design decisions worth knowing

**Claiming is atomic.** `claim_next_contact()` uses `FOR UPDATE SKIP LOCKED`
rather than a read-then-write. The naive version races: two agents read the
same `available` row and both dial the same household. `SKIP LOCKED` also
means concurrent agents take different rows instead of queueing.

**RLS is the access control, not the client.** The repository never filters by
user. It asks for what it wants and Postgres returns only what the caller is
entitled to. Filtering in the client that *looks* like security is worse than
none.

**Agents cannot enumerate contacts.** An agent can read only the contact
assigned to them. The list is both personal data and the commercial asset.

**Agents cannot promote themselves.** The `profiles` update policy pins `role`
to its existing value, so a compromised agent session cannot grant itself
admin.

**Agents cannot edit a lead after creating it.** Amending a submitted lead is a
supervisor action with an audit trail.

**Billability is enforced in the database.** `leads_billable_requires_score`
rejects a billable lead scoring under 80. This is the number the client is
invoiced against, so application code is not the only thing standing behind it.

**Stale assignments are released.** `release_stale_assignments()` frees
contacts abandoned for 30 minutes, so a crashed browser does not strand a
number. Schedule it with pg_cron or an edge function.

## Seeding the first admin

Sign up through the app, then in the SQL editor:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

The first user must be promoted this way — there is deliberately no
self-service path to an admin role.
