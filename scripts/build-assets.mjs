/**
 * Asset pipeline.
 *
 * Every SVG in /assets is the source of truth. This script optimises each one
 * and emits a typed React component beside it, so an asset can never drift
 * from the component that renders it — there is only one file to edit.
 *
 *   assets/icons/hard-phone.svg  ->  packages/ui/src/assets/HardPhone.tsx
 *
 * Alt text lives in a sidecar `.alt.txt`. An asset without one fails the
 * build: a decorative-by-default policy is how icons end up unlabelled for
 * screen reader users.
 */

import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, basename, extname, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const ASSETS = join(ROOT, 'assets')
const OUT = join(ROOT, 'packages/ui/src/assets')

/** Minimal, dependency-free SVG optimisation. */
function optimise(svg) {
  return svg
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+xmlns:(xlink|serif|inkscape|sodipodi)="[^"]*"/g, '')
    .replace(/\s+(inkscape|sodipodi|serif):[a-zA-Z-]+="[^"]*"/g, '')
    .replace(/\s+id="[^"]*"/g, (m) => (m.includes('grad') || m.includes('clip') ? m : ''))
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function componentName(file) {
  return basename(file, '.svg')
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

/** Turn SVG attributes into JSX-safe props. */
function toJsx(svg) {
  return svg
    .replace(/([a-z]+)-([a-z])/g, (m, a, b) => {
      // Only convert known SVG kebab attributes, never CSS inside style="".
      const known = [
        'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
        'stroke-dashoffset', 'stroke-opacity', 'fill-opacity', 'fill-rule',
        'clip-path', 'clip-rule', 'stop-color', 'stop-opacity', 'text-anchor',
        'font-family', 'font-size', 'font-weight', 'letter-spacing',
        'shape-rendering', 'vector-effect', 'color-interpolation-filters',
      ]
      return known.includes(m) ? a + b.toUpperCase() : m
    })
    .replace(/class=/g, 'className=')
    .replace(/xmlns:xlink=/g, 'xmlnsXlink=')
    .replace(/xlink:href=/g, 'xlinkHref=')
}

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (extname(entry.name) === '.svg') out.push(full)
  }
  return out
}

async function main() {
  if (!existsSync(ASSETS)) {
    console.log('No assets directory; nothing to build.')
    return
  }

  await mkdir(OUT, { recursive: true })
  const files = await walk(ASSETS)
  const problems = []
  const generated = []

  for (const file of files) {
    const raw = await readFile(file, 'utf8')
    const optimised = optimise(raw)

    // Write the optimised source back so the repository holds one clean copy.
    if (optimised !== raw.trim()) await writeFile(file, optimised + '\n')

    const altFile = file.replace(/\.svg$/, '.alt.txt')
    if (!existsSync(altFile)) {
      problems.push(`${relative(ROOT, file)} has no ${basename(altFile)}`)
      continue
    }
    const alt = (await readFile(altFile, 'utf8')).trim()
    if (!alt) {
      problems.push(
        `${relative(ROOT, altFile)} is empty — write a description, or the ` +
          'single word "decorative" if the asset carries no meaning',
      )
      continue
    }
    // Purely decorative assets are hidden from assistive technology, but the
    // decision has to be stated. Blank is indistinguishable from forgotten.
    const decorative = alt.toLowerCase() === 'decorative'

    const name = componentName(file)
    const inner = toJsx(optimised)
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '')
    const attrs = optimised.match(/^<svg([^>]*)>/)?.[1] ?? ''
    const viewBox = attrs.match(/viewBox="([^"]*)"/)?.[1] ?? '0 0 24 24'

    const component = `/* Generated from ${relative(ROOT, file)} by scripts/build-assets.mjs.
   Edit the SVG, not this file. */
import type { SVGProps } from 'react'

export const ${name}Alt = ${JSON.stringify(decorative ? '' : alt)}

export function ${name}({
  title,
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  const label = title ?? ${name}Alt
  return (
    <svg
      viewBox="${viewBox}"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : 'presentation'}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {label ? <title>{label}</title> : null}
      ${inner}
    </svg>
  )
}
`
    await writeFile(join(OUT, `${name}.tsx`), component)
    generated.push(name)
  }

  if (generated.length > 0) {
    const index = generated
      .sort()
      .map((n) => `export * from './${n}'`)
      .join('\n')
    await writeFile(join(OUT, 'index.ts'), index + '\n')
  }

  console.log(`Assets: ${files.length} svg, ${generated.length} components`)
  if (problems.length > 0) {
    console.error('\nMissing alt text — every asset needs one:')
    for (const p of problems) console.error(`  ${p}`)
    process.exitCode = 1
  }
}

await main()
