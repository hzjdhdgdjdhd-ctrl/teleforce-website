/**
 * Markets served, and the programme actually running in each.
 *
 * CONFIRMED by the business on 16 September 2026. Same rule as services.ts:
 * every line here is a claim a buyer may ask you to evidence, so if a
 * programme changes, change it here rather than letting it be discovered in a
 * procurement call.
 *
 * Deliberately absent: volumes, conversion rates, headcount and client counts.
 * We have no audited figures to publish, and an invented one is worse than
 * silence.
 */

export interface MarketClient {
  /** Legal name exactly as the client publishes it. */
  name: string
  /**
   * Outbound link, only where the client has asked to be linked. Absent is
   * the default: naming a client we work with is a statement about us,
   * sending buyers to their site is a statement about them.
   */
  url?: string
}

export interface Market {
  id: string
  index: string
  /** ISO 3166-1 alpha-2 — used as the mono display code. */
  code: string
  country: string
  /** The programme, in the words we would use on a call. */
  programme: string
  summary: string
  points: readonly string[]
  /** Real coordinates — the market mark projects a globe around this point. */
  lat: number
  lng: number
  /** IANA zone for the local-time readout. */
  timeZone: string
  /** Named client, where the client has agreed to be named. */
  client?: MarketClient
}

export const markets: readonly Market[] = [
  {
    id: 'united-kingdom',
    index: '01',
    code: 'GB',
    country: 'United Kingdom',
    programme: 'Home appliance response capture',
    summary:
      'We contact households across the United Kingdom and capture their responses about the home appliances already installed at the property — working to a fixed script, recording what was actually said rather than what we hoped to hear.',
    points: [
      'Scripted response capture on existing home appliances',
      'Outcome, timestamp and agent recorded on every contact',
      'Do-not-call marked at the point of request and honoured thereafter',
      'Contact lists loaded daily and returned reconciled',
    ],
    lat: 54.0,
    lng: -2.5,
    timeZone: 'Europe/London',
  },
  {
    id: 'united-states',
    index: '02',
    code: 'US',
    country: 'United States',
    programme: 'Home appliance response capture',
    summary:
      'The same response-capture programme run for the United States, delivered for our client CDM Global Goods Wholesalers L.L.C. Calling windows follow the contact’s own time zone, not ours.',
    points: [
      'Scripted response capture on existing home appliances',
      'Calling windows set per state time zone',
      'Do-not-call marked at the point of request and honoured thereafter',
      'Client-specific script, qualification and escalation rules',
    ],
    lat: 39.8,
    lng: -98.6,
    timeZone: 'America/New_York',
    client: {
      name: 'CDM Global Goods Wholesalers L.L.C.',
    },
  },
  {
    id: 'australia',
    index: '03',
    code: 'AU',
    country: 'Australia',
    programme: 'Telephone survey and lead qualification',
    summary:
      'We run telephone surveys with Australian households, qualify each respondent against criteria agreed with the client, and pass the genuinely interested through as hot sales leads while that interest is still live.',
    points: [
      'Structured telephone survey to an agreed questionnaire',
      'Qualification scored against client criteria, not judged on a hunch',
      'Hot leads released the same day they are captured',
      'Rejected leads returned with the reason recorded',
    ],
    lat: -25.3,
    lng: 133.8,
    timeZone: 'Australia/Sydney',
  },
]

/** One-line market list, for readouts and meta descriptions. */
export const marketsLine = markets.map((m) => m.country).join(' · ')
