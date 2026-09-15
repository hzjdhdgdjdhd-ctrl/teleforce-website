import type { Contact, ImportIssue } from './types'

/**
 * Daily contact import.
 *
 * Admins upload whatever their data supplier sends — column names vary between
 * files and between suppliers. Rather than demand a fixed template, the
 * importer recognises the common spellings and preserves everything it does
 * not recognise on `extra`, so nothing from the source file is ever lost.
 *
 * Pure functions: no file I/O, no Firestore. The admin app parses bytes to
 * rows, calls this, then writes the result.
 */

/* ------------------------------------------------------------------ */
/* CSV parsing                                                         */
/* ------------------------------------------------------------------ */

/**
 * Parse delimited text into rows.
 *
 * Handles quoted fields, escaped quotes, embedded commas and newlines, and
 * both CRLF and LF endings — all of which appear in real supplier exports.
 */
export function parseDelimited(text: string, delimiter = ','): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  // Strip a UTF-8 BOM; Excel writes one and it corrupts the first header.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  for (let i = 0; i < src.length; i++) {
    const c = src[i]!

    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }

    if (c === '"') {
      inQuotes = true
    } else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c === '\r') {
      // handled by the \n that follows
    } else {
      field += c
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

/** Guess the delimiter from the header line. Suppliers send CSV and TSV. */
export function detectDelimiter(text: string): string {
  const firstLine = text.slice(0, text.indexOf('\n') + 1 || text.length)
  const counts: Array<[string, number]> = [
    [',', (firstLine.match(/,/g) ?? []).length],
    ['\t', (firstLine.match(/\t/g) ?? []).length],
    [';', (firstLine.match(/;/g) ?? []).length],
    ['|', (firstLine.match(/\|/g) ?? []).length],
  ]
  counts.sort((a, b) => b[1] - a[1])
  return counts[0]![1] > 0 ? counts[0]![0] : ','
}

/* ------------------------------------------------------------------ */
/* Column mapping                                                      */
/* ------------------------------------------------------------------ */

type Field =
  | 'title'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'alternativePhone'
  | 'email'
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'postcode'

/** Header spellings seen in real supplier files, normalised. */
const ALIASES: Record<Field, string[]> = {
  title: ['title', 'salutation', 'prefix'],
  // "Full Name", "Customer Name" and "Contact Name" are as common as
  // "First Name" in supplier exports, and a combined column is split below.
  firstName: [
    'firstname', 'first', 'forename', 'givenname', 'fname',
    'name', 'fullname', 'customername', 'contactname', 'clientname',
    'accountname', 'householder',
  ],
  lastName: ['lastname', 'last', 'surname', 'familyname', 'lname'],
  // Aliases are compared after normaliseHeader(), so "Telephone No." arrives
  // here as "telephone" and needs no separate entry.
  phone: [
    'phone', 'telephone', 'tel', 'contact', 'landline',
    'hometelephone', 'homephone', 'msisdn', 'primaryphone',
  ],
  // A "mobile" column alongside "phone" is the alternative number. Because
  // phone is matched first it has already claimed its own column by the time
  // this list is considered, so the two cannot collide.
  alternativePhone: [
    'alternativephone', 'altphone', 'alternative', 'alt', 'phone2',
    'telephone2', 'second', 'work', 'workphone', 'mobile', 'mobile2', 'other',
  ],
  email: ['email', 'emailaddress', 'mail'],
  addressLine1: ['address', 'address1', 'addressline1', 'street', 'addr1', 'houseaddress'],
  addressLine2: ['address2', 'addressline2', 'addr2', 'locality'],
  city: ['city', 'town', 'posttown'],
  postcode: ['postcode', 'postalcode', 'zip', 'zipcode', 'pcode'],
}

/**
 * Reduce a header to a comparable key.
 *
 * Trailing "no", "number" and "num" are stripped so that "Telephone No.",
 * "Phone Number" and "Phone" all collapse to the same key — suppliers use all
 * three and the difference is never meaningful.
 */
function normaliseHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(?:nos|number|num|no)$/, '')
}

/**
 * Map header cells to known fields.
 *
 * First match wins, so a file with both "mobile" and "phone" keeps "phone" as
 * the primary and leaves "mobile" to fall through to `extra` rather than
 * silently overwriting.
 */
export function mapHeaders(headers: string[]): Map<number, Field> {
  const mapping = new Map<number, Field>()
  const taken = new Set<Field>()

  for (const [field, aliases] of Object.entries(ALIASES) as [Field, string[]][]) {
    if (taken.has(field)) continue
    for (let i = 0; i < headers.length; i++) {
      if (mapping.has(i)) continue
      if (aliases.includes(normaliseHeader(headers[i] ?? ''))) {
        mapping.set(i, field)
        taken.add(field)
        break
      }
    }
  }

  return mapping
}

/* ------------------------------------------------------------------ */
/* Phone normalisation                                                 */
/* ------------------------------------------------------------------ */

/**
 * Normalise a UK number to 0-prefixed national format.
 *
 * Agents dial manually, so the value has to be correct and readable rather
 * than merely machine-parsable. Returns null when the input cannot be a UK
 * subscriber number.
 */
