/**
 * Edge entry point for the admin application.
 *
 * Internal tooling: it must never be indexed, and it must never be framed by
 * another origin — a clickjacked agent console leaks customer data.
 */

interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.protocol !== 'https:') {
      url.protocol = 'https:'
      url.port = ''
      return Response.redirect(url.toString(), 301)
    }

    const response = await env.ASSETS.fetch(request)
    const headers = new Headers(response.headers)

    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
}
