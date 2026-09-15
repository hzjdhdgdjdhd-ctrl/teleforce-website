/**
 * The technology capability shown in the Frontend + Backend section.
 *
 * CONFIRMED by the business on 15 September 2026.
 *
 * This section remains the easiest place on the site to over-claim: keep it to
 * what your engineers genuinely build and support.
 */

export interface TechLayer {
  id: string
  index: string
  label: string
  title: string
  lede: string
  capabilities: readonly { title: string; body: string }[]
  stack: readonly string[]
}

export const frontend: TechLayer = {
  id: 'frontend',
  index: '01',
  label: 'Front End',
  title: 'The surfaces people actually use',
  lede: 'Everything your customers, your staff and our agents touch. Built to be fast, accessible and unambiguous — because every second of hesitation in an interface becomes a second of handling time.',
  capabilities: [
    {
      title: 'Agent workspaces',
      body: 'Consolidated screens that put the customer record, the script and the disposition in one place, so agents stop alt-tabbing between four systems.',
    },
    {
      title: 'Client portals',
      body: 'Secure views into the work we do for you — volumes, status, exceptions and quality results, available without waiting for a monthly deck.',
    },
    {
      title: 'Operational dashboards',
      body: 'Live queue, coverage and SLA views for team leaders, designed to be read at a glance from across a floor.',
    },
    {
      title: 'Accessible web interfaces',
      body: 'Responsive, keyboard-navigable interfaces built against WCAG guidance, tested on the browsers and devices your users actually run.',
    },
  ],
  stack: [
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Framer Motion',
    'Vite',
    'Design systems',
    'WCAG 2.2 AA guidance',
  ],
}

export const backend: TechLayer = {
  id: 'backend',
  index: '02',
  label: 'Back End',
  title: 'The machinery that keeps it honest',
  lede: 'Integration, storage, access control and reporting. The back end is where data protection is either designed in or permanently missing — so it is the part we specify first.',
  capabilities: [
    {
      title: 'System integration',
      body: 'Connecting to the CRM, telephony and line-of-business systems you already run, rather than asking you to migrate to ours.',
    },
    {
      title: 'Workflow and queueing',
      body: 'Routing work to the right person with the right skills, holding exceptions for review and preventing silent drop-through.',
    },
    {
      title: 'Access control',
      body: 'Role-based permissions, least-privilege defaults and logged access, so it is always answerable who could see what, and when.',
    },
    {
      title: 'Reporting pipelines',
      body: 'Scheduled, reproducible reporting from a single source of truth — the same numbers in your dashboard and in your governance pack.',
    },
  ],
  stack: [
    'Node.js',
    'REST & GraphQL APIs',
    'PostgreSQL',
    'Role-based access control',
    'Audit logging',
    'Encrypted transport (TLS)',
    'Scheduled reporting jobs',
  ],
}

export const techLayers = [frontend, backend] as const
