import type { CallScript, ScriptNode } from './types'

/**
 * HHCRO insulation grant qualification script.
 *
 * Encoded directly from "Final_Script for CRM 2.docx". Every node below maps
 * to a numbered question or stated wording in that document; the branching
 * comments quote the source instruction it implements.
 *
 * TWO EDITORIAL DECISIONS, both flagged rather than made silently:
 *
 * 1. The source says of Q2 (loft insulated in last ten years) both
 *    "If yes end the call" and, separately, "If we get Yes on Both Questions
 *    1 & 2 We have to go directly termination Script". Those conflict when
 *    Q1 is No, because an uninsulated cavity is still a live opportunity.
 *    Encoded so that Yes on Q2 ends the LOFT line only: if the cavity is also
 *    done (Q1 Yes) the call terminates, otherwise it continues on cavity.
 *    Confirm this is how the floor actually runs it.
 *
 * 2. The source termination wording promises funding "throughout 2013". The
 *    year is dropped rather than updated — inventing a current year would be
 *    putting words in the client's mouth, and reading "2013" aloud today is
 *    worse. Reinstate a real date if one exists.
 */

/** Income threshold quoted in the source document (written there as £15,860). */
const INCOME_THRESHOLD = '£15,860'

/**
 * Shared termination wording. The source repeats this verbatim after both the
 * property pre-qualification and the eligibility checks.
 */
const TERMINATION_SAY =
  'OK thank you for your time. Based on the information you have provided, ' +
  'unfortunately you don’t qualify for this particular grant. There will be ' +
  'other types of funding being made available, so now I have your details ' +
  'I’ll make a note in our system to give you a call back when funding that ' +
  'you do qualify for becomes available. Is that OK?'

