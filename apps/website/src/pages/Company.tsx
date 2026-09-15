import PageHero from '@/components/sections/PageHero'
import CtaBand from '@/components/sections/CtaBand'
import { Container, Section, Eyebrow } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { Card } from '@/components/ui/Card'
import { company } from '@/config/company'
import { pillars } from '@/data/services'
import { useSeo } from '@/hooks/useSeo'

/** Statutory record — every value here comes from the MCA public register. */
const record: Array<[string, string]> = [
  ['Legal name', company.legalName],
  ['Corporate Identification Number', company.cin],
  ['Registration number', company.registrationNumber],
  ['Date of incorporation', company.incorporatedOn],
  ['Registrar', company.roc],
  ['Class of company', company.companyClass],
  ['Company category', company.companyCategory],
  ['Activity (NIC)', `${company.nicCode} — ${company.nicDescription}`],
  ['Status', company.status],
]

export default function Company() {
  useSeo(
    'Company Information',
    `Statutory and corporate information for ${company.legalName}, CIN ${company.cin}.`,
  )

  return (
    <>
      <PageHero
        eyebrow="Company"
        index="06"
        title="Who you would actually be contracting with."
        lede={
          <>
            <p>
              Due diligence should not require a records search. Everything on
              this page is drawn from the public corporate register and can be
              verified independently before you speak to us.
            </p>
          </>
        }
        aside={
          <Card className="p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
              Status
            </p>
            <p className="mt-4 flex items-center gap-3 text-[15px] text-pearl">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              {company.status}
            </p>
            <p className="mt-5 border-t border-pearl/10 pt-5 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-pearl-faint">
              CIN {company.cin}
            </p>
          </Card>
        }
      />

      {/* ---- Statutory record ---- */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Reveal>
                <Eyebrow index="01">Statutory Record</Eyebrow>
              </Reveal>
              <Reveal delay={0.06}>
                <h2 className="mt-6 text-[clamp(1.7rem,3.2vw,2.4rem)] leading-[1.12] text-gradient-pearl">
                  The corporate facts.
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-7 max-w-md text-[14.5px] leading-[1.8] text-pearl-dim">
                  Teleforce is a private limited company incorporated in India
                  and registered with the Registrar of Companies, Kolkata.
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.08}>
              <dl className="divide-y divide-pearl/10 border-y border-pearl/10">
                {record.map(([term, value]) => (
                  <div
                    key={term}
                    className="grid gap-2 py-5 sm:grid-cols-[0.8fr_1.2fr] sm:gap-8"
                  >
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-pearl-faint">
                      {term}
                    </dt>
                    <dd className="text-[14px] leading-relaxed text-pearl">
                      {value}
                    </dd>
                  </div>
                ))}

                <div className="grid gap-2 py-5 sm:grid-cols-[0.8fr_1.2fr] sm:gap-8">
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-pearl-faint">
                    Directors
                  </dt>
                  <dd className="text-[14px] leading-relaxed text-pearl">
                    {company.directors.join(' · ')}
                  </dd>
                </div>

                <div className="grid gap-2 py-5 sm:grid-cols-[0.8fr_1.2fr] sm:gap-8">
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-pearl-faint">
                    Registered office
                  </dt>
                  <dd className="text-[14px] leading-[1.8] text-pearl">
                    {company.registeredOffice.line1}, {company.registeredOffice.line2}
                    <br />
                    {company.registeredOffice.city}, {company.registeredOffice.region}{' '}
                    {company.registeredOffice.postcode}, {company.registeredOffice.country}
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ---- Philosophy restated ---- */}
      <Section className="border-t border-pearl/8">
        <Container>
          <Reveal>
            <Eyebrow index="02">How we operate</Eyebrow>
          </Reveal>

          <div className="mt-12 grid gap-px bg-pearl/8 lg:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.index} index={i} className="h-full">
                <div className="flex h-full flex-col bg-obsidian p-8 lg:p-10">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-gold/75">
                    {p.index}
                  </span>
                  <h3 className="mt-6 text-[1.3rem] leading-snug text-pearl">
                    {p.statement}
                  </h3>
                  <p className="mt-4 text-[13.5px] leading-[1.8] text-pearl-dim">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand />
    </>
  )
}
