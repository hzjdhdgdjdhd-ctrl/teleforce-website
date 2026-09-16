import Hero from '@/components/sections/Hero'
import Philosophy from '@/components/sections/Philosophy'
import Markets from '@/components/sections/Markets'
import TechSplit from '@/components/sections/TechSplit'
import CtaBand from '@/components/sections/CtaBand'
import { Container, Eyebrow, Section } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { ServiceCard, Card } from '@/components/ui/Card'
import { ButtonLink } from '@/components/ui/Button'
import { serviceIcons } from '@/components/ui/serviceIcons'
import { services, engagement } from '@/data/services'
import { teamModels } from '@/data/teams'
import { useSeo } from '@/hooks/useSeo'
import { company } from '@/config/company'

export default function Home() {
  useSeo(
    'Human Expertise. Secure Operations. Business Growth.',
    `${company.tradingName} is a human-powered business process outsourcing partner operating in the United Kingdom, the United States and Australia — dedicated teams, documented process and responsible data handling.`,
  )

  return (
    <>
      <Hero />
      <Philosophy />
      <Markets />

      {/* ---------------- Services ---------------- */}
      <Section id="services" className="border-t border-pearl/8">
        <Container>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Reveal>
                <Eyebrow index="03">Service Lines</Eyebrow>
              </Reveal>
              <Reveal delay={0.06}>
                <h2 className="mt-6 text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.08] text-gradient-pearl">
                  The work we take off your desk.
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-6 text-[15px] leading-[1.8] text-pearl-dim md:text-base">
                  Six operating lines, each staffed by named people trained on
                  your systems and your standards. Engagements usually start
                  with one and widen as trust is established.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.18} className="shrink-0">
              <ButtonLink to="/services" variant="secondary">
                All service detail
              </ButtonLink>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-px bg-pearl/8 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => {
              const Icon = serviceIcons[service.id]
              return (
                <Reveal key={service.id} index={i % 3} className="h-full">
                  <ServiceCard
                    index={service.index}
                    title={service.title}
                    summary={service.summary}
                    points={service.points}
                    to={`/services#${service.id}`}
                    icon={Icon ? <Icon size={21} /> : undefined}
                  />
                </Reveal>
              )
            })}
          </div>
        </Container>
      </Section>

      <TechSplit />

      {/* ---------------- Dedicated teams ---------------- */}
      <Section id="teams" className="border-t border-pearl/8">
        <Container>
          <div className="max-w-2xl">
            <Reveal>
              <Eyebrow index="05">Dedicated Teams</Eyebrow>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-6 text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.08] text-gradient-pearl">
                Named people. Not a shared pool.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 text-[15px] leading-[1.8] text-pearl-dim md:text-base">
                You should know who is doing your work. Every engagement is
                staffed by individuals you can name, whose training you can
                inspect and whose quality scores you receive.
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-6 md:mt-16 lg:grid-cols-3">
            {teamModels.map((model, i) => (
              <Reveal key={model.id} index={i}>
                <Card interactive className="flex h-full flex-col p-8">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-gold/75">
                    {model.index}
                  </span>
                  <h3 className="mt-6 text-xl text-pearl">{model.name}</h3>
                  <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold/75">
                    {model.forWhom}
                  </p>
                  <p className="mt-5 text-[14px] leading-[1.75] text-pearl-dim">
                    {model.description}
                  </p>
                  <ul className="mt-auto space-y-2.5 border-t border-pearl/8 pt-7">
                    {model.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-[13px] leading-relaxed text-pearl-faint"
                      >
                        <span
                          className="mt-[7px] h-1 w-1 shrink-0 bg-gold/70"
                          aria-hidden="true"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10">
              <ButtonLink to="/teams" variant="ghost">
                See how a team is built and governed
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ---------------- Engagement model ---------------- */}
      <Section id="engagement" className="border-t border-pearl/8">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Reveal>
                <Eyebrow index="06">Engagement Model</Eyebrow>
              </Reveal>
              <Reveal delay={0.06}>
                <h2 className="mt-6 text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.1] text-gradient-pearl">
                  How an engagement actually starts.
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-7 max-w-md text-[15px] leading-[1.8] text-pearl-dim">
                  No transformation programme, no eighteen-month roadmap. We
                  prove the work on a small scale first, then grow the team
                  around what demonstrably worked.
                </p>
              </Reveal>
            </div>

            <ol className="relative border-l border-pearl/12 pl-8 lg:pl-12">
              {engagement.map((stage, i) => (
                <Reveal key={stage.index} index={i} as="li" className="relative pb-11 last:pb-0">
                  <span
                    className="absolute -left-[33px] top-1.5 flex h-2.5 w-2.5 items-center justify-center lg:-left-[49px]"
                    aria-hidden="true"
                  >
                    <span className="h-2.5 w-2.5 rotate-45 border border-gold/70 bg-obsidian" />
                  </span>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold/75">
                    Stage {stage.index}
                  </p>
                  <h3 className="mt-3 text-lg text-pearl">{stage.title}</h3>
                  <p className="mt-2.5 max-w-xl text-[14px] leading-[1.75] text-pearl-dim">
                    {stage.body}
                  </p>
                </Reveal>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* ---------------- Data protection teaser ---------------- */}
      <Section className="border-t border-pearl/8">
        <Container>
          <Reveal>
            <div className="panel relative overflow-hidden p-10 md:p-14 lg:p-16">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_140%_at_85%_10%,rgba(18,58,99,0.45),transparent_65%)]"
                aria-hidden="true"
              />
              <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
                <div>
                  <Eyebrow index="07">Data Protection</Eyebrow>
                  <h2 className="mt-6 text-[clamp(1.7rem,3.2vw,2.5rem)] leading-[1.12] text-gradient-pearl">
                    Handled carefully, described honestly.
                  </h2>
                  <p className="mt-6 max-w-xl text-[15px] leading-[1.8] text-pearl-dim">
                    Teleforce operates with processes designed around applicable{' '}
                    {company.marketShort} Data Protection Act requirements and
                    responsible handling of information. We publish what we
                    actually do — and we do not claim certifications we do not
                    hold.
                  </p>
                  <div className="mt-9">
                    <ButtonLink to="/data-protection" variant="secondary">
                      Read our approach
                    </ButtonLink>
                  </div>
                </div>

                <ul className="space-y-px self-center bg-pearl/8">
                  {[
                    'Client instructions govern all processing',
                    'Least-privilege access, reviewed not accumulated',
                    'Documented, inspectable procedures',
                    'No certification claimed without a reference number',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-4 bg-navy-700 px-6 py-5 text-[13.5px] leading-relaxed text-pearl-dim"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="mt-0.5 shrink-0 text-gold"
                        aria-hidden="true"
                      >
                        <path
                          d="m3 8.4 3.2 3.2L13 5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <CtaBand />
    </>
  )
}
