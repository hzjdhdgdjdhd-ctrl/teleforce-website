/**
 * Single source of truth for all company facts used across the site.
 *
 * IMPORTANT — VERIFY BEFORE PUBLISHING
 * Every value below is either (a) taken from the MCA/ROC public register, or
 * (b) explicitly marked as a placeholder. Nothing here is invented.
 * Placeholders are prefixed `TODO:` so they are impossible to miss in review.
 */

export const company = {
  /* ---- Legal identity (MCA / ROC public register) ---- */
  legalName: 'Tele Force Technology Private Limited',
  tradingName: 'Teleforce Technology',
  shortName: 'Teleforce',
  tagline: 'Systems & Services',

  cin: 'U72900WB2016PTC217414',
  registrationNumber: '217414',
  roc: 'Registrar of Companies, Kolkata',
  incorporatedOn: '2 September 2016',
  companyClass: 'Private company limited by shares',
  companyCategory: 'Non-government company',
  status: 'Active',
  nicCode: '7290',
  nicDescription: 'Other computer related activities',

  directors: ['Arijit Debnath', 'Lakshmi Narayan Ghosh'],

  /* ---- Registered office (MCA public register) ---- */
  registeredOffice: {
    line1: 'Webel IT Park, 3rd Floor',
    line2: 'Phase 2, Paribahan Nagar',
    city: 'Matigara, Siliguri',
    region: 'West Bengal',
    postcode: '734010',
    country: 'India',
  },

  /* ---- Contact ----
     No email address is published. The site previously printed a personal
     Gmail address, which is both a privacy exposure for its owner and a
     credibility problem for an enterprise buyer.

     Enquiries go to the `enquiries` table in Supabase instead. When a
     monitored mailbox exists on the domain, set publicEmail below and the
     footer and contact page will show it again automatically. */
  publicEmail: '' as string,
  dataProtectionEmail: '' as string,
  /** Published business number. Blank hides the field rather than inventing one. */
  phone: '' as string,

  /* ---- Web ---- */
  domain: 'teleforcetechnology.org',
  siteUrl: 'https://teleforcetechnology.org',

  /* ---- Operating footprint ----
     Programmes run in three markets; see data/markets.ts for what each one
     actually is. `primaryMarket` is deliberately still the UK: it is the
     market the Data Protection page is written against, and that page makes
     UK-specific legal statements which must not silently become claims about
     three jurisdictions. Use `marketsLine` for anything describing reach. */
  deliveryCentre: 'Siliguri, West Bengal, India',
  primaryMarket: 'United Kingdom',
  /** Short form — use where 'United Kingdom' reads wrong, e.g. 'the UK\n   *  Data Protection Act', 'UK controller', 'UK residents'. */
  marketShort: 'UK',
  /** Every market served, long form. */
  marketsLine: 'United Kingdom · United States · Australia',
  /** Every market served, short form — for mono readouts and utility bars. */
  marketsShort: 'UK · USA · Australia',
} as const

export const formattedAddress = [
  company.registeredOffice.line1,
  company.registeredOffice.line2,
  company.registeredOffice.city,
  `${company.registeredOffice.region} ${company.registeredOffice.postcode}`,
  company.registeredOffice.country,
].join(', ')

/**
 * Operating hours expressed in both timezones — the single most useful fact
 * for a UK buyer evaluating an India-based delivery partner.
 * TODO: confirm the actual shift pattern you commit to contractually.
 */
export const coverage = {
  ukHours: '08:00 – 20:00 GMT/BST',
  istHours: '13:30 – 01:30 IST',
  note: 'Shift patterns are agreed per engagement.',
} as const
