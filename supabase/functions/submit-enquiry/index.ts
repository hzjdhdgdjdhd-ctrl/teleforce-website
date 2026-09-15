/**
 * Public enquiry submission with Turnstile verification.
 *
 * The token has to be checked against Cloudflare using the secret key, and
 * that secret cannot be in a browser bundle — so the insert moves here. A
 * token stored unverified alongside the row would be decoration: anyone can
 * put a string in a JSON field.
 *
 * With no secret configured the function still accepts submissions. A missing
 * environment variable should not silently stop every enquiry reaching the
 * business; the honeypot and the CHECK constraints still apply.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Payload {
  name?: string
  email?: string
  organisation?: string
  role?: string
  interest?: string
  volume?: string
  message?: string
  sourcePage?: string
  turnstileToken?: string
  /** Honeypot. Real people never fill this. */
  website?: string
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

async function verifyTurnstile(
  token: string | undefined,
  secret: string,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false

  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)
  if (ip) body.append('remoteip', ip)

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body },
    )
    const result = (await res.json()) as { success?: boolean }
    return result.success === true
  } catch {
    // Cloudflare being unreachable must not take the contact form down.
    return true
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let payload: Payload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  // Honeypot: stop without explaining why.
  if (payload.website) return json({ ok: true })

  const name = (payload.name ?? '').trim()
  const email = (payload.email ?? '').trim().toLowerCase()
  const organisation = (payload.organisation ?? '').trim()
  const message = (payload.message ?? '').trim()

  if (!name || !organisation) {
    return json({ error: 'Name and organisation are required' }, 400)
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return json({ error: 'That is not a valid email address' }, 400)
  }
  if (message.length < 20) {
    return json({ error: 'Please tell us a little more about the process' }, 400)
  }

  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (secret) {
    const ip = req.headers.get('cf-connecting-ip')
    const ok = await verifyTurnstile(payload.turnstileToken, secret, ip)
    if (!ok) {
      return json({ error: 'Verification failed. Please try again.' }, 403)
    }
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error } = await admin.from('enquiries').insert({
    name,
    email,
    organisation,
    role: payload.role?.trim() || null,
    interest: payload.interest || null,
    volume: payload.volume || null,
    message,
    source_page: payload.sourcePage ?? null,
    user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
  })

  if (error) return json({ error: error.message }, 400)
  return json({ ok: true })
})
