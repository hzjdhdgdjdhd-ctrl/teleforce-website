import { useEffect, useMemo, useState } from 'react'
import type { UserProfile } from '@teleforce/core'
import { can } from '@teleforce/core'
import {
  createRepository,
  SupabaseAdmin,
  SupabaseAuth,
  SupabaseRepository,
  SupabaseScripts,
} from '@teleforce/data'
import {
  Badge,
  Button,
  CommandPalette,
  EmptyState,
  Panel,
  SignIn,
  GlobeMark,
  cn,
  useCommandPalette,
  type Command,
} from '@teleforce/ui'
import { Upload } from './pages/Upload'
import { Leads } from './pages/Leads'
import { Users } from './pages/Users'
import { Questions } from './pages/Questions'

const { repo, backend } = createRepository(
  import.meta.env as Record<string, string | undefined>,
)
const supa = repo instanceof SupabaseRepository ? repo : null
const auth = supa ? new SupabaseAuth(supa) : null
const adminApi = supa ? new SupabaseAdmin(supa) : null
const scriptApi = supa ? new SupabaseScripts(supa) : null

type Tab = 'upload' | 'leads' | 'questions' | 'users'

/** `adminOnly` tabs are hidden from supervisors; RLS refuses them regardless. */
const TABS: Array<{ id: Tab; label: string; adminOnly?: boolean }> = [
  { id: 'upload', label: 'Upload contacts' },
  { id: 'leads', label: 'Leads' },
  { id: 'questions', label: 'Questions & script' },
  { id: 'users', label: 'Users & agents', adminOnly: true },
]

/**
 * Command centre.
 *
 * Access is checked twice: the UI hides what a user cannot do, and RLS
 * refuses it regardless. The UI check is courtesy — the database check is
 * the one that matters.
 */
export default function App() {
  const [signedIn, setSignedIn] = useState<boolean | null>(auth ? null : true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tab, setTab] = useState<Tab>('upload')
  const palette = useCommandPalette()

  useEffect(() => {
    if (!auth) return
    void auth.hasSession().then(setSignedIn)
    return auth.onChange(setSignedIn)
  }, [])

  useEffect(() => {
    if (!signedIn) {
      setProfile(null)
      return
    }
    void repo.currentUser().then(setProfile)
  }, [signedIn])

  const visibleTabs = useMemo(
    () => TABS.filter((t) => !t.adminOnly || profile?.role === 'admin'),
    [profile],
  )

  const commands = useMemo<Command[]>(
    () => [
      ...visibleTabs.map((t) => ({
        id: `nav-${t.id}`,
        group: 'Go to',
        label: t.label,
        run: () => setTab(t.id),
      })),
      ...(auth
        ? [
            {
              id: 'signout',
              group: 'Session',
              label: 'Sign out',
              run: () => void auth.signOut(),
            },
          ]
        : []),
    ],
    [visibleTabs],
  )

  if (signedIn === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-pearl-faint">
          Checking session…
        </span>
      </div>
    )
  }

  if (!signedIn && auth) {
    return (
      <SignIn
        product="Admin"
        heading="Sign in to the command centre"
        onSignIn={(e, p) => auth.signIn(e, p)}
      />
    )
  }

  // A signed-in agent reaching this app should be told plainly, not shown a
  // broken screen full of failed queries.
  if (profile && !can(profile.role, 'contacts.upload')) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <Panel className="max-w-md p-10">
          <EmptyState
            title="You do not have access to the command centre"
            description={`Your account is set up as ${profile.role}. If you need administrator access, ask an existing administrator to change your role.`}
            action={
              auth && (
                <Button variant="secondary" onClick={() => void auth.signOut()}>
                  Sign out
                </Button>
              )
            }
          />
        </Panel>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-obsidian">
      <header className="border-b border-pearl/10">
        <div className="flex items-center justify-between gap-6 px-6 py-3.5">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2.5">
              <GlobeMark className="h-6 w-6 shrink-0" idPrefix="admin-hdr" />
              <span className="font-display text-[15px] font-semibold tracking-tight text-pearl">
                Teleforce <span className="text-gold">Admin</span>
              </span>
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint sm:inline">
              HHCRO Insulation
            </span>
          </div>

          <div className="flex items-center gap-4">
            {backend === 'local' && (
              <Badge tone="warn" title="Nothing is saved beyond this browser">
                Local storage — not synced
              </Badge>
            )}
            {profile && (
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint md:inline">
                {profile.displayName} · {profile.role}
              </span>
            )}
            {auth && (
              <Button size="sm" variant="ghost" onClick={() => void auth.signOut()}>
                Sign out
              </Button>
            )}
          </div>
        </div>

        <nav className="flex gap-1 px-6" aria-label="Sections">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'relative px-3.5 py-2.5 text-[13.5px] transition-colors',
                tab === t.id ? 'text-gold' : 'text-pearl-dim hover:text-pearl',
              )}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-3 -bottom-px h-px bg-gold" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 px-6 py-8">
        {tab === 'upload' && (
          <Upload repo={repo} userId={profile?.uid ?? 'local-admin'} />
        )}
        {tab === 'leads' && <Leads repo={repo} />}
        {tab === 'questions' && <Questions scripts={scriptApi} />}
        {tab === 'users' && (
          <Users admin={adminApi} currentUserId={profile?.uid ?? ''} />
        )}
      </main>

      <CommandPalette
        commands={commands}
        open={palette.open}
        onOpenChange={palette.setOpen}
        placeholder="Go to a section, sign out…"
      />
    </div>
  )
}
