import { Link } from 'react-router-dom'
import { Logo } from '@/assets/Logo'
import { Container } from '@/components/ui/Section'
import { company, formattedAddress } from '@/config/company'
import { services } from '@/data/services'

const columns = [
  {
    heading: 'Services',
    links: services.map((s) => ({
      label: s.title,
      to: `/services#${s.id}`,
    })),
  },
  {
    heading: 'Capability',
    links: [
      { label: 'Front End', to: '/technology#frontend' },
      { label: 'Back End', to: '/technology#backend' },
      { label: 'Dedicated Teams', to: '/teams' },
      { label: 'Engagement Model', to: '/teams#engagement' },
    ],
  },
  {
    heading: 'Governance',
    links: [
      { label: 'Data Protection', to: '/data-protection' },
      { label: 'Security Measures', to: '/data-protection#measures' },
      { label: 'Data Subject Rights', to: '/data-protection#rights' },
      { label: 'Company Information', to: '/company' },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-pearl/10 bg-obsidian-900">
      {/* Gold hairline capping the footer */}
      <div className="hairline" aria-hidden="true" />

      <Container>
        {/* ---- Main grid ---- */}
        <div className="grid gap-12 py-16 md:py-20 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          {/* Brand block */}
          <div className="max-w-sm">
            <Logo variant="reversed" className="h-12 w-auto" />

            <p className="mt-7 text-[14px] leading-[1.75] text-pearl-dim">
              Human-powered business operations for {company.primaryMarket}{' '}
              organisations. People create trust. Technology enables delivery.
              Process ensures quality.
            </p>

            <div className="mt-8 space-y-4 border-t border-pearl/8 pt-7">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
                  Registered Office
                </p>
                <address className="mt-2.5 text-[13px] not-italic leading-relaxed text-pearl-dim">
                  {company.registeredOffice.line1}
                  <br />
                  {company.registeredOffice.line2}
                  <br />
                  {company.registeredOffice.city},{' '}
                  {company.registeredOffice.region}{' '}
                  {company.registeredOffice.postcode}
                  <br />
                  {company.registeredOffice.country}
                </address>
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
                  Enquiries
                </p>
                {company.publicEmail ? (
                  <a
                    href={`mailto:${company.publicEmail}`}
                    className="mt-2.5 inline-block text-[13px] text-pearl-dim underline-offset-4 transition-colors hover:text-gold hover:underline"
                  >
                    {company.publicEmail}
                  </a>
                ) : (
                  <Link
                    to="/contact"
                    className="mt-2.5 inline-block text-[13px] text-pearl-dim underline-offset-4 transition-colors hover:text-gold hover:underline"
                  >
                    Send an enquiry
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
                {col.heading}
              </h3>
              <ul className="mt-6 space-y-3.5">
                {col.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-2 text-[13.5px] text-pearl-dim transition-colors duration-300 hover:text-pearl"
                    >
                      <span className="h-px w-0 bg-gold transition-all duration-300 group-hover:w-3" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ---- Statutory strip ---- */}
        <div className="border-t border-pearl/8 py-8">
          <dl className="grid gap-x-8 gap-y-5 font-mono text-[10.5px] uppercase tracking-[0.14em] sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Legal Entity', company.legalName],
              ['CIN', company.cin],
              ['Incorporated', company.incorporatedOn],
              ['Registrar', company.roc],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="text-pearl-faint">{term}</dt>
                <dd className="mt-1.5 normal-case tracking-normal text-pearl-dim">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ---- Base bar ---- */}
        <div className="flex flex-col gap-4 border-t border-pearl/8 py-7 text-[12px] text-pearl-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {company.legalName}. All rights reserved.
          </p>
          <p className="max-w-xl text-pearl-faint sm:text-right">
            Teleforce holds no certification claims on this site. Any
            accreditation will be published with its registration number.
          </p>
        </div>
      </Container>

      {/* Screen-reader-only full address for machine parsing */}
      <span className="sr-only">{formattedAddress}</span>
    </footer>
  )
}