export function normalisePhone(raw: string): string | null {
  let digits = raw.replace(/[^\d+]/g, '')
  if (!digits) return null

  if (digits.startsWith('+44')) digits = '0' + digits.slice(3)
  else if (digits.startsWith('0044')) digits = '0' + digits.slice(4)
  else if (digits.startsWith('44') && digits.length >= 12) digits = '0' + digits.slice(2)

  digits = digits.replace(/\D/g, '')

  // Suppliers often strip the leading zero in spreadsheet exports.
  if (digits.length === 9 || digits.length === 10) {
    if (!digits.startsWith('0')) digits = '0' + digits
  }

  if (!digits.startsWith('0')) return null
  if (digits.length < 10 || digits.length > 11) return null

  return digits
}

/** Tidy a UK postcode to the standard "OUTWARD INWARD" form. */
export function normalisePostcode(raw: string): string | undefined {
  const compact = raw.toUpperCase().replace(/\s+/g, '')
  if (compact.length < 5 || compact.length > 7) return raw.trim() || undefined
  return `${compact.slice(0, compact.length - 3)} ${compact.slice(-3)}`
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c: string) => 'Mc' + c.toUpperCase())
    .replace(/\bO'([a-z])/g, (_, c: string) => "O'" + c.toUpperCase())
}

/* ------------------------------------------------------------------ */
/* Import                                                              */
/* ------------------------------------------------------------------ */

export interface ImportOptions {
  campaignId: string
  batchId: string
  /** Phone numbers already in the system, to skip duplicates. */
  existingPhones?: ReadonlySet<string>
}

export interface ImportResult {
  contacts: Array<Omit<Contact, 'id'>>
  issues: ImportIssue[]
  totalRows: number
  imported: number
  skippedDuplicates: number
  rejected: number
}

/**
 * Turn raw file text into contacts ready to write.
 *
 * A row is rejected only when it has no usable phone number or no name —
 * without either, an agent cannot make the call. Everything else is imported
 * with whatever it has, because a partial record still dials.
 */
export function importContacts(
  text: string,
  options: ImportOptions,
): ImportResult {
  return importContactsFromRows(parseDelimited(text, detectDelimiter(text)), options)
}

/**
 * Import from already-parsed rows.
 *
 * CSV and XLSX differ only in how the bytes become a grid, so everything
 * after that point — header matching, normalisation, duplicate detection —
 * is shared. A spreadsheet upload gets exactly the same validation as a CSV.
 */
export function importContactsFromRows(
  rows: string[][],
  options: ImportOptions,
): ImportResult {
  const issues: ImportIssue[] = []

  if (rows.length < 2) {
    return {
      contacts: [],
      issues: [{ row: 0, reason: 'File has no data rows', raw: '' }],
      totalRows: Math.max(0, rows.length - 1),
      imported: 0,
      skippedDuplicates: 0,
      rejected: 0,
    }
  }

  const headers = rows[0]!
  const mapping = mapHeaders(headers)
  const dataRows = rows.slice(1)

  const seen = new Set(options.existingPhones ?? [])
  const contacts: Array<Omit<Contact, 'id'>> = []
  let skippedDuplicates = 0
  let rejected = 0

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 2 // 1-indexed, plus the header
    const raw = cells.join(', ').slice(0, 200)

    const get = (field: Field): string => {
      for (const [col, f] of mapping) {
        if (f === field) return (cells[col] ?? '').trim()
      }
      return ''
    }

    const phone = normalisePhone(get('phone'))
    if (!phone) {
      rejected++
      issues.push({
        row: rowNumber,
        reason: get('phone') ? 'Phone number is not a valid UK number' : 'No phone number',
        raw,
      })
      return
    }

    if (seen.has(phone)) {
      skippedDuplicates++
      return
    }
    seen.add(phone)

    // A single "name" column is common; split it rather than reject the row.
    let firstName = get('firstName')
    let lastName = get('lastName')
    if (firstName && !lastName && firstName.includes(' ')) {
      const parts = firstName.split(/\s+/)
      firstName = parts[0]!
      lastName = parts.slice(1).join(' ')
    }

    if (!firstName && !lastName) {
      rejected++
      issues.push({ row: rowNumber, reason: 'No name', raw })
      return
    }

    // Anything unmapped is kept verbatim — suppliers send fields we have not
    // seen yet, and throwing them away loses information we cannot recover.
    const extra: Record<string, string> = {}
    headers.forEach((header, col) => {
      if (mapping.has(col)) return
      const value = (cells[col] ?? '').trim()
      if (value) extra[header.trim()] = value
    })

    const altRaw = get('alternativePhone')
    const alt = altRaw ? normalisePhone(altRaw) : null
    const postcode = get('postcode') ? normalisePostcode(get('postcode')) : undefined

    contacts.push({
      batchId: options.batchId,
      campaignId: options.campaignId,
      ...(get('title') ? { title: titleCase(get('title')) } : {}),
      firstName: titleCase(firstName),
      lastName: titleCase(lastName),
      phone,
      ...(alt ? { alternativePhone: alt } : {}),
      ...(get('email') ? { email: get('email').toLowerCase() } : {}),
      ...(get('addressLine1') ? { addressLine1: get('addressLine1') } : {}),
      ...(get('addressLine2') ? { addressLine2: get('addressLine2') } : {}),
      ...(get('city') ? { city: titleCase(get('city')) } : {}),
      ...(postcode ? { postcode } : {}),
      extra,
      status: 'available',
      attempts: 0,
    })
  })

  return {
    contacts,
    issues: issues.slice(0, 200),
    totalRows: dataRows.length,
    imported: contacts.length,
    skippedDuplicates,
    rejected,
  }
}
