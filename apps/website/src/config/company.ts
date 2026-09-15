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
     PENDING: the domain addresses below are ready to switch on, but Cloudflare
     Email Routing is not enabled yet, so mail to them would bounce. Keeping the
     working inbox live until routing is verified.

       email:               'contact@teleforcetechnology.org'
       dataProtectionEmail: 'privacy@teleforcetechnology.org'

     To switch: enable Email → Email Routing in Cloudflare, create both
     aliases forwarding to the monitored inbox, click the verification link,
     confirm MX records resolve, then swap the two values below. */
  email: 'arid0202@gmail.com',
  dataProtectionEmail: 'arid0202@gmail.com',
  phone: '' as string, // TODO: add a published business number, or leave blank to hide.

  /* ---- Web ---- */
  domain: 'teleforcetechnology.org',
  siteUrl: 'https://teleforcetechnology.org',

  /* ---- Operating footprint ---- */
  deliveryCentre: 'Siliguri, West Bengal, India',
  primaryMarket: 'United Kingdom',
  /** Short form — use where 'United Kingdom' reads wrong, e.g. 'the UK\n   *  Data Protection Act', 'UK controller', 'UK residents'. */
  marketShort: 'UK',
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
