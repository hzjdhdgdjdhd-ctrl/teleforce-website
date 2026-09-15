/**
 * Deploy every surface.
 *
 * Sequential rather than parallel: five wrangler processes racing produces
 * interleaved output that is impossible to read when one of them fails, and
 * the whole run takes under a minute anyway.
 *
 * One failure does not stop the others — leaving the fleet split across two
 * versions is worse than finishing and reporting what broke.
 *
 *   npm run deploy              every app
 *   npm run deploy agent admin  just those
 */

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const APPS = ['website', 'agent', 'admin', 'supervisor', 'qa']

const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const targets = requested.length > 0 ? requested : APPS

for (const app of targets) {
  if (!APPS.includes(app)) {
    console.error(`Unknown app "${app}". Known: ${APPS.join(', ')}`)
    process.exit(1)
  }
}

const results = []

for (const app of targets) {
  console.log(`\n--- ${app} ---`)
  const cwd = join(ROOT, 'apps', app)

  const build = spawnSync('npm', ['run', 'build'], { cwd, stdio: 'inherit' })
  if (build.status !== 0) {
    results.push({ app, ok: false, at: 'build' })
    continue
  }

  const deploy = spawnSync('npx', ['wrangler', 'deploy'], { cwd, stdio: 'inherit' })
  results.push({ app, ok: deploy.status === 0, at: 'deploy' })
}

console.log('\n--- summary ---')
for (const r of results) {
  console.log(`  ${r.ok ? 'ok  ' : 'FAIL'} ${r.app}${r.ok ? '' : ` (failed at ${r.at})`}`)
}

const failed = results.filter((r) => !r.ok)
if (failed.length > 0) {
  console.error(`\n${failed.length} of ${results.length} failed.`)
  process.exit(1)
}
console.log(`\nAll ${results.length} deployed.`)
