import { useEffect, useMemo, useState } from 'react'
import { Container, Eyebrow, Section } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { Card } from '@/components/ui/Card'
import RegionGlobe from '@/components/visuals/RegionGlobe'
import { markets, type Market } from '@/data/markets'
import { company } from '@/config/company'

/**
 * Where we operate.
 *
 * Three markets, each with the programme that actually runs in it. The card
 * carries no volumes or conversion figures: we have none we could evidence,
 * and on a page whose whole argument is candour an invented number is the one
 * thing that would undo it.
 */

/** Local wall-clock time in a market, or '' if the zone is unsupported. */
function localTime(now: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(now)
  } catch {
    // An engine without full ICU data throws rather than guessing. So do we.
    return ''
  }
}

function MarketPanel({ market, now }: { market: Market; now: Date }) {
  const time = localTime(now, market.timeZone)

  return (
    <Card interactive className="flex h-full flex-col p-8">
      {/* The globe bleeds off the corner so the card reads as a window onto
          it rather than a box with a picture in it. Offset far enough that
          only the lower-left quadrant of the disc is on the card: at the
          narrowest three-column width the country name would otherwise run
          into the limb. */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-[150px] w-[150px] opacity-70 transition-opacity duration-700 group-hover:opacity-100"
        aria-hidden="true"
      >
        <RegionGlobe lat={market.lat} lng={market.lng} className="h-full w-full" />
      </div>

      <div className="relative flex items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.2em] text-gold/75">
          {market.index}
        </span>
        <span className="h-px w-5 bg-gold/40" aria-hidden="true" />
        <span className="font-mono text-[11px] tracking-[0.22em] text-pearl-faint">
          {market.code}
        </span>
      </div>

      <h3 className="relative mt-6 max-w-[11ch] text-[clamp(1.5rem,2.4vw,1.85rem)] leading-[1.12] text-pearl">
        {market.country}
      </h3>

      <p className="relative mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold/80">
        {market.programme}
      </p>

      <p className="relative mt-5 text-[14.5px] leading-[1.75] text-pearl-dim">
        {market.summary}
      </p>

      <ul className="relative mt-7 space-y-2.5 border-t border-pearl/8 pt-7">
        {market.points.map((p) => (
          <li
            key={p}
            className="flex items-start gap-3 text-[13.5px] leading-relaxed text-pearl-faint"
          >
            <span
              className="mt-[7px] h-1 w-1 shrink-0 bg-gold/70"
              aria-hidden="true"
            />
            {p}
          </li>
        ))}
      </ul>

      {/* Footer rail — pushed to the bottom so the three cards line up even
          when the copy above them differs in length. */}
      <dl className="relative mt-auto space-y-4 border-t border-pearl/8 pt-6">
        {time && (
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
              Local time
            </dt>
            <dd className="mt-1 font-mono text-[12px] text-pearl-dim">{time}</dd>
          </div>
        )}
        {market.client && (
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
              Client
            </dt>
            {/* Set in the client's own capitalisation rather than the mono
                uppercase used for labels — it is a company's name, not a
                field heading. */}
            <dd className="mt-1 text-[12.5px] leading-snug text-pearl-dim">
              {market.client.name}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  )
}

export default function Markets() {
  // One clock for the whole section rather than one per card. Half a minute
  // is well inside the resolution of a display that shows hours and minutes.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const codes = useMemo(() => markets.map((m) => m.code).join(' · '), [])

  return (
    <Section id="markets" className="border-t border-pearl/8">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Reveal>
              <Eyebrow index="02">Markets We Serve</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.08] text-gradient-pearl">
                Three markets.
                <br />
                One delivery floor.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 text-[15px] leading-[1.8] text-pearl-dim md:text-base">
                The work is different in each country, and the script is written
                for it. What does not change is where it is run from, who runs
                it, and the standard it is checked against before it reaches
                you.
              </p>
            </Reveal>
          </div>

          {/* Delivery corridor readout — ties the three markets back to the
              single floor they are all run from. */}
          <Reveal delay={0.18} className="shrink-0">
            <div className="border-l-2 border-gold/50 pl-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
                Delivered from
              </p>
              <p className="mt-2 text-[13.5px] leading-snug text-pearl-dim">
                {company.deliveryCentre}
              </p>
              <p className="mt-3 font-mono text-[10.5px] tracking-[0.22em] text-pearl-faint">
                <span aria-hidden="true">→ </span>
                {codes}
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 md:mt-16 lg:grid-cols-3">
          {markets.map((market, i) => (
            <Reveal key={market.id} index={i} className="h-full">
              <MarketPanel market={market} now={now} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  )
}
