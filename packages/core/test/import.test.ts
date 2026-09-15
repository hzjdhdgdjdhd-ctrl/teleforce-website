import { describe, expect, it } from 'vitest'
import {
  detectDelimiter,
  importContacts,
  mapHeaders,
  normalisePhone,
  normalisePostcode,
  parseDelimited,
} from '../src/domain/import'
import { can, type Role } from '../src/domain/types'

const opts = { campaignId: 'c1', batchId: 'b1' }

describe('parseDelimited', () => {
  it('handles quoted fields containing the delimiter', () => {
    const rows = parseDelimited('name,address\n"Smith, John","1 High St, Leeds"')
    expect(rows[1]).toEqual(['Smith, John', '1 High St, Leeds'])
  })

  it('handles escaped quotes', () => {
    expect(parseDelimited('a\n"He said ""hi"""')[1]).toEqual(['He said "hi"'])
  })

  it('handles embedded newlines inside quotes', () => {
    const rows = parseDelimited('a,b\n"line1\nline2",x')
    expect(rows).toHaveLength(2)
    expect(rows[1]![0]).toBe('line1\nline2')
  })

  it('strips a UTF-8 BOM so the first header is not corrupted', () => {
    const rows = parseDelimited('﻿phone,name\n01132000000,Jo')
    expect(rows[0]![0]).toBe('phone')
  })

  it('handles CRLF line endings', () => {
    expect(parseDelimited('a,b\r\n1,2')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('drops blank rows', () => {
    expect(parseDelimited('a\n1\n\n\n2')).toHaveLength(3)
  })
})

describe('detectDelimiter', () => {
  it('detects tabs and semicolons', () => {
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t')
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';')
    expect(detectDelimiter('a,b\n1,2')).toBe(',')
  })
})

describe('normalisePhone', () => {
  it('normalises the formats suppliers actually send', () => {
    expect(normalisePhone('+44 113 200 0000')).toBe('01132000000')
    expect(normalisePhone('0044 113 200 0000')).toBe('01132000000')
    expect(normalisePhone('(01132) 000000')).toBe('01132000000')
    expect(normalisePhone('07700-900-123')).toBe('07700900123')
  })

  it('restores a leading zero lost by a spreadsheet export', () => {
    expect(normalisePhone('7700900123')).toBe('07700900123')
  })

  it('rejects numbers that cannot be UK subscriber numbers', () => {
    expect(normalisePhone('123')).toBeNull()
    expect(normalisePhone('abcdefghijk')).toBeNull()
    expect(normalisePhone('')).toBeNull()
    expect(normalisePhone('012345678901234')).toBeNull()
  })
})

describe('normalisePostcode', () => {
  it('formats to outward/inward', () => {
    expect(normalisePostcode('ls11ab')).toBe('LS1 1AB')
    expect(normalisePostcode('SW1A 1AA')).toBe('SW1A 1AA')
  })

  it('leaves clearly wrong values alone rather than mangling them', () => {
    expect(normalisePostcode('N/A')).toBe('N/A')
  })
})

describe('mapHeaders', () => {
  it('recognises varied spellings', () => {
    const m = mapHeaders(['Surname', 'Forename', 'Telephone No.', 'Post Code'])
    expect(m.get(0)).toBe('lastName')
    expect(m.get(1)).toBe('firstName')
    expect(m.get(2)).toBe('phone')
    expect(m.get(3)).toBe('postcode')
  })

  it('treats a mobile column alongside phone as the alternative number', () => {
    const m = mapHeaders(['phone', 'mobile'])
    expect(m.get(0)).toBe('phone')
    expect(m.get(1)).toBe('alternativePhone')
  })

  it('collapses "No." suffixes so common headers match', () => {
    const m = mapHeaders(['Telephone No.', 'Contact Number', 'Mobile No'])
    expect(m.get(0)).toBe('phone')
    expect(m.get(2)).toBe('alternativePhone')
  })
})

describe('importContacts', () => {
  it('imports a well-formed file', () => {
    const csv = [
      'Title,First Name,Last Name,Telephone,Address,Town,Postcode',
      'mr,john,smith,01132000000,1 High Street,leeds,ls11ab',
      'mrs,jane,doe,+447700900123,2 Low Road,york,yo1 9xx',
    ].join('\n')

    const r = importContacts(csv, opts)
    expect(r.imported).toBe(2)
    expect(r.rejected).toBe(0)
    expect(r.contacts[0]).toMatchObject({
      title: 'Mr',
      firstName: 'John',
      lastName: 'Smith',
      phone: '01132000000',
      city: 'Leeds',
      postcode: 'LS1 1AB',
      status: 'available',
      attempts: 0,
    })
    expect(r.contacts[1]!.phone).toBe('07700900123')
  })

  it('splits a single name column', () => {
    const r = importContacts('Name,Phone\nJohn Smith,01132000000', opts)
    expect(r.contacts[0]).toMatchObject({ firstName: 'John', lastName: 'Smith' })
  })

  it('preserves unmapped columns verbatim rather than discarding them', () => {
    const csv = 'First Name,Phone,Supplier Ref,Lead Source\nJo,01132000000,ABC-9,Facebook'
    const r = importContacts(csv, opts)
    expect(r.contacts[0]!.extra).toEqual({
      'Supplier Ref': 'ABC-9',
      'Lead Source': 'Facebook',
    })
  })

  it('rejects rows with no usable phone and explains why', () => {
    const r = importContacts('Name,Phone\nJo Bloggs,not-a-number\nAmy Lee,01132000000', opts)
    expect(r.imported).toBe(1)
    expect(r.rejected).toBe(1)
    expect(r.issues[0]).toMatchObject({ row: 2, reason: expect.stringContaining('valid UK') })
  })

  it('rejects rows with no name', () => {
    const r = importContacts('Name,Phone\n,01132000000', opts)
    expect(r.rejected).toBe(1)
    expect(r.issues[0]!.reason).toBe('No name')
  })

  it('skips duplicates within the file', () => {
    const csv = 'Name,Phone\nA B,01132000000\nC D,+44 113 200 0000'
    const r = importContacts(csv, opts)
    expect(r.imported).toBe(1)
    expect(r.skippedDuplicates).toBe(1)
  })

  it('skips numbers already in the system', () => {
    const r = importContacts('Name,Phone\nA B,01132000000', {
      ...opts,
      existingPhones: new Set(['01132000000']),
    })
    expect(r.imported).toBe(0)
    expect(r.skippedDuplicates).toBe(1)
  })

  it('reports an empty file rather than throwing', () => {
    const r = importContacts('', opts)
    expect(r.imported).toBe(0)
    expect(r.issues[0]!.reason).toContain('no data rows')
  })

  it('caps stored issues so one bad file cannot bloat the batch document', () => {
    const rows = ['Name,Phone', ...Array.from({ length: 500 }, (_, i) => `P${i},bad`)]
    const r = importContacts(rows.join('\n'), opts)
    expect(r.rejected).toBe(500)
    expect(r.issues.length).toBe(200)
  })
})

describe('role capabilities', () => {
  it('grants admins campaign management and agents only call work', () => {
    expect(can('admin', 'campaign.manage')).toBe(true)
    expect(can('agent', 'call.work')).toBe(true)
    expect(can('agent', 'campaign.manage' as never)).toBe(false)
    expect(can('qa', 'qa.review')).toBe(true)
    expect(can('qa', 'contacts.upload' as never)).toBe(false)
  })

  it('covers every role', () => {
    const roles: Role[] = ['admin', 'supervisor', 'qa', 'agent']
    for (const r of roles) expect(can(r, 'report.view' as never)).toBeTypeOf('boolean')
  })
})
