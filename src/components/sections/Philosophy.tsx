import { motion, useReducedMotion } from 'framer-motion'
import { Container, Eyebrow, Section } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { pillars } from '@/data/services'

/**
 * The three-pillar philosophy band.
 *
 * Presented as a numbered ledger rather than three cards — the claim is a
 * statement of operating principle, and a ledger reads more like a charter.
 */
export default function Philosophy() {
  const reduced = useReducedMotion()

  return (
    <Section id="philosophy" className="border-t border-pearl/8">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Left — the thesis */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Reveal>
              <Eyebrow index="01">Operating Philosophy</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.1] text-gradient-pearl">
                We are not an AI company.
                <br />
                We are an operations company.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-7 max-w-md text-[15px] leading-[1.8] text-pearl-dim">
                A great deal of outsourcing is now sold as automation with people
                bolted on afterwards. We build the other way around. Skilled
                people sit at the centre of every engagement; technology and
                process exist to make their judgement repeatable, auditable and
                fast.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-9 border-l-2 border-gold/60 pl-6">
                <p className="text-[15px] leading-relaxed text-pearl/90 italic">
                  Software does not apologise convincingly, notice that a
                  customer sounds worried, or decide that a rule should not
                  apply this once. People do.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Right — the pillars */}
          <ol className="divide-y divide-pearl/10 border-y border-pearl/10">
            {pillars.map((pillar, i) => (
              <motion.li
                key={pillar.index}
                className="group relative py-9 first:pt-0 lg:py-11"
                initial={reduced ? undefined : { opacity: 0, y: 28 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{
                  duration: 0.75,
                  delay: i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="flex items-baseline gap-5">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-gold/75">
                    {pillar.index}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-pearl-faint">
                    {pillar.title}
                  </span>
                </div>

                <h3 className="mt-4 text-[clamp(1.5rem,2.6vw,2.05rem)] leading-tight text-pearl transition-colors duration-500 group-hover:text-gold">
                  {pillar.statement}
                </h3>

                <p className="mt-4 max-w-xl text-[14.5px] leading-[1.8] text-pearl-dim">
                  {pillar.body}
                </p>

                {/* Progress rail that fills on hover */}
                <span
                  className="absolute -left-6 top-9 hidden h-0 w-px bg-gradient-to-b from-gold to-transparent transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:h-24 lg:block"
                  aria-hidden="true"
                />
              </motion.li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  )
}
