import PageHero from '@/components/sections/PageHero'
import TechSplit from '@/components/sections/TechSplit'
import CtaBand from '@/components/sections/CtaBand'
import { Container, Section, Eyebrow } from '@/components/ui/Section'
import Reveal from '@/components/ui/Reveal'
import { Card } from '@/components/ui/Card'
import { IconNodes, IconShieldCheck, IconUsers } from '@/components/ui/Icons'
import { useSeo } from '@/hooks/useSeo'

const principles = [
  {
    icon: IconUsers,
    title: 'Built for the operator, not the demo',
    body: 'Interfaces are designed against the task a trained person repeats two hundred times a day. If a screen saves three seconds, it pays for itself within a week.',
  },
  {
    icon: IconNodes,
    title: 'Integrate, do not replace',
    body: 'You keep your CRM, your telephony and your line-of-business systems. We connect to them. Replatforming your stack is not a precondition of working with us.',
  },
  {
    icon: IconShieldCheck,
    title: 'Protection designed in first',
    body: 'Access model, retention rules and logging are specified before features. Retrofitting data protection onto a working system is how organisations end up with neither.',
  },
]

export default function Technology() {
  useSeo(
    'Technology',
    'The front end our teams work in and the back end that keeps it accountable — integration, access control, workflow and reporting built around skilled people.',
  )

  return (
    <>
      <PageHero
        eyebrow="Technology"
        index="02"
        title="Technology enables delivery. It does not replace the people delivering."
        lede={
          <>
            <p>
              We build and maintain the software our teams work in, and we
              integrate with the systems you already run. Every technical
              decision on this page exists to serve one outcome: a trained
              person completing skilled work without fighting their tooling.
            </p>
            <p className="mt-5">
              Nothing here is autonomous. Software routes, records and reports.
              People decide.
            </p>
          </>
        }
        aside={
          <Card className="p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
              Position
            </p>
            <p className="mt-4 text-[14px] leading-[1.8] text-pearl-dim">
              Teleforce is not an AI-first company. We use software where it
              makes skilled work faster and more accurate, and we are explicit
              about where judgement stays with a person — which is everywhere
              that matters to your customer.
            </p>
          </Card>
        }
      />

      {/* ---- Principles ---- */}
      <Section>
        <Container>
          <Reveal>
            <Eyebrow index="01">Build Principles</Eyebrow>
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {principles.map((p, i) => {
              const Icon = p.icon
              return (
                <Reveal key={p.title} index={i}>
                  <Card interactive className="h-full p-8">
                    <span className="flex h-11 w-11 items-center justify-center border border-gold/25 bg-gold/[0.05] text-gold">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-7 text-[17px] leading-snug text-pearl">
                      {p.title}
                    </h3>
                    <p className="mt-3.5 text-[13.5px] leading-[1.8] text-pearl-dim">
                      {p.body}
                    </p>
                  </Card>
                </Reveal>
              )
            })}
          </div>
        </Container>
      </Section>

      <TechSplit standalone />

      {/* ---- Honest limits ---- */}
      <Section className="border-t border-pearl/8">
        <Container>
          <Reveal>
            <div className="panel mx-auto max-w-4xl p-10 md:p-14">
              <Eyebrow index="03">A note on automation</Eyebrow>
              <h2 className="mt-6 text-[clamp(1.6rem,3vw,2.3rem)] leading-[1.14] text-gradient-pearl">
                Where we deliberately keep a person in the loop.
              </h2>
              <div className="mt-8 space-y-5 text-[14.5px] leading-[1.85] text-pearl-dim">
                <p>
                  Automation is appropriate for deterministic, high-volume,
                  low-consequence steps: moving a validated record, generating a
                  scheduled report, flagging a threshold breach. We use it there
                  and we tell you where we have used it.
                </p>
                <p>
                  It is not appropriate for judgement under uncertainty — a
                  complaint that has not been worded clearly, an exception that
                  may or may not qualify, a customer who is upset and needs to be
                  heard before they are processed. Those stay with a trained
                  person, permanently and by design.
                </p>
                <p className="border-l-2 border-gold/60 pl-6 text-pearl/90">
                  If a supplier tells you their system handles all of that
                  without human oversight, ask them who is accountable when it is
                  wrong. The answer is the point.
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      <CtaBand />
    </>
  )
}
