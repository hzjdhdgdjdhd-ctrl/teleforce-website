/**
 * User management.
 *
 * Creating an auth user requires the service role key. That key must never
 * reach a browser — anyone holding it can read every table regardless of RLS.
 * So it stays here, and this function is the only path to it.
 *
 * Every request is authorised twice:
 *   1. The caller's JWT must be valid.
 *   2. Their profile row must say role = 'admin'.
 *
 * The second check reads the database rather than trusting a claim in the
 * token, because a role in a JWT is only as fresh as the last refresh.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Role = 'admin' | 'supervisor' | 'team_leader' | 'qa' | 'agent' | 'viewer'

interface CreatePayload {
  action: 'create'
  email: string
  password: string
  displayName: string
  role: Role
  campaignIds?: string[]
}

interface UpdatePayload {
  action: 'update'
  userId: string
  role?: Role
  active?: boolean
  displayName?: string
}

type Payload = CreatePayload | UpdatePayload

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Not signed in' }, 401)

  // Identify the caller using their own token, never the service key.
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await asCaller.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Not signed in' }, 401)

  const admin = createClient(url, serviceKey)

  // Authorise against the database, not against a token claim.
  const { data: profile } = await admin
    .from('profiles')
    .select('role, active')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin' || !profile.active) {
    return json({ error: 'Administrator access required' }, 403)
  }

  let payload: Payload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  /* ---------------- create ---------------- */

  if (payload.action === 'create') {
    const email = payload.email?.trim().toLowerCase()
    const { password, displayName, role } = payload

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
      return json({ error: 'That is not a valid email address' }, 400)
    }
    if (!password || password.length < 12) {
      return json(
        { error: 'Password must be at least 12 characters' },
        400,
      )
    }
    if (
      !['admin', 'supervisor', 'team_leader', 'qa', 'agent', 'viewer'].includes(
        role,
      )
    ) {
      return json({ error: 'Unknown role' }, 400)
    }

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName?.trim() || email.split('@')[0] },
      })

    if (createError || !created.user) {
      const message = createError?.message ?? 'Could not create that user'
      // Supabase reports an existing address in a few different ways.
      const exists = /already|exists|registered/i.test(message)
      return json(
        { error: exists ? 'An account already exists for that address' : message },
        exists ? 409 : 400,
      )
    }

    // The signup trigger creates the profile as 'agent'. Apply the requested
    // role afterwards so elevation is explicit and audited.
    if (role !== 'agent') {
      await admin.from('profiles').update({ role }).eq('id', created.user.id)
    }

    for (const campaignId of payload.campaignIds ?? []) {
      await admin
        .from('campaign_members')
        .upsert({ campaign_id: campaignId, user_id: created.user.id })
    }

    await admin.from('audit_logs').insert({
      actor_id: userData.user.id,
      actor_email: userData.user.email,
      action: 'user.create',
      target: `profiles/${created.user.id}`,
      detail: { email, role },
    })

    return json({ ok: true, userId: created.user.id })
  }

  /* ---------------- update ---------------- */

  if (payload.action === 'update') {
    const { userId } = payload
    if (!userId) return json({ error: 'No user specified' }, 400)

    // An admin removing their own access locks everyone out of user
    // management, with no way back short of the dashboard.
    if (userId === userData.user.id) {
      if (payload.role && payload.role !== 'admin') {
        return json({ error: 'You cannot change your own role' }, 400)
      }
      if (payload.active === false) {
        return json({ error: 'You cannot deactivate your own account' }, 400)
      }
    }

    const patch: Record<string, unknown> = {}
    if (payload.role !== undefined) patch.role = payload.role
    if (payload.active !== undefined) patch.active = payload.active
    if (payload.displayName !== undefined) patch.display_name = payload.displayName

    if (Object.keys(patch).length === 0) return json({ ok: true })

    const { error } = await admin.from('profiles').update(patch).eq('id', userId)
    if (error) return json({ error: error.message }, 400)

    await admin.from('audit_logs').insert({
      actor_id: userData.user.id,
      actor_email: userData.user.email,
      action: 'user.update',
      target: `profiles/${userId}`,
      detail: patch as Record<string, string | number | boolean>,
    })

    return json({ ok: true })
  }

  return json({ error: 'Unknown action' }, 400)
})
