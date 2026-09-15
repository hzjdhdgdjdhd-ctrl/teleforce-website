/** Dedicated team models and the roles that make up a delivery pod. */

export interface TeamModel {
  id: string
  index: string
  name: string
  forWhom: string
  description: string
  features: readonly string[]
}

export const teamModels: readonly TeamModel[] = [
  {
    id: 'dedicated',
    index: '01',
    name: 'Dedicated Team',
    forWhom: 'For ongoing, business-critical process ownership',
    description:
      'A team that works only on your account. Named people, your systems, your brand, your working hours — managed day to day by us, directed by you.',
    features: [
      'Exclusive to your account — no shared capacity',
      'You approve the hiring profile',
      'Direct access to team leaders',
      'Knowledge stays with the team and compounds',
    ],
  },
  {
    id: 'managed',
    index: '02',
    name: 'Managed Service',
    forWhom: 'For a defined outcome rather than a headcount',
    description:
      'You define the outcome and the standard; we own the staffing, supervision and quality of delivery against it, and report against agreed measures.',
    features: [
      'Outcome-based scope, agreed in writing',
      'We own resourcing and cover for absence',
      'Independent quality review built in',
      'Single point of accountability',
    ],
  },
  {
    id: 'extended',
    index: '03',
    name: 'Extended Team',
    forWhom: 'For augmenting a team you already run',
    description:
      'Additional trained capacity that slots into your existing structure and reports into your managers — useful for peak seasons, backlogs and cover.',
    features: [
      'Integrates into your management line',
      'Scales up and down by agreement',
      'Matched to your existing ways of working',
      'Short ramp using your own documentation',
    ],
  },
]

export interface Role {
  title: string
  responsibility: string
}

/** The standard composition of a delivery pod. */
export const podRoles: readonly Role[] = [
  {
    title: 'Operations Manager',
    responsibility:
      'Owns commercial delivery, governance reporting and the relationship with your stakeholders.',
  },
  {
    title: 'Team Leader',
    responsibility:
      'Runs the team day to day — coaching, escalation handling, shift coverage and floor-level decisions.',
  },
  {
    title: 'Process Specialists',
    responsibility:
      'The people doing the work: trained on your systems, your tone of voice and your exception rules.',
  },
  {
    title: 'Quality Analyst',
    responsibility:
      'Independently scores output against agreed criteria and feeds defects back into training.',
  },
  {
    title: 'Trainer',
    responsibility:
      'Builds and maintains the training material, onboards new joiners and runs refresher cycles.',
  },
  {
    title: 'Workforce Planner',
    responsibility:
      'Forecasts volume, builds rosters and protects coverage across your required hours.',
  },
]
