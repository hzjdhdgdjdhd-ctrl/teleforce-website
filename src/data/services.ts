/**
 * Service lines.
 *
 * CONFIRMED by the business on 15 September 2026: all six lines describe work Teleforce
 * actually staffs and delivers today.
 *
 * These are the first claims an enterprise buyer will ask you to evidence, so
 * if a line ever stops being true, change it here rather than leaving it to be
 * discovered in a procurement call.
 */

export interface Service {
  id: string
  index: string
  title: string
  summary: string
  /** One written line for the navigation mega-menu — never a truncated summary. */
  short: string
  points: readonly string[]
}

export const services: readonly Service[] = [
  {
    id: 'customer-operations',
    index: '01',
    title: 'Customer Operations',
    summary:
      'Trained agents handling inbound and outbound contact across voice, email and live chat — working to your tone of voice, your scripts and your escalation rules.',
    short: 'Voice, email and chat handled to your scripts and tone',
    points: [
      'Inbound enquiry and order handling',
      'Outbound follow-up and retention calling',
      'Email and live chat response management',
      'Complaint capture, logging and escalation',
    ],
  },
  {
    id: 'back-office',
    index: '02',
    title: 'Back-Office & Data Operations',
    summary:
      'The structured, high-volume work that quietly decides whether your front office functions — executed to a documented standard and checked before it reaches you.',
    short: 'High-volume processing, checked before it reaches you',
    points: [
      'Document processing and structured data entry',
      'Record validation, deduplication and CRM hygiene',
      'Reconciliation and exception handling',
      'Report preparation and scheduled distribution',
    ],
  },
  {
    id: 'sales-operations',
    index: '03',
    title: 'Sales & Lead Operations',
    summary:
      'Qualification and pipeline discipline handled by people who understand your proposition — so your closers spend their time closing.',
    short: 'Qualification and pipeline discipline, done properly',
    points: [
      'Lead qualification against your criteria',
      'Appointment setting and diary management',
      'Pipeline hygiene and CRM update discipline',
      'Renewal and re-engagement campaigns',
    ],
  },
  {
    id: 'finance-admin',
    index: '04',
    title: 'Finance & Administrative Support',
    summary:
      'Routine finance administration run as a controlled process, with segregation of duties and a clear audit trail on every task we touch.',
    short: 'Finance administration with a clear audit trail',
    points: [
      'Purchase and sales invoice processing',
      'Accounts payable and receivable administration',
      'Statement reconciliation support',
      'Credit control administration and chase cycles',
    ],
  },
  {
    id: 'technical-support',
    index: '05',
    title: 'Technical & Application Support',
    summary:
      'First-line support that resolves what it can and routes the rest accurately — measured on resolution quality, not just call length.',
    short: 'First-line support measured on resolution quality',
    points: [
      'L1 helpdesk and ticket triage',
      'Guided troubleshooting to documented runbooks',
      'Ticket classification and SLA monitoring',
      'Knowledge base authoring and upkeep',
    ],
  },
  {
    id: 'quality-assurance',
    index: '06',
    title: 'Quality & Process Assurance',
    summary:
      'An assurance layer that sits across every engagement — because a BPO that grades its own homework is worth exactly nothing to you.',
    short: 'Independent review across every engagement',
    points: [
      'Call and contact quality scoring',
      'Script and process adherence review',
      'Root-cause analysis on recurring defects',
      'Documented corrective actions with owners',
    ],
  },
]

/* ---------------------------------------------------------------- */

export interface Pillar {
  index: string
  title: string
  statement: string
  body: string
}

/** The three-line philosophy the whole company is organised around. */
export const pillars: readonly Pillar[] = [
  {
    index: '01',
    title: 'People',
    statement: 'People create trust.',
    body: 'Every account is staffed by named individuals who learn your business, not an anonymous queue. Trust is built by the same voices turning up, engagement after engagement — and it cannot be automated into existence.',
  },
  {
    index: '02',
    title: 'Technology',
    statement: 'Technology enables delivery.',
    body: 'We run modern tooling because it removes friction from skilled people: clean integrations, reliable reporting, secure access. Technology is the floor our teams stand on, never a substitute for their judgement.',
  },
  {
    index: '03',
    title: 'Process',
    statement: 'Process ensures quality.',
    body: 'Documented procedures, defined escalation paths and independent quality review. Process is what makes good work repeatable on a Tuesday in month eighteen, not just in the pilot.',
  },
]

/* ---------------------------------------------------------------- */

export interface Stage {
  index: string
  title: string
  body: string
}

/** How an engagement actually starts and scales. */
export const engagement: readonly Stage[] = [
  {
    index: '01',
    title: 'Discovery',
    body: 'We map the process you want supported, the systems it touches, the data involved and the outcome you are measured on.',
  },
  {
    index: '02',
    title: 'Design',
    body: 'We agree the team shape, shift coverage, escalation routes, quality criteria and reporting cadence in writing before anyone is hired.',
  },
  {
    index: '03',
    title: 'Pilot',
    body: 'A small named team runs live work under close supervision. You see real output and real quality scores before committing to scale.',
  },
  {
    index: '04',
    title: 'Scale',
    body: 'We recruit and train to the profile proven in pilot, keeping the original team as the core so knowledge compounds instead of resetting.',
  },
  {
    index: '05',
    title: 'Govern',
    body: 'Fixed review rhythm, published quality results and a standing improvement backlog. Governance continues for the life of the engagement.',
  },
]
