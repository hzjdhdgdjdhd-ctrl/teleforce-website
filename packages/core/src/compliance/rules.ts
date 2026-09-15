/**
 * HHCRO agent compliance ruleset.
 *
 * Encoded from "Agent Compliance HHCRO.docx". The document is explicit about
 * the commercial consequence:
 *
 *   "PLEASE NOTE THAT LEADS WHERE THE ABOVE MUSTS HAVE NOT BEEN CARRIED OUT
 *    CANNOT BE VIEWED OR PRESENTED AS A BILLABLE LEAD BY THE CALL CENTRE"
 *
 * So mandatory checkpoints are not a scoring nicety — a lead missing any of
 * them is unbillable, and the scorer treats it that way.
 */

export type Severity = 'critical' | 'major' | 'minor'

/* ------------------------------------------------------------------ */
/* Mandatory checkpoints — the MUST SAY / MUST DO items                */
/* ------------------------------------------------------------------ */

export interface MandatoryCheckpoint {
  /** Matches `checkpoint` on the corresponding script node. */
  key: string
  title: string
  /** Why it exists, shown to the QA reviewer and to the agent on failure. */
  requirement: string
  /** Missing a critical checkpoint makes the lead unbillable. */
  severity: Severity
}

export const mandatoryCheckpoints: readonly MandatoryCheckpoint[] = [
  {
    key: 'interest_level',
    title: 'Interest level confirmed',
    requirement:
      'The agent must confirm the level of interest using the script wording, ' +
      'asking whether the customer would like to take advantage of a 100% ' +
      'grant and start saving around 35% on their energy bills.',
    severity: 'critical',
  },
  {
    key: 'surveyor_reason',
    title: 'Reason for surveyor call explained',
    requirement:
      'The agent must advise the customer why the grant approved surveyor will ' +
      'be calling — that approval is subject to survey, and the survey confirms ' +
      'the information provided is correct.',
    severity: 'critical',
  },
  {
    key: 'alternative_number_asked',
    title: 'Alternative number requested',
    requirement:
      'The agent must ask for a mobile or work number in case the customer is ' +
      'out when the surveyor telephones. Obtaining the number is desirable but ' +
      'not required; asking the question is required.',
    severity: 'critical',
  },
  {
    key: 'password_agreed',
    title: 'Password agreed',
    requirement:
      'The agent must agree a password the surveyor can quote when calling, so ' +
      'the customer knows the call concerns their free inspection.',
    severity: 'critical',
  },
  {
    key: 'best_time',
    title: 'Best time to call captured',
    requirement:
      'The agent must ask what time would be best to reach the customer to ' +
      'book the appointment.',
    severity: 'major',
  },
]

/* ------------------------------------------------------------------ */
/* Prohibited statements                                               */
/* ------------------------------------------------------------------ */

export interface ProhibitedStatement {
  id: string
  /** The claim an agent must not make. */
  claim: string
  /** Why it is prohibited. */
  reason: string
  /** The compliant alternative, where the source offers one. */
  insteadSay?: string
  severity: Severity
  /**
   * Lower-cased phrases that suggest the claim was made. Used to flag call
   * transcripts for human review — never to auto-fail a call, because
   * transcription is lossy and context matters.
   */
  detect: readonly string[]
}

