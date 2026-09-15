import PageHero from '@/components/sections/PageHero'
import ContactForm from '@/components/sections/ContactForm'
import { Container, Section } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { Card } from '@/components/ui/Card'
import { company } from '@/config/company'
import { useSeo } from '@/hooks/useSeo'

export default function Contact() {
  useSeo(
    'Contact',
    `Start a conversation with ${company.tradingName} about the business process you want supported.`,
  )

  return (
    <>
      <PageHero
        eyebrow="Contact"
        index="05"
        title="Tell us which process is costing you the most time."
        lede={
          <>
            <p>
              We will map it with you, tell you honestly whether we are the right
              partner for it, and set out what a pilot would involve. If we are
              not the right fit, we will say so in the first conversation rather
              than the fourth.
            </p>
          </>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
            {/* Form */}
            <Reveal>
              <ContactForm />
            </Reveal>

            {/* Sidebar */}
            <div className="space-y-6">
              <Reveal delay={0.08}>
                <Card className="p-8">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
                    Direct
                  </h2>
                  <a
                    href={`mailto:${company.email}`}
                    className="mt-4 block text-[15px] text-pearl underline-offset-4 transition-colors hover:text-gold hover:underline"
                  >
                    {company.email}
                  </a>
                  {company.phone && (
                    <a
                      href={`tel:${company.phone.replace(/\s/g, '')}`}
                      className="mt-2 block text-[15px] text-pearl underline-offset-4 transition-colors hover:text-gold hover:underline"
                    >
                      {company.phone}
                    </a>
                  )}
                </Card>
              </Reveal>

              <Reveal delay={0.14}>
                <Card className="p-8">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
                    Registered Office
                  </h2>
                  <address className="mt-4 text-[14px] not-italic leading-[1.8] text-pearl-dim">
                    {company.legalName}
                    <br />
                    {company.registeredOffice.line1}
                    <br />
                    {company.registeredOffice.line2}
                    <br />
                    {company.registeredOffice.city}
                    <br />
                    {company.registeredOffice.region}{' '}
                    {company.registeredOffice.postcode}
                    <br />
                    {company.registeredOffice.country}
                  </address>
                </Card>
              </Reveal>

              <Reveal delay={0.2}>
                <Card className="p-8">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
                    What happens next
                  </h2>
                  <ol className="mt-5 space-y-4">
                    {[
                      'We read your enquiry and reply directly — no automated sequence.',
                      'A short call to understand the process and its constraints.',
                      'A written outline of scope, team shape and what a pilot would cost.',
                    ].map((step, i) => (
                      <li key={step} className="flex gap-4">
                        <span className="font-mono text-[10px] tracking-[0.18em] text-gold/75">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[13.5px] leading-[1.7] text-pearl-dim">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
