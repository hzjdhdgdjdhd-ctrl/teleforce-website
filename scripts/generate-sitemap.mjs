/**
 * Generates public/sitemap.xml from the route table.
 * Run automatically before each build.
 */
import { writeFileSync } from 'node:fs'

const ORIGIN = 'https://teleforcetechnology.org'

const routes = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/services', priority: '0.9', changefreq: 'monthly' },
  { path: '/technology', priority: '0.8', changefreq: 'monthly' },
  { path: '/teams', priority: '0.8', changefreq: 'monthly' },
  { path: '/data-protection', priority: '0.7', changefreq: 'yearly' },
  { path: '/company', priority: '0.6', changefreq: 'yearly' },
  { path: '/contact', priority: '0.9', changefreq: 'yearly' },
]

const today = new Date().toISOString().slice(0, 10)

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${ORIGIN}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml)
console.log(`sitemap.xml written — ${routes.length} routes`)