export const prohibitedStatements: readonly ProhibitedStatement[] = [
  {
    id: 'gov_approved_surveyor',
    claim: 'We will arrange for a government approved surveyor to give you a call.',
    reason:
      'The surveyor is grant-funded and approved, not government approved. ' +
      'Implying government endorsement misrepresents the scheme.',
    insteadSay:
      'We will arrange for a local grant funded approved surveyor to give you ' +
      'a call to arrange a date when they can visit your property to carry out ' +
      'a free of charge survey.',
    severity: 'critical',
    detect: ['government approved surveyor', 'government-approved surveyor'],
  },
  {
    id: 'grant_from_named_utility',
    claim:
      'The grant is coming from EON, British Gas, Scottish Power or any other utility company.',
    reason:
      'The grant is not issued by a utility. Utilities fund the scheme; they ' +
      'do not allocate grants to individuals.',
    insteadSay:
      'The grants for this insulation work are being funded by the utility ' +
      'companies, for example Eon or British Gas, as part of a government ' +
      'backed energy saving initiative.',
    severity: 'critical',
    detect: [
      'grant is coming from',
      'grant from eon',
      'grant from british gas',
      'grant from scottish power',
    ],
  },
  {
    id: 'calling_on_behalf_of_government',
    claim:
      'We are calling on behalf of the government to advise you about a grant you are entitled to.',
    reason: 'Falsely claims government authority for the call.',
    insteadSay:
      'We are calling to advise all home owners of the grant that is available ' +
      'to get their homes insulated to the latest European energy saving standards.',
    severity: 'critical',
    detect: ['on behalf of the government', 'behalf of government'],
  },
  {
    id: 'calling_on_behalf_of_utility',
    claim:
      'We are calling on behalf of your utility company to advise you of a grant they have allocated to you.',
    reason:
      'Falsely claims to represent the customer’s utility, and that a grant ' +
      'has already been allocated to them personally.',
    severity: 'critical',
    detect: [
      'on behalf of your utility',
      'behalf of the utility compan',
      'allocated to you',
    ],
  },
  {
    id: 'twenty_percent_bill',
    claim: 'The grant means that you will only have to pay 20% of the final bill.',
    reason:
      'Invents a customer contribution. The grant is 100% subject to survey ' +
      'and eligibility.',
    insteadSay:
      'The HHCRO grant is 100% subject to survey of your property and your ' +
      'personal eligibility such as income and benefit status.',
    severity: 'critical',
    detect: ['20% of the final bill', 'pay 20%', 'twenty percent of the'],
  },
  {
    id: 'utility_told_us',
    claim:
      'Your utility company has advised us that you haven’t had any insulation work done in the last 10 years.',
    reason:
      'Fabricates a data source and implies the utility shared the customer’s ' +
      'records with us.',
    severity: 'critical',
    detect: [
      'your utility company has advised us',
      'utility company told us',
      'your supplier has advised',
    ],
  },
  {
    id: 'coach_the_answer',
    claim:
      'Shall we say that the current loft insulation is level with the joists.',
    reason:
      'Coaching a customer to give a qualifying answer when they have said it ' +
      'is higher, or that they do not know. This falsifies the lead.',
    severity: 'critical',
    detect: [
      'shall we say',
      "let's just say",
      'lets just say',
      'we can put down',
      "we'll say it's level",
    ],
  },
  {
    id: 'we_will_clear_loft',
    claim: 'Our surveyors or installers will clear the loft to do the work.',
    reason:
      'The loft must be empty or emptied by the householder. Promising ' +
      'clearance commits to work that will not happen.',
    severity: 'critical',
    detect: ['clear the loft', 'empty the loft for you', 'clear it out for you'],
  },
  {
    id: 'book_anyway_despite_no_interest',
    claim:
      'I understand you may not be interested, but let’s arrange for a surveyor to call you anyway.',
    reason:
      'Overrides a stated lack of interest. Interest must be genuinely ' +
      'confirmed, not talked past.',
    severity: 'critical',
    detect: [
      'not interested at the moment but',
      'arrange for a surveyor to call you anyway',
      'no obligation anyway',
    ],
  },
  {
    id: 'free_despite_failing_eligibility',
    claim:
      'All the work will be done free of charge — said when the customer meets none of the four eligibility checks.',
    reason:
      'Promises a free outcome to a customer who does not qualify. This is ' +
      'the single most damaging claim on the call.',
    severity: 'critical',
    detect: ['all the work will be done free', 'completely free of charge'],
  },
]

/* ------------------------------------------------------------------ */
/* Permitted phrasing — shown to agents as the compliant alternative   */
/* ------------------------------------------------------------------ */

export const permittedStatements: readonly string[] = [
  'We will arrange for a local grant funded approved surveyor to give you a ' +
    'call to arrange a date when they can visit your property to quickly carry ' +
    'out a free of charge survey, to make sure the information you have ' +
    'provided is correct.',
  'The grants for this insulation work are being funded by the utility ' +
    'companies, for example Eon or British Gas, as part of a government backed ' +
    'energy saving initiative.',
  'We are calling to advise all home owners of the grant that is available to ' +
    'get their homes insulated to the latest European energy saving standards.',
  'The HHCRO grant is 100% subject to survey of your property and your ' +
    'personal eligibility such as income and benefit status.',
]
