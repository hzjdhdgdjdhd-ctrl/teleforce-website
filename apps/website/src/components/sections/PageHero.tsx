import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Container, Eyebrow } from '@/components/ui/Section'

interface PageHeroProps {
  eyebrow: string
  index?: string
  title: ReactNode
  lede: ReactNode
  /** Optional right-hand slot — a definition list, a visual, a note. */
  aside?: ReactNode
}

/** Shared masthead for every interior page. */
export default function PageHero({
  eyebrow,
  index,
  title,
  lede,
  aside,
}: PageHeroProps) {
  const reduced = useReducedMotion()

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.8,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        }

  return (
    <section className="relative isolate overflow-hidden border-b border-pearl/8 pt-[132px] lg:pt-[164px]">
      <div
        className="mesh-backdrop pointer-events-none absolute inset-0 -z-20 mask-fade-b opacity-45"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[60vh] bg-[radial-gradient(60%_70%_at_30%_0%,rgba(18,58,99,0.45),transparent_70%)]"
        aria-hidden="true"
      />

      <Container>
        <div className="grid gap-12 pb-20 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20 lg:pb-28">
          <div>
            <motion.div {...rise(0.05)}>
              <Eyebrow index={index}>{eyebrow}</Eyebrow>
            </motion.div>

            <motion.h1
              className="mt-7 max-w-3xl text-[clamp(2.1rem,5vw,3.9rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-gradient-pearl"
              {...rise(0.14)}
            >
              {title}
            </motion.h1>

            <motion.div
              className="mt-8 max-w-2xl text-[15.5px] leading-[1.85] text-pearl-dim md:text-[16.5px]"
              {...rise(0.24)}
            >
              {lede}
            </motion.div>
          </div>

          {aside && (
            <motion.div className="lg:pt-4" {...rise(0.34)}>
              {aside}
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  )
}
