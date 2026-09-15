/**
 * Data protection content.
 *
 * DELIBERATE EDITORIAL RULE — read before editing:
 * This page claims NO certifications, NO audit outcomes and NO accreditations.
 * It describes how the business is designed to operate. If Teleforce later
 * obtains a certification (ISO 27001, Cyber Essentials, an ICO registration
 * number), add it here with its registration number and expiry — and not
 * before. An unverifiable claim on this page is a commercial liability.
 */

export interface Principle {
  index: string
  title: string
  body: string
}

export const principles: readonly Principle[] = [
  {
    index: '01',
    title: 'Lawful basis stays with you',
    body: 'On client engagements Teleforce acts on your instructions. You determine why personal data is processed and on what lawful basis; we process it only for the purposes you set out in writing, and we ask before doing anything outside them.',
  },
  {
    index: '02',
    title: 'Data minimisation by default',
    body: 'We ask for the narrowest set of fields that lets the work be done. Where a task can be completed with a reference number instead of a full record, that is how we specify it.',
  },
  {
    index: '03',
    title: 'Access on a need-to-know basis',
    body: 'Access is granted by role, not by seniority or convenience, and is removed when someone leaves the engagement. Permissions are reviewed rather than accumulated.',
  },
  {
    index: '04',
    title: 'Accountability you can inspect',
    body: 'Processes are documented so that decisions are traceable. We would rather be asked a hard question about a record and be able to answer it than rely on assurance that cannot be evidenced.',
  },
  {
    index: '05',
    title: 'Purpose-limited retention',
    body: 'Client data is retained only for as long as the engagement and the agreed retention period require, then returned or deleted according to your instruction.',
  },
  {
    index: '06',
    title: 'People are the control surface',
    body: 'Most data incidents begin with a person, not a firewall. Staff are briefed on confidentiality obligations, bound by contract, and told plainly what to do when something looks wrong.',
  },
]

export interface Measure {
  category: string
  items: readonly string[]
}

/**
 * CONFIRMED by the business on 15 September 2026: each measure below is operated in practice.
 *
 * A client auditor will ask for evidence of these before anything else on the
 * page. If a control lapses, remove the line here first.
 */
export const measures: readonly Measure[] = [
  {
    category: 'Organisational',
    items: [
      'Confidentiality obligations in every employment contract',
      'Documented process notes per client engagement',
      'Defined escalation path for suspected data incidents',
      'Onboarding briefing on data handling responsibilities',
      'Named point of contact for client data protection queries',
    ],
  },
  {
    category: 'Technical',
    items: [
      'Role-based access control with least-privilege defaults',
      'Encrypted transport for data in transit (TLS)',
      'Individual named accounts — no shared credentials',
      'Access revocation as part of the leaver process',
      'Logging of access to client systems where the client system supports it',
    ],
  },
  {
    category: 'Physical & operational',
    items: [
      'Controlled-access delivery floor',
      'Clear-desk expectation in operational areas',
      'Restrictions on removable media in production areas',
      'Segregation of client work areas where an engagement requires it',
    ],
  },
]

export interface Right {
  title: string
  body: string
}

export const dataSubjectRights: readonly Right[] = [
  {
    title: 'Access',
    body: 'Where a request concerns data we process for a client, we route it to that client without delay and support their response.',
  },
  {
    title: 'Rectification',
    body: 'We correct inaccurate records on client instruction and flag inaccuracies we notice in the course of the work.',
  },
  {
    title: 'Erasure',
    body: 'We delete or return data on instruction at the end of the retention period or on termination of the engagement.',
  },
  {
    title: 'Restriction & objection',
    body: 'We can suspend processing of specified records on instruction while a client resolves a request.',
  },
]
