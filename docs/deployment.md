# Deployment

Five surfaces, each its own Cloudflare Worker, deployed independently.

| Surface | Worker | Domain |
|---|---|---|
| Public website | `teleforce-website` | teleforcetechnology.org |
| Agent CRM | `teleforce-agent` | agent.teleforcetechnology.org |
| Command centre | `teleforce-admin` | admin.teleforcetechnology.org |
| Wallboard | `teleforce-supervisor` | supervisor.teleforcetechnology.org |
| QA console | `teleforce-qa` | qa.teleforcetechnology.org |

## Automated

Push to `main` runs **CI**; if it passes, **Deploy** runs and ships all five
as a matrix with `fail-fast: false` — one failure must not leave the fleet
split across two versions.

Deploy is a separate workflow gated on `workflow_run`, not a later job in the
same run. Chaining it in-run would let a green-looking pipeline deploy on a
step that was skipped rather than passed.

### Required repository secrets

Settings → Secrets and variables → Actions.

| Secret | Where it comes from |
|---|---|
| `CLOUDFLARE_API_TOKEN` | dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_ACCOUNT_ID` | `npx wrangler whoami` |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `VITE_TURNSTILE_SITE_KEY` | optional; Turnstile is inactive without it |

The workflow checks the two Cloudflare secrets before building and names any
that are missing. An absent secret otherwise surfaces as a wrangler
authentication stack trace, which reads like a broken build.

### Token permissions

The "Edit Cloudflare Workers" template, scoped to this account and the
`teleforcetechnology.org` zone only:

- Account · Workers Scripts · **Edit**
- Account · Workers Routes · **Edit**
- Zone · Workers Routes · **Edit**

A token that authenticates but cannot write routes fails at deploy rather
than at the secret check — if `Check deployment secrets` passes and
`Deploy <app>` fails, suspect permissions, not a missing secret.

## Manual

```bash
npm run build -w @teleforce/<app>
cd apps/<app> && npx wrangler deploy
```

Requires `npx wrangler login` once.

## Native binaries in the lockfile

Four dependencies — `oxlint`, `rolldown`, `@tailwindcss/oxide` and
`lightningcss` — ship as per-platform optional packages. npm records only the
host platform's binding, so a lockfile generated on macOS lists `darwin-arm64`
and nothing else, and `npm ci` on a Linux runner installs the JavaScript
wrapper with no binary behind it.

The Linux bindings are therefore declared explicitly in the root
`optionalDependencies`. They carry os/cpu constraints, so macOS still skips
them. **Do not remove them** — CI fails on the first step needing compiled
code, which is lint, and the failure looks nothing like its cause.

When bumping any of those four packages, bump the matching
`*-linux-x64-gnu` entry to the same version.

## Database

Migrations are applied with the Supabase CLI, not by CI — a schema change
racing a deploy is worse than a manual step.

```bash
npx supabase db push
npx supabase functions deploy manage-users --no-verify-jwt
npx supabase functions deploy submit-enquiry --no-verify-jwt
```

Edge functions need `TURNSTILE_SECRET_KEY` set as a function secret:

```bash
npx supabase secrets set TURNSTILE_SECRET_KEY
```

That secret must never reach a browser bundle, which is why verification
happens in the function rather than the client.