const nodes: ScriptNode[] = [
  /* ================================================================
     STEP 1 — Introduction and property pre-qualification
     ================================================================ */
  {
    id: 'intro',
    kind: 'statement',
    section: 'Introduction',
    say:
      'Hello, is this Mr/Mrs …? This is … calling from Energy Grants Advisors. ' +
      'I’m calling in regards to a grant you may be entitled to as a property ' +
      'owner for getting your cavity walls and loft insulated to the recommended ' +
      'standards. Your personal circumstances may entitle you to the full 100% ' +
      'grant, which means the work will be carried out absolutely free of charge, ' +
      'so I just need to check a couple of things with regards to your property first.',
    checkpoint: 'intro_given',
    next: 'q1_cavity',
  },

  {
    id: 'q1_cavity',
    kind: 'question',
    section: 'Property pre-qualification',
    label: 'Cavity walls already insulated',
    say: 'Are your cavity walls already insulated?',
    note: 'Source Q1. Yes removes the cavity opportunity and leaves loft only.',
    options: [
      // Cavity already done -> only a loft lead is possible from here.
      { id: 'yes', label: 'Yes', next: 'q2_loft_only', setsLeadType: 'loft' },
      // Cavity available -> both products still in play.
      { id: 'no', label: 'No', next: 'q2_both', setsLeadType: 'cavity' },
    ],
  },

  {
    id: 'q2_loft_only',
    kind: 'question',
    section: 'Property pre-qualification',
    label: 'Loft insulated in last 10 years (cavity already done)',
    say: 'Has your loft had any insulation work done to it in the last ten years?',
    note:
      'Source Q2 with Q1 = Yes. Both insulated, so the source sends this ' +
      'straight to the termination script.',
    options: [
      { id: 'yes', label: 'Yes', next: 'terminate_property' },
      { id: 'no', label: 'No', next: 'q3_level' },
    ],
  },

  {
    id: 'q2_both',
    kind: 'question',
    section: 'Property pre-qualification',
    label: 'Loft insulated in last 10 years',
    say: 'Has your loft had any insulation work done to it in the last ten years?',
    note:
      'Source Q2 with Q1 = No. Loft is closed off but the cavity is still ' +
      'uninsulated, so the call continues on the cavity path.',
    options: [
      { id: 'yes', label: 'Yes', next: 'elig1', setsLeadType: 'cavity' },
      { id: 'no', label: 'No', next: 'q3_level' },
    ],
  },

  {
    id: 'q3_level',
    kind: 'question',
    section: 'Property pre-qualification',
    label: 'Existing loft insulation level',
    say: 'Is the insulation level with the joists, or below or above them?',
    note:
      'Source Q3. Above the joists is no good for a loft lead — move straight ' +
      'to the cavity wall questions.',
    options: [
      { id: 'below', label: 'Below', next: 'elig1', setsLeadType: 'loft' },
      { id: 'level', label: 'Level', next: 'elig1', setsLeadType: 'loft' },
      { id: 'above', label: 'Above', next: 'elig1', setsLeadType: 'cavity' },
      { id: 'yes', label: 'Yes', next: 'elig1' },
      { id: 'no', label: 'No', next: 'elig1' },
    ],
  },

  {
    id: 'terminate_property',
    kind: 'termination',
    section: 'Termination',
    say: TERMINATION_SAY,
    outcome: 'terminated_property',
    checkpoint: 'termination_read',
  },

  /* ================================================================
     STEP 2 — Personal situation / eligibility
     ================================================================ */
  {
    id: 'elig1',
    kind: 'question',
    section: 'Eligibility check 1',
    label: 'State pension credit',
    say: 'Do you receive state pension credit?',
    note: 'Not the pension itself — the credit paid on top of it.',
    options: [
      { id: 'yes', label: 'Yes', next: 'prop_intro', satisfiesGroup: 'elig1' },
      { id: 'no', label: 'No', next: 'elig2' },
    ],
  },

  {
    id: 'elig2',
    kind: 'question',
    section: 'Eligibility check 2',
    label: 'Child tax credit',
    say: 'Do you receive child tax credit?',
    options: [
      { id: 'yes', label: 'Yes', next: 'elig2_income' },
      { id: 'no', label: 'No', next: 'elig3_jsa' },
    ],
  },

  {
    id: 'elig2_income',
    kind: 'question',
    section: 'Eligibility check 2',
    label: `Income below ${INCOME_THRESHOLD}`,
    say: `Is your income below ${INCOME_THRESHOLD}?`,
    options: [
      { id: 'yes', label: 'Yes', next: 'prop_intro', satisfiesGroup: 'elig2' },
      { id: 'no', label: 'No', next: 'elig3_jsa' },
    ],
  },

  // Eligibility 3 — need one YES from Q1 (A/B/C), then one YES from Q2 (A–G).
  {
    id: 'elig3_jsa',
    kind: 'question',
    section: 'Eligibility check 3 — Q1',
    label: 'Income-based Jobseeker’s Allowance',
    say: 'Do you receive income-based Jobseeker’s Allowance?',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        next: 'elig3_q2',
        satisfiesGroup: 'elig3.q1',
      },
      { id: 'no', label: 'No', next: 'elig3_esa' },
    ],
  },

  {
    id: 'elig3_esa',
    kind: 'question',
    section: 'Eligibility check 3 — Q1',
    label: 'Income-related Employment & Support Allowance',
    say: 'Do you receive income-related Employment and Support Allowance?',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        next: 'elig3_q2',
        satisfiesGroup: 'elig3.q1',
      },
      { id: 'no', label: 'No', next: 'elig3_is' },
    ],
  },

  {
    id: 'elig3_is',
    kind: 'question',
    section: 'Eligibility check 3 — Q1',
    label: 'Income Support',
    say: 'Do you receive Income Support?',
    options: [
      {
        id: 'yes',
        label: 'Yes',
        next: 'elig3_q2',
        satisfiesGroup: 'elig3.q1',
      },
      { id: 'no', label: 'No', next: 'elig4_wtc' },
    ],
  },

  {
    id: 'elig3_q2',
    kind: 'question',
    section: 'Eligibility check 3 — Q2',
    label: 'Additional qualifying element (one required)',
    say: 'Do you also have any one of the following?',
    note: 'Only one YES is needed. Read the list; stop at the first Yes.',
    options: [
      { id: 'a', label: 'A — Disabled child premium', next: 'prop_intro', satisfiesGroup: 'elig3.q2' },
      { id: 'b', label: 'B — Child under 16 living at the property', next: 'prop_intro', satisfiesGroup: 'elig3.q2' },
      { id: 'c', label: 'C — Child 16–19 in full-time non-higher education', next: 'prop_intro', satisfiesGroup: 'elig3.q2' },
      { id: 'd', label: 'D — Pension premium (any tier)', next: 'prop_intro', satisfiesGroup: 'elig3.q2' },
      { id: 'e', label: 'E — Child tax credit with disability element', next: 'prop_intro', satisfiesGroup: 'elig3.q2' },
      { id: 'f', label: 'F — Disability or severe disability premium', next: 'prop_intro', satisfiesGroup: 'elig3.q2' },
      { id: 'g', label: 'G — Work-related activity or support component', next: 'prop_intro', satisfiesGroup: 'elig3.q2' },
      { id: 'none', label: 'None of these', next: 'elig4_wtc' },
    ],
  },

  // Eligibility 4 — the last gate. Failing it terminates the call.
  {
    id: 'elig4_wtc',
    kind: 'question',
    section: 'Eligibility check 4 — Q1',
    label: `Working tax credit, income below ${INCOME_THRESHOLD}`,
    say: `Do you receive working tax credit with a relevant income below ${INCOME_THRESHOLD}?`,
    options: [
      { id: 'yes', label: 'Yes', next: 'elig4_q2', satisfiesGroup: 'elig4.q1' },
      { id: 'no', label: 'No', next: 'terminate_ineligible' },
    ],
  },

  {
    id: 'elig4_q2',
    kind: 'question',
    section: 'Eligibility check 4 — Q2',
    label: 'Additional qualifying element (one required)',
    say: 'Do you also have any one of the following?',
    note: 'Only one YES is needed.',
    options: [
      { id: 'a', label: 'A — Child under 16 living at the property', next: 'prop_intro', satisfiesGroup: 'elig4.q2' },
      { id: 'b', label: 'B — Child 16–19 in full-time non-higher education', next: 'prop_intro', satisfiesGroup: 'elig4.q2' },
      { id: 'c', label: 'C — Disabled worker or severe disability element', next: 'prop_intro', satisfiesGroup: 'elig4.q2' },
      { id: 'd', label: 'D — Aged 60 or over', next: 'prop_intro', satisfiesGroup: 'elig4.q2' },
      { id: 'none', label: 'None of these', next: 'terminate_ineligible' },
    ],
  },

  {
    id: 'terminate_ineligible',
    kind: 'termination',
    section: 'Termination',
    say: TERMINATION_SAY,
    outcome: 'terminated_ineligible',
    checkpoint: 'termination_read',
  },

  /* ================================================================
     STEP 3 — Property criteria
     ================================================================ */
  {
    id: 'prop_intro',
    kind: 'statement',
    section: 'Property criteria',
    say:
      'The good news is that, subject to survey, you are entitled to a grant ' +
      'which covers 100% of the total cost. I just need to ask you a few more ' +
      'questions about your property now.',
    next: 'prop_own',
  },

  {
    id: 'prop_own',
    kind: 'question',
    section: 'Property criteria',
    label: 'Owns the property',
    say: 'Do you own the property?',
    note: 'Must be Yes. Tenants do not qualify.',
    options: [
      { id: 'yes', label: 'Yes', next: 'prop_type' },
      { id: 'no', label: 'No', next: 'terminate_property' },
    ],
  },

  {
    id: 'prop_type',
    kind: 'question',
    section: 'Property criteria',
    label: 'Property type',
    say: 'What type of property is it?',
    note: 'No flats or apartments. For a loft lead, end of terrace only.',
    options: [
      { id: 'detached', label: 'Detached', next: 'prop_bedrooms' },
      { id: 'semi', label: 'Semi-detached', next: 'prop_bedrooms' },
      { id: 'terrace_end', label: 'Terrace — end of terrace', next: 'prop_bedrooms' },
      { id: 'terrace_mid', label: 'Terrace — mid terrace', next: 'prop_bedrooms', setsLeadType: 'cavity' },
      { id: 'bungalow', label: 'Bungalow', next: 'prop_bedrooms' },
      { id: 'flat', label: 'Flat or apartment', next: 'terminate_property' },
    ],
  },

  {
    id: 'prop_bedrooms',
    kind: 'question',
    section: 'Property criteria',
    label: 'Bedrooms',
    say: 'How many bedrooms does your property have?',
    options: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
      id: String(n),
      label: String(n),
      next: 'route_product',
    })),
  },

  {
    id: 'route_product',
    kind: 'question',
    section: 'Property criteria',
    label: 'Product route',
    say: 'Confirm which product this lead is being qualified for.',
    note:
      'Agent-facing only — do not read aloud. Pre-selected from the answers ' +
      'so far; override only if the caller has corrected themselves.',
    options: [
      { id: 'loft', label: 'Loft', next: 'loft_depth', setsLeadType: 'loft' },
      { id: 'cavity', label: 'Cavity', next: 'cav_age', setsLeadType: 'cavity' },
    ],
  },

  /* ---------------- Loft questions ---------------- */
  {
    id: 'loft_depth',
    kind: 'question',
    section: 'Loft questions',
    label: 'Depth of present insulation',
    say: 'How deep is the present insulation?',
    note: 'Must be no higher than the joists. Above the joists fails the loft.',
    options: [
      { id: 'below', label: 'Below joists', next: 'loft_boarded' },
      { id: 'level', label: 'Level with joists', next: 'loft_boarded' },
      { id: 'above', label: 'Above joists', next: 'cav_age', setsLeadType: 'cavity' },
      { id: 'none', label: 'None present', next: 'loft_boarded' },
    ],
  },

  {
    id: 'loft_boarded',
    kind: 'question',
    section: 'Loft questions',
    label: 'Loft boarded',
    say: 'Is the loft boarded?',
    note: 'Must be No. Yes fails the loft and moves to cavity.',
    options: [
      { id: 'no', label: 'No', next: 'loft_empty' },
      { id: 'yes', label: 'Yes', next: 'cav_age', setsLeadType: 'cavity' },
    ],
  },

  {
    id: 'loft_empty',
    kind: 'question',
    section: 'Loft questions',
    label: 'Loft empty or can be emptied',
    say: 'Is the loft empty, or can it be emptied?',
    note:
      'Must be emptied by the householder. Never offer to clear the loft — ' +
      'that is a prohibited statement.',
    options: [
      { id: 'yes', label: 'Yes', next: 'loft_room' },
      { id: 'no', label: 'No', next: 'cav_age', setsLeadType: 'cavity' },
    ],
  },

  {
    id: 'loft_room',
    kind: 'question',
    section: 'Loft questions',
    label: 'Room to work in loft',
    say: 'Is there room for someone to work in the loft?',
    note: 'Must be Yes.',
    options: [
      { id: 'yes', label: 'Yes', next: 'loft_converted' },
      { id: 'no', label: 'No', next: 'cav_age', setsLeadType: 'cavity' },
    ],
  },

  {
    id: 'loft_converted',
    kind: 'question',
    section: 'Loft questions',
    label: 'Loft converted',
    say: 'Has the loft been converted?',
    note: 'Must be No.',
    options: [
      { id: 'no', label: 'No', next: 'interest_check' },
      { id: 'yes', label: 'Yes', next: 'cav_age', setsLeadType: 'cavity' },
    ],
  },

  /* ---------------- Cavity questions ---------------- */
  {
    id: 'cav_age',
    kind: 'question',
    section: 'Cavity questions',
    label: 'Property built after 1935',
    say: 'What is the age of your house — was it built after 1935?',
    note: 'Must be built after 1935.',
    options: [
      { id: 'after', label: 'After 1935', next: 'cav_timber' },
      { id: 'before', label: '1935 or earlier', next: 'terminate_property' },
    ],
  },

  {
    id: 'cav_timber',
    kind: 'question',
    section: 'Cavity questions',
    label: 'Timber framed walls',
    say: 'Are the walls timber framed?',
    note: 'Must be No.',
    options: [
      { id: 'no', label: 'No', next: 'cav_has_cavity' },
      { id: 'yes', label: 'Yes', next: 'terminate_property' },
    ],
  },

  {
    id: 'cav_has_cavity',
    kind: 'question',
    section: 'Cavity questions',
    label: 'Property has cavity walls',
    say: 'Does the property have cavity walls?',
    note: 'Must be Yes.',
    options: [
      { id: 'yes', label: 'Yes', next: 'cav_brick' },
      { id: 'no', label: 'No', next: 'terminate_property' },
    ],
  },

  {
    id: 'cav_brick',
    kind: 'question',
    section: 'Cavity questions',
    label: 'Brick construction, outer and inner wall',
    say: 'Is the construction brick, with an outer wall and an inner wall?',
    note: 'Must be Yes.',
    options: [
      { id: 'yes', label: 'Yes', next: 'cav_cladding' },
      { id: 'no', label: 'No', next: 'terminate_property' },
    ],
  },

  {
    id: 'cav_cladding',
    kind: 'question',
    section: 'Cavity questions',
    label: 'Cladding or tiles on outer walls',
    say: 'Does the property have cladding or tiles on the outer walls?',
    note: 'Must be No.',
    options: [
      { id: 'no', label: 'No', next: 'cav_damp' },
      { id: 'yes', label: 'Yes', next: 'terminate_property' },
    ],
  },

  {
    id: 'cav_damp',
    kind: 'question',
    section: 'Cavity questions',
    label: 'Damp walls',
    say: 'Does your property have damp walls?',
    note: 'Must be No.',
    options: [
      { id: 'no', label: 'No', next: 'interest_check' },
      { id: 'yes', label: 'Yes', next: 'terminate_property' },
    ],
  },

  /* ================================================================
     Close — every node below is a compliance checkpoint
     ================================================================ */
  {
    id: 'interest_check',
    kind: 'question',
    section: 'Close',
    label: 'Interest level confirmed',
    say:
      'So based on what I have told you, if you are entitled to a 100% grant ' +
      'to get your property insulated to the latest recommended standards, ' +
      'free of charge, is this something that you would like to take advantage ' +
      'of and start saving around 35% on your energy bills?',
    note: 'MUST SAY — verbatim. A lead without this is not billable.',
    checkpoint: 'interest_level',
    options: [
      { id: 'yes', label: 'Yes', next: 'surveyor_reason' },
      { id: 'no', label: 'No', next: 'terminate_property' },
    ],
  },

  {
    id: 'surveyor_reason',
    kind: 'statement',
    section: 'Close',
    say:
      'Like I mentioned earlier, the approval of your 100% grant is subject to ' +
      'survey. This is just to make sure that the information you have kindly ' +
      'provided is correct. So I will now pass your details on to one of our ' +
      'local grant-funded approved surveyors, who will call you within the next ' +
      'week to book a date and time according to your convenience when he can ' +
      'visit your property to carry out a quick inspection, absolutely free of ' +
      'charge, to allocate your grant.',
    note: 'MUST SAY — verbatim.',
    mustSay: true,
    checkpoint: 'surveyor_reason',
    next: 'best_time',
  },

  {
    id: 'best_time',
    kind: 'capture',
    section: 'Close',
    label: 'Best time to call',
    say: 'What would be the best time to reach you to book an appointment?',
    field: 'bestTimeToCall',
    inputType: 'choice',
    choices: ['Morning', 'Afternoon'],
    required: true,
    checkpoint: 'best_time',
    next: 'alt_number',
  },

  {
    id: 'alt_number',
    kind: 'capture',
    section: 'Close',
    label: 'Alternative contact number',
    say:
      'Now, ideally the surveyor will also need a mobile number or a work ' +
      'number as well, just in case you are out when he tries to telephone your ' +
      'home number. What is your mobile number please, and your works number?',
    field: 'alternativeNumber',
    inputType: 'tel',
    // Compliance requires the question to be ASKED. Obtaining a number is
    // desirable but explicitly not a compliance requirement, so the field
    // itself is optional while the checkpoint still records the ask.
    required: false,
    checkpoint: 'alternative_number_asked',
    next: 'password',
  },

  {
    id: 'password',
    kind: 'capture',
    section: 'Close',
    label: 'Agreed password',
    say:
      'Now finally, can we agree a password that the surveyor can quote when he ' +
      'calls you, so you know it’s about your free inspection? It can be a ' +
      'colour, a pet’s name, or a make of car.',
    field: 'password',
    inputType: 'text',
    required: true,
    checkpoint: 'password_agreed',
    next: 'close',
  },

  {
    id: 'close',
    kind: 'statement',
    section: 'Close',
    say: 'Thanks for the information given, have a great day and goodbye.',
    next: null,
    outcome: 'qualified',
  },
]

export const hhcroScript: CallScript = {
  id: 'hhcro-insulation',
  name: 'HHCRO Insulation Grant — Qualification',
  version: 1,
  entry: 'intro',
  nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
}
