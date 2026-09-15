import PageHero from '@/components/sections/PageHero'
import CtaBand from '@/components/sections/CtaBand'
import { Container, Section, Eyebrow } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { Card } from '@/components/ui/Card'
import { IconShieldCheck } from '@/components/ui/Icons'
import {
  principles,
  measures,
  dataSubjectRights,
} from '@/data/dataProtection'
import { company } from '@/config/company'
import { useSeo } from '@/hooks/useSeo'

export default function DataProtection() {
  useSeo(
    'Data Protection',
    `${company.tradingName} operates with processes designed around applicable UK Data Protection Act requirements and responsible handling of information.`,
  )

  return (
    <>
      <PageHero
        eyebrow="Data Protection"
        index="04"
        title="Information handled carefully. Described honestly."
        lede={
          <>
            <p className="text-pearl">
              Teleforce operates with processes designed around applicable UK
              Data Protection Act requirements and responsible handling of
              information.
            </p>
            <p className="mt-5">
              This page sets out how we actually work with data: what we do,
              what we ask of clients, and — just as importantly — what we do not
              claim.
            </p>
          </>
        }
        aside={
          <Card className="p-7">
            <span className="flex h-11 w-11 items-center justify-center border border-gold/25 bg-gold/[0.05] text-gold">
              <IconShieldCheck size={20} />
            </span>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
              Data protection contact
            </p>
            <a
              href={`mailto:${company.dataProtectionEmail}`}
              className="mt-3 block text-[14px] text-pearl underline-offset-4 transition-colors hover:text-gold hover:underline"
            >
              {company.dataProtectionEmail}
            </a>
            <p className="mt-5 border-t border-pearl/10 pt-5 text-[12.5px] leading-relaxed text-pearl-faint">
              Data protection enquiries relating to a specific client engagement
              are routed to that client, who is the controller for their data.
            </p>
          </Card>
        }
      />

      {/* ---------- The honest statement ---------- */}
      <Section>
        <Container>
          <Reveal>
            <div className="panel relative overflow-hidden p-10 md:p-14 lg:p-16">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_130%_at_15%_0%,rgba(18,58,99,0.4),transparent_62%)]"
                aria-hidden="true"
              />
              <div className="relative grid gap-12 lg:grid-cols-2 lg:gap-16">
                <div>
                  <Eyebrow index="01">What we claim</Eyebrow>
                  <p className="mt-7 text-[15px] leading-[1.85] text-pearl-dim">
                    Our processes are designed around the requirements that
                    apply to handling personal data for {company.primaryMarket}{' '}
                    organisations, and around the straightforward principle that
                    information belonging to someone else should be treated with
                    care.
                  </p>
                  <ul className="mt-8 space-y-4">
                    {[
                      'We process client data on documented client instructions.',
                      'We keep access narrow and reviewable.',
                      'We document our procedures so they can be inspected.',
                      'We return or delete data at the end of the agreed period.',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3.5 text-[14px] leading-relaxed text-pearl-dim"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="mt-1 shrink-0 text-gold"
                          aria-hidden="true"
                        >
                          <path
                            d="m3 8.4 3.2 3.2L13 5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-pearl/10 pt-10 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
                  <Eyebrow index="02">What we do not claim</Eyebrow>
                  <p className="mt-7 text-[15px] leading-[1.85] text-pearl-dim">
                    Certification language is easy to print and hard to
                    substantiate. We would rather you trusted the parts of this
                    page that are verifiable, so we are explicit about the parts
                    that do not exist.
                  </p>
                  <ul className="mt-8 space-y-4">
                    {[
                      'We do not claim ISO 27001 or any other security certification.',
                      'We do not claim a Cyber Essentials assessment.',
                      'We do not publish audit outcomes we have not undergone.',
                      'We do not describe ourselves as accredited by any body.',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3.5 text-[14px] leading-relaxed text-pearl-dim"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="mt-1 shrink-0 text-pearl-faint"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 4l8 8M12 4l-8 8"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-8 border-l-2 border-gold/60 pl-5 text-[13.5px] leading-relaxed text-pearl/85">
                    If Teleforce obtains a certification, it will appear on this
                    page with its registration number and expiry date — and not
                    a day before.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ---------- Principles ---------- */}
      <Section className="border-t border-pearl/8">
        <Container>
          <div className="max-w-2xl">
            <Reveal>
              <Eyebrow index="03">Operating Principles</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 text-[clamp(1.8rem,3.6vw,2.7rem)] leading-[1.1] text-gradient-pearl">
                Six principles we hold ourselves to.
              </h2>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-px bg-pearl/8 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((p, i) => (
              <Reveal key={p.index} index={i % 3} className="h-full">
                <div className="group flex h-full flex-col bg-obsidian p-8">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-gold/75">
                    {p.index}
                  </span>
                  <h3 className="mt-6 text-[17px] leading-snug text-pearl transition-colors duration-300 group-hover:text-gold">
                    {p.title}
                  </h3>
                  <p className="mt-3.5 text-[13.5px] leading-[1.8] text-pearl-dim">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---------- Measures ---------- */}
      <Section id="measures" className="scroll-mt-24 border-t border-pearl/8">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Reveal>
                <Eyebrow index="04">Safeguards</Eyebrow>
              </Reveal>
              <Reveal delay={0.06}>
                <h2 className="mt-6 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.1] text-gradient-pearl">
                  Organisational, technical and physical measures.
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-7 max-w-md text-[15px] leading-[1.8] text-pearl-dim">
                  These are the controls we operate. Where a client engagement
                  requires additional measures, those are specified in the
                  contract rather than assumed.
                </p>
              </Reveal>
            </div>

            <div className="space-y-px bg-pearl/8">
              {measures.map((group, i) => (
                <Reveal key={group.category} delay={i * 0.06}>
                  <div className="bg-navy-700 p-8 md:p-10">
                    <h3 className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-gold/80">
                      {group.category}
                    </h3>
                    <ul className="mt-6 grid gap-3.5 sm:grid-cols-2">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-[13.5px] leading-relaxed text-pearl-dim"
                        >
                          <span
                            className="mt-[7px] h-1 w-1 shrink-0 bg-gold/70"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------- International transfers ---------- */}
      <Section className="border-t border-pearl/8">
        <Container>
          <Reveal>
            <div className="panel mx-auto max-w-4xl p-10 md:p-14">
              <Eyebrow index="05">International Transfers</Eyebrow>
              <h2 className="mt-6 text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.14] text-gradient-pearl">
                Where your data is handled, stated plainly.
              </h2>
              <div className="mt-8 space-y-5 text-[14.5px] leading-[1.85] text-pearl-dim">
                <p>
                  Teleforce is incorporated in India and delivers from{' '}
                  {company.deliveryCentre}. Where we support a{' '}
                  {company.primaryMarket} organisation, personal data may
                  therefore be accessed and processed outside the{' '}
                  {company.primaryMarket}.
                </p>
                <p>
                  That is a material fact for any {company.marketShort} controller and we raise it early rather than burying it in an
                  annex. As controller, you determine the transfer mechanism
                  that applies to your data, and we complete, sign and operate
                  under whatever instrument you require — including your
                  standard data processing agreement.
                </p>
                <p>
                  We will also tell you, specifically, which roles in which
                  locations can access which categories of data, so you can
                  complete your own transfer risk assessment with real
                  information rather than assurances.
                </p>
                <p className="border-l-2 border-gold/60 pl-6 text-pearl/90">
                  If offshore access is not acceptable for a given dataset, say
                  so at the outset. We would rather scope around it than discover
                  the constraint after go-live.
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ---------- Data subject rights ---------- */}
      <Section id="rights" className="scroll-mt-24 border-t border-pearl/8">
        <Container>
          <div className="max-w-2xl">
            <Reveal>
              <Eyebrow index="06">Data Subject Rights</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 text-[clamp(1.8rem,3.6vw,2.7rem)] leading-[1.1] text-gradient-pearl">
                Supporting requests, not obstructing them.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 text-[15px] leading-[1.8] text-pearl-dim">
                Where we process personal data for a client, that client is the
                controller and owns the response to a data subject request. Our
                obligation is to make their response fast and accurate.
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-px bg-pearl/8 sm:grid-cols-2 lg:grid-cols-4">
            {dataSubjectRights.map((right, i) => (
              <Reveal key={right.title} index={i} className="h-full">
                <div className="flex h-full flex-col bg-navy-700 p-7">
                  <h3 className="text-[16px] font-medium text-pearl">
                    {right.title}
                  </h3>
                  <p className="mt-3.5 text-[13px] leading-[1.75] text-pearl-dim">
                    {right.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className="mt-10 max-w-3xl text-[13.5px] leading-[1.8] text-pearl-faint">
              If you believe your personal data has been handled improperly by
              Teleforce, contact us at{' '}
              <a
                href={`mailto:${company.dataProtectionEmail}`}
                className="text-pearl-dim underline underline-offset-4 transition-colors hover:text-gold"
              >
                {company.dataProtectionEmail}
              </a>
              . {company.marketShort} residents also retain the right to
              complain to the Information Commissioner's Office. Nothing on this
              page limits that right.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* ---------- Review note ---------- */}
      <Section className="border-t border-pearl/8 !pt-16">
        <Container>
          <Reveal>
            <div className="flex flex-col gap-4 border-y border-pearl/10 py-7 font-mono text-[11px] uppercase tracking-[0.16em] text-pearl-faint sm:flex-row sm:items-center sm:justify-between">
              <span>Statement of data handling practice</span>
              <span>
                Reviewed against engagement requirements · No certification
                claimed
              </span>
            </div>
          </Reveal>
        </Container>
      </Section>

      <CtaBand />
    </>
  )
}
