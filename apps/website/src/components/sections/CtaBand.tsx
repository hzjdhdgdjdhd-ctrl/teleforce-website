import { ButtonLink } from '@/components/ui/Button'
import { Container, Eyebrow } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'

/** Closing call to action used at the foot of every page. */
export default function CtaBand() {
  return (
    <section className="relative isolate overflow-hidden border-t border-pearl/10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_120%_at_50%_100%,rgba(18,58,99,0.55),transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="grid-backdrop pointer-events-none absolute inset-0 -z-10 mask-fade-b opacity-50"
        aria-hidden="true"
      />

      <Container>
        <div className="py-24 text-center md:py-32">
          <Reveal>
            <Eyebrow className="justify-center">Next step</Eyebrow>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="mx-auto mt-7 max-w-3xl text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.08] text-gradient-pearl">
              Tell us which process is costing you the most time.
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mx-auto mt-7 max-w-xl text-[15.5px] leading-[1.8] text-pearl-dim">
              We will map it with you, tell you honestly whether we are the
              right partner for it, and set out what a pilot would involve. No
              obligation and no pressure.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-11 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink to="/contact" variant="primary">
                Start a conversation
              </ButtonLink>
              <ButtonLink to="/services" variant="secondary">
                See what we run
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
