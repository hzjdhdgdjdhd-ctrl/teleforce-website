import PageHero from '@/components/sections/PageHero'
import CtaBand from '@/components/sections/CtaBand'
import { Container, Section, Eyebrow } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { Card } from '@/components/ui/Card'
import { serviceIcons } from '@/components/ui/serviceIcons'
import { services, engagement } from '@/data/services'
import { useSeo } from '@/hooks/useSeo'
import { company } from '@/config/company'

export default function Services() {
  useSeo(
    'Services',
    'Customer operations, back-office processing, sales support, finance administration, technical support and quality assurance — delivered by trained, named teams.',
  )

  return (
    <>
      <PageHero
        eyebrow="Service Lines"
        index="01"
        title="Operations you can hand over without losing sight of them."
        lede={
          <p>
            Six service lines, each run by people trained on your systems and
            measured against criteria you agree in advance. Most clients start
            with a single process and widen the remit once the quality record
            speaks for itself.
          </p>
        }
        aside={
          <dl className="divide-y divide-pearl/10 border-y border-pearl/10">
            {[
              ['Service lines', '06'],
              ['Delivery centre', company.deliveryCentre],
              ['Markets served', company.marketsShort],
              ['Team models', 'Dedicated · Managed · Extended'],
            ].map(([term, value]) => (
              <div key={term} className="flex items-baseline justify-between gap-6 py-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
                  {term}
                </dt>
                <dd className="text-right text-[13px] text-pearl-dim">{value}</dd>
              </div>
            ))}
          </dl>
        }
      />

      {/* ---- Full service detail ---- */}
      <Section>
        <Container>
          <div className="space-y-px bg-pearl/8">
            {services.map((service, i) => {
              const Icon = serviceIcons[service.id]
              return (
                <Reveal key={service.id} index={0} delay={i * 0.04}>
                  <article
                    id={service.id}
                    className="group scroll-mt-28 bg-obsidian px-0 py-12 transition-colors duration-500 md:px-8 lg:px-10"
                  >
                    <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16">
                      <div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-[11px] tracking-[0.22em] text-gold/75">
                            {service.index}
                          </span>
                          {Icon && (
                            <span className="flex h-10 w-10 items-center justify-center border border-pearl/12 text-exec-300 transition-colors duration-500 group-hover:border-gold/40 group-hover:text-gold">
                              <Icon size={19} />
                            </span>
                          )}
                        </div>
                        <h2 className="mt-6 text-[clamp(1.5rem,2.6vw,2.05rem)] leading-tight text-pearl">
                          {service.title}
                        </h2>
                        <p className="mt-5 max-w-lg text-[14.5px] leading-[1.8] text-pearl-dim">
                          {service.summary}
                        </p>
                      </div>

                      <div className="lg:pt-2">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pearl-faint">
                          Typical scope
                        </p>
                        <ul className="mt-5 grid gap-px bg-pearl/8 sm:grid-cols-2">
                          {service.points.map((point) => (
                            <li
                              key={point}
                              className="flex items-start gap-3.5 bg-navy-700 px-5 py-4 text-[13.5px] leading-relaxed text-pearl-dim"
                            >
                              <span
                                className="mt-[7px] h-1 w-1 shrink-0 bg-gold"
                                aria-hidden="true"
                              />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </Container>
      </Section>

      {/* ---- What we don't do ---- */}
      <Section className="border-t border-pearl/8">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <Reveal>
                <Eyebrow index="02">Scope Boundaries</Eyebrow>
              </Reveal>
              <Reveal delay={0.06}>
                <h2 className="mt-6 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.1] text-gradient-pearl">
                  What we will tell you we cannot do.
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-7 max-w-md text-[15px] leading-[1.8] text-pearl-dim">
                  A supplier who says yes to everything in the first meeting
                  will say sorry to everything in the sixth. These are the
                  limits we state up front.
                </p>
              </Reveal>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: 'We do not sell headcount alone',
                  body: 'If a process is undocumented and unowned on your side, adding our people to it will not fix it. We will help you define it first, or decline the work.',
                },
                {
                  title: 'We do not claim regulated advice',
                  body: 'We provide operational support. We do not give legal, financial or regulated advice to your customers, and our agents are briefed accordingly.',
                },
                {
                  title: 'We do not promise what we cannot staff',
                  body: 'Coverage commitments are made against a roster we can actually build. If the hours you need are not viable, we will say so before contract.',
                },
                {
                  title: 'We do not present certifications we lack',
                  body: 'Our data protection page states our practices, not badges. Any accreditation we obtain will be published with its registration number.',
                },
              ].map((item, i) => (
                <Reveal key={item.title} index={i}>
                  <Card className="h-full p-7">
                    <h3 className="text-[15px] font-medium leading-snug text-pearl">
                      {item.title}
                    </h3>
                    <p className="mt-3.5 text-[13.5px] leading-[1.75] text-pearl-dim">
                      {item.body}
                    </p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* ---- Engagement stages ---- */}
      <Section className="border-t border-pearl/8">
        <Container>
          <Reveal>
            <Eyebrow index="03">Engagement</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-6 max-w-2xl text-[clamp(1.8rem,3.6vw,2.7rem)] leading-[1.1] text-gradient-pearl">
              Five stages from first call to steady state.
            </h2>
          </Reveal>

          <ol className="mt-14 grid gap-px bg-pearl/8 md:grid-cols-5">
            {engagement.map((stage, i) => (
              <Reveal key={stage.index} index={i} as="li" className="h-full">
                <div className="flex h-full flex-col bg-navy-700 p-7">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-gold/75">
                    {stage.index}
                  </span>
                  <h3 className="mt-5 text-[17px] text-pearl">{stage.title}</h3>
                  <p className="mt-3 text-[13px] leading-[1.75] text-pearl-dim">
                    {stage.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      <CtaBand />
    </>
  )
}
