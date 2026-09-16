import { motion, useReducedMotion } from 'framer-motion'
import { Container, Eyebrow, Section } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { IconMonitor, IconServer } from '@/components/ui/Icons'
import { techLayers } from '@/data/technology'

const layerIcons = [IconMonitor, IconServer]

/**
 * The Frontend + Backend capability section.
 *
 * Two stacked strata with a connecting seam down the middle — the front end
 * sits on the back end, and the section is laid out to say so.
 */
export default function TechSplit({ standalone = false }: { standalone?: boolean }) {
  const reduced = useReducedMotion()

  return (
    <Section id="technology" className="border-t border-pearl/8">
      <Container>
        {!standalone && (
          <div className="mb-16 max-w-3xl md:mb-20">
            <Reveal>
              <Eyebrow index="04">Technology</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.08] text-gradient-pearl">
                Two layers. One accountable system.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 text-[15px] leading-[1.8] text-pearl-dim md:text-base">
                We build and maintain the software our teams work in, and we
                integrate with the systems you already run. Technology here has
                one job: to let a trained person do skilled work without
                fighting the tooling.
              </p>
            </Reveal>
          </div>
        )}

        <div className="relative">
          {/* The seam joining the two strata */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/30 to-transparent lg:block"
            aria-hidden="true"
          />

          <div className="space-y-px">
            {techLayers.map((layer, li) => {
              const Icon = layerIcons[li]
              return (
                <motion.div
                  key={layer.id}
                  id={layer.id}
                  className="panel scroll-mt-28 p-8 md:p-12 lg:p-14"
                  initial={reduced ? undefined : { opacity: 0, y: 32 }}
                  whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{
                    duration: 0.8,
                    delay: li * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
                    {/* Layer header */}
                    <div>
                      <div className="flex items-center gap-4">
                        <span className="flex h-11 w-11 items-center justify-center border border-gold/30 bg-gold/[0.06] text-gold">
                          <Icon size={20} />
                        </span>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold/80">
                            {layer.index} / {layer.label}
                          </p>
                          <h3 className="mt-1.5 text-xl leading-tight text-pearl lg:text-2xl">
                            {layer.title}
                          </h3>
                        </div>
                      </div>

                      <p className="mt-7 max-w-md text-[14.5px] leading-[1.8] text-pearl-dim">
                        {layer.lede}
                      </p>

                      {/* Stack chips */}
                      <div className="mt-8">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pearl-faint">
                          Working stack
                        </p>
                        <ul className="mt-4 flex flex-wrap gap-2">
                          {layer.stack.map((tech) => (
                            <li
                              key={tech}
                              className="border border-pearl/12 bg-pearl/[0.03] px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] text-pearl-dim transition-colors duration-300 hover:border-gold/40 hover:text-gold"
                            >
                              {tech}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Capabilities */}
                    <ul className="divide-y divide-pearl/8 border-t border-pearl/8 lg:border-t-0">
                      {layer.capabilities.map((cap, ci) => (
                        <motion.li
                          key={cap.title}
                          className="group flex gap-5 py-5 first:lg:pt-0"
                          initial={reduced ? undefined : { opacity: 0, x: 16 }}
                          whileInView={
                            reduced ? undefined : { opacity: 1, x: 0 }
                          }
                          viewport={{ once: true, margin: '-40px' }}
                          transition={{
                            duration: 0.6,
                            delay: 0.15 + ci * 0.07,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <span className="mt-1.5 font-mono text-[10px] tracking-[0.18em] text-gold/75">
                            {String(ci + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <h4 className="text-[15px] font-medium text-pearl transition-colors duration-300 group-hover:text-gold">
                              {cap.title}
                            </h4>
                            <p className="mt-2 text-[13.5px] leading-[1.75] text-pearl-dim">
                              {cap.body}
                            </p>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </Container>
    </Section>
  )
}
