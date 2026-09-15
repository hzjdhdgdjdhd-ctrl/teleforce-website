import PageHero from '@/components/sections/PageHero'
import CtaBand from '@/components/sections/CtaBand'
import HumanNetwork from '@/components/visuals/HumanNetwork'
import { Container, Section, Eyebrow } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { Card } from '@/components/ui/Card'
import { teamModels, podRoles } from '@/data/teams'
import { engagement } from '@/data/services'
import { coverage } from '@/config/company'
import { useSeo } from '@/hooks/useSeo'

export default function Teams() {
  useSeo(
    'Dedicated Teams',
    'Dedicated, managed and extended team models staffed by named people — trained on your systems, supervised by team leaders and independently quality reviewed.',
  )

  return (
    <>
      <PageHero
        eyebrow="Dedicated Teams"
        index="03"
        title="You should be able to name the people doing your work."
        lede={
          <>
            <p>
              A dedicated team is the difference between outsourcing a process
              and outsourcing responsibility for it. Ours are staffed by named
              individuals who stay on your account, learn your business and
              carry that knowledge forward instead of resetting every quarter.
            </p>
            <p className="mt-5">
              You approve the hiring profile. You see the quality scores. You
              have direct access to the team leader.
            </p>
          </>
        }
        aside={
          <Card className="p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
              Coverage
            </p>
            <dl className="mt-5 space-y-4">
              {[
                ['UK hours', coverage.ukHours],
                ['Local hours', coverage.istHours],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint">
                    {term}
                  </dt>
                  <dd className="mt-1.5 text-[14px] text-pearl">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 border-t border-pearl/10 pt-5 text-[12.5px] leading-relaxed text-pearl-faint">
              {coverage.note}
            </p>
          </Card>
        }
      />

      {/* ---- Team models ---- */}
      <Section>
        <Container>
          <Reveal>
            <Eyebrow index="01">Team Models</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-6 max-w-2xl text-[clamp(1.8rem,3.6vw,2.7rem)] leading-[1.1] text-gradient-pearl">
              Three ways to structure a team.
            </h2>
          </Reveal>

          <div className="mt-14 space-y-px bg-pearl/8">
            {teamModels.map((model, i) => (
              <Reveal key={model.id} delay={i * 0.06}>
                <article
                  id={model.id}
                  className="group scroll-mt-28 bg-navy-700 p-8 transition-colors duration-500 hover:bg-exec-700/30 md:p-11"
                >
                  <div className="grid gap-8 lg:grid-cols-[0.4fr_0.6fr] lg:gap-16">
                    <div>
                      <span className="font-mono text-[11px] tracking-[0.22em] text-gold/75">
                        {model.index}
                      </span>
                      <h3 className="mt-5 text-[clamp(1.4rem,2.4vw,1.9rem)] leading-tight text-pearl transition-colors duration-500 group-hover:text-gold">
                        {model.name}
                      </h3>
                      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold/75">
                        {model.forWhom}
                      </p>
                    </div>

                    <div>
                      <p className="text-[14.5px] leading-[1.8] text-pearl-dim">
                        {model.description}
                      </p>
                      <ul className="mt-7 grid gap-3 border-t border-pearl/10 pt-7 sm:grid-cols-2">
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
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ---- Pod composition ---- */}
      <Section className="border-t border-pearl/8">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <Reveal>
                <Eyebrow index="02">Pod Composition</Eyebrow>
              </Reveal>
              <Reveal delay={0.06}>
                <h2 className="mt-6 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.1] text-gradient-pearl">
                  Who is actually in the room.
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-7 max-w-md text-[15px] leading-[1.8] text-pearl-dim">
                  A delivery pod is more than agents. Supervision, independent
                  quality review, training and workforce planning are part of
                  the structure — not overhead we add later when something goes
                  wrong.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <p className="mt-6 max-w-md text-[13.5px] leading-[1.75] text-pearl-faint">
                  Exact pod shape and ratios are agreed per engagement against
                  the volume and complexity of the work.
                </p>
              </Reveal>
            </div>

            <ul className="grid gap-px bg-pearl/8 sm:grid-cols-2">
              {podRoles.map((role, i) => (
                <Reveal key={role.title} index={i % 2} as="li" className="h-full">
                  <div className="group flex h-full flex-col bg-obsidian p-7">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-gold/75">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-5 text-[16px] font-medium text-pearl transition-colors duration-300 group-hover:text-gold">
                      {role.title}
                    </h3>
                    <p className="mt-3 text-[13.5px] leading-[1.75] text-pearl-dim">
                      {role.responsibility}
                    </p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* ---- Network visual band ---- */}
      <Section className="border-t border-pearl/8 !py-0">
        <Container>
          <div className="py-16">
            <Reveal>
              <p className="mx-auto max-w-2xl text-center text-[clamp(1.2rem,2.4vw,1.75rem)] leading-[1.45] text-pearl/85">
                Every line on this diagram is a working relationship between two
                people. That is the entire product.
              </p>
            </Reveal>
            <HumanNetwork className="mx-auto mt-10 h-auto w-full max-w-[1000px]" />
          </div>
        </Container>
      </Section>

      {/* ---- Governance ---- */}
      <Section id="engagement" className="scroll-mt-24 border-t border-pearl/8">
        <Container>
          <Reveal>
            <Eyebrow index="03">Governance</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-6 max-w-2xl text-[clamp(1.8rem,3.6vw,2.7rem)] leading-[1.1] text-gradient-pearl">
              How a team is stood up and kept honest.
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

          <Reveal delay={0.1}>
            <div className="panel mt-14 p-9 md:p-11">
              <h3 className="text-[17px] text-pearl">
                What you receive during steady state
              </h3>
              <ul className="mt-7 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  'Agreed operational reporting on a fixed cadence',
                  'Independent quality scores against agreed criteria',
                  'A named escalation contact and route',
                  'A standing improvement backlog with owners',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[13.5px] leading-relaxed text-pearl-dim"
                  >
                    <span
                      className="mt-[7px] h-1 w-1 shrink-0 bg-gold"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </Section>

      <CtaBand />
    </>
  )
}
