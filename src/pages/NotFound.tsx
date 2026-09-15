import { Container } from '@/components/ui/Section'
import { ButtonLink } from '@/components/ui/Button'
import { useSeo } from '@/hooks/useSeo'

export default function NotFound() {
  useSeo('Page not found', 'The page you requested does not exist.')

  return (
    <section className="relative isolate flex min-h-[72vh] items-center overflow-hidden pt-[132px]">
      <div
        className="mesh-backdrop pointer-events-none absolute inset-0 -z-10 mask-fade-radial opacity-45"
        aria-hidden="true"
      />
      <Container>
        <div className="max-w-xl py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
            Error 404
          </p>
          <h1 className="mt-7 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.06] text-gradient-pearl">
            That page does not exist.
          </h1>
          <p className="mt-7 text-[15px] leading-[1.8] text-pearl-dim">
            The address may have changed, or the link that brought you here may
            be out of date.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink to="/" variant="primary">
              Return home
            </ButtonLink>
            <ButtonLink to="/contact" variant="secondary">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
