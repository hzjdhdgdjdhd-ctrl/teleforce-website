/**
 * Edge entry point for teleforcetechnology.org.
 *
 * Its only job is canonicalising the hostname; everything else falls through
 * to the static assets built into dist/.
 *
 *   www.teleforcetechnology.org/...  ->  301  teleforcetechnology.org/...
 *   http://...                       ->  301  https://...
 *
 * Path and query string are preserved, so deep links and campaign parameters
 * survive the redirect. Cloudflare also enforces HTTPS at the edge when
 * "Always Use HTTPS" is on; the check here means the behaviour holds even if
 * that setting is ever changed.
 */

interface Env {
  ASSETS: Fetcher
}

const CANONICAL_HOST = 'teleforcetechnology.org'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    const wrongHost = url.hostname !== CANONICAL_HOST
    const insecure = url.protocol !== 'https:'

    // Only redirect hostnames we actually own — never bounce an unexpected
    // Host header to the canonical domain, which would make this an open
    // redirect for anything pointed at the Worker.
    const ownedHost =
      url.hostname === CANONICAL_HOST || url.hostname === `www.${CANONICAL_HOST}`

    if (ownedHost && (wrongHost || insecure)) {
      url.hostname = CANONICAL_HOST
      url.protocol = 'https:'
      url.port = ''
      return Response.redirect(url.toString(), 301)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
