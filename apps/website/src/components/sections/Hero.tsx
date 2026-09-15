import { motion, useReducedMotion } from 'framer-motion'
import Globe from '@/components/visuals/Globe'
import HumanNetwork from '@/components/visuals/HumanNetwork'
import { ButtonLink } from '@/components/ui/Button'
import { Container, Eyebrow } from '@/components/ui/Section'
import { company } from '@/config/company'
import { useSection } from '@/hooks/useSiteContent'

/** Shipped copy. The CMS overrides these; it never replaces the file. */
const DEFAULT_HERO = {
  eyebrow: `Business Process Outsourcing · ${company.primaryMarket}`,
  headlineLines: ['Human Expertise.', 'Secure Operations.', 'Business Growth.'],
  lede:
    `Teleforce runs business operations for ${company.primaryMarket} ` +
    'organisations with trained, named teams — not automated queues. We take ' +
    "ownership of the processes that consume your people's time, and we run " +
    'them to a documented standard you can inspect.',
  primaryCta: 'Start a conversation',
  secondaryCta: 'Explore our services',
}

export default function Hero() {
  const reduced = useReducedMotion()
  const hero = useSection('hero', DEFAULT_HERO)

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.9,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        }

  return (
    <section className="relative isolate overflow-hidden pt-[112px] lg:pt-[128px]">
      {/* ---------- Backdrop layers ---------- */}

      <div
        className="mesh-backdrop pointer-events-none absolute inset-0 -z-20 mask-fade-radial opacity-60"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[70vh] bg-[radial-gradient(70%_60%_at_58%_18%,rgba(18,58,99,0.5),transparent_72%)]"
        aria-hidden="true"
      />

      {/* The globe */}
      <div
        className="pointer-events-none absolute -z-10 select-none
                   left-1/2 top-[2%] h-[420px] w-[420px] -translate-x-1/2 opacity-35
                   sm:h-[560px] sm:w-[560px] sm:opacity-45
                   md:h-[720px] md:w-[720px] md:opacity-60
                   lg:left-auto lg:right-[-7%] lg:top-[2%] lg:h-[860px] lg:w-[860px] lg:translate-x-0 lg:opacity-100"
        aria-hidden="true"
      >
        <Globe scale={0.36} />
      </div>

      {/* Keep copy legible over the globe on small screens */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-obsidian/85 via-obsidian/55 to-obsidian lg:from-transparent lg:via-transparent lg:to-obsidian"
        aria-hidden="true"
      />

      {/* ---------- Content ---------- */}
      <Container className="relative">
        <div className="flex min-h-[calc(100vh-180px)] flex-col justify-center py-16 lg:py-24">
          <div className="max-w-[46rem]">
            <motion.div {...rise(0.05)}>
              <Eyebrow>{hero.eyebrow}</Eyebrow>
            </motion.div>

            <h1 className="mt-8 text-[clamp(2.4rem,6.4vw,4.75rem)] font-semibold leading-[1.04] tracking-[-0.035em]">
              {hero.headlineLines.map((line, i) => (
                <motion.span key={line} className="block" {...rise(0.16 + i * 0.11)}>
                  {/* The last line carries the gold, whatever it says. */}
                  <span
                    className={
                      i === hero.headlineLines.length - 1
                        ? 'text-gradient-gold'
                        : 'text-gradient-pearl'
                    }
                  >
                    {line}
                  </span>
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="mt-8 max-w-[34rem] text-[16px] leading-[1.8] text-pearl-dim md:text-[17px]"
              {...rise(0.54)}
            >
              {hero.lede}
            </motion.p>

            <motion.div
              className="mt-11 flex flex-wrap items-center gap-4"
              {...rise(0.66)}
            >
              <ButtonLink to="/contact" variant="primary">
                {hero.primaryCta}
              </ButtonLink>
              <ButtonLink to="/services" variant="secondary">
                {hero.secondaryCta}
              </ButtonLink>
            </motion.div>

            <motion.div
              className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-pearl/10 pt-7 font-mono text-[11px] uppercase tracking-[0.18em] text-pearl-faint"
              {...rise(0.78)}
            >
              {[
                'People create trust',
                'Technology enables delivery',
                'Process ensures quality',
              ].map((item, i) => (
                <span key={item} className="flex items-center gap-3">
                  {i > 0 && (
                    <span
                      className="hidden h-3 w-px bg-pearl/15 sm:block"
                      aria-hidden="true"
                    />
                  )}
                  <span className="h-1 w-1 bg-gold" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </Container>

      {/* ---------- Human network band ---------- */}
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-obsidian to-transparent"
          aria-hidden="true"
        />
        <Container>
          <HumanNetwork className="h-auto w-full max-w-[1100px] mx-auto" />
        </Container>
      </div>

      {/* ---------- Technical readout ---------- */}
      <div className="border-t border-pearl/8">
        <Container>
          <dl className="grid grid-cols-2 divide-pearl/8 md:grid-cols-4 md:divide-x">
            {[
              ['Delivery Centre', company.deliveryCentre],
              ['Primary Market', company.primaryMarket],
              ['Incorporated', company.incorporatedOn],
              ['Engagement Model', 'Dedicated · Managed · Extended'],
            ].map(([term, value], i) => (
              <motion.div
                key={term}
                className={`py-6 ${i % 2 === 1 ? 'pl-5' : ''} md:px-6 md:first:pl-0`}
                {...rise(0.85 + i * 0.05)}
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
                  {term}
                </dt>
                <dd className="mt-2 text-[13.5px] leading-snug text-pearl-dim">
                  {value}
                </dd>
              </motion.div>
            ))}
          </dl>
        </Container>
      </div>
    </section>
  )
}
