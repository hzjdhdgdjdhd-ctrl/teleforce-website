import { describe, expect, it } from 'vitest'
import { deflateRawSync } from 'node:zlib'
import { columnIndex, importContactsFromRows, looksLikeXlsx, readXlsx } from '../src/domain/index'

/**
 * Builds a real .xlsx in memory — a ZIP of the XML parts Excel writes —
 * so the reader is tested against the actual format rather than a fixture
 * that happens to match its assumptions.
 */
function buildXlsx(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name)
    const raw = encoder.encode(content)
    const deflated = deflateRawSync(raw)
    const crc = crc32(raw)

    const local = new Uint8Array(30 + nameBytes.length + deflated.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(8, 8, true) // deflate
    lv.setUint32(14, crc, true)
    lv.setUint32(18, deflated.length, true)
    lv.setUint32(22, raw.length, true)
    lv.setUint16(26, nameBytes.length, true)
    local.set(nameBytes, 30)
    local.set(deflated, 30 + nameBytes.length)
    locals.push(local)

    const central = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(10, 8, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, deflated.length, true)
    cv.setUint32(24, raw.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint32(42, offset, true)
    central.set(nameBytes, 46)
    centrals.push(central)

    offset += local.length
  }

  const centralSize = centrals.reduce((n, c) => n + c.length, 0)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, centrals.length, true)
  ev.setUint16(10, centrals.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)

  const total = offset + centralSize + 22
  const out = new Uint8Array(total)
  let p = 0
  for (const b of [...locals, ...centrals, eocd]) {
    out.set(b, p)
    p += b.length
  }
  return out
}

function crc32(data: Uint8Array): number {
  let c = ~0
  for (const byte of data) {
    c ^= byte
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

const sheet = (rows: string) =>
  `<?xml version="1.0"?><worksheet><sheetData>${rows}</sheetData></worksheet>`

describe('columnIndex', () => {
  it('maps A1 references to zero-based columns', () => {
    expect(columnIndex('A1')).toBe(0)
    expect(columnIndex('B2')).toBe(1)
    expect(columnIndex('Z9')).toBe(25)
    expect(columnIndex('AA1')).toBe(26)
    expect(columnIndex('AB10')).toBe(27)
  })
})

describe('looksLikeXlsx', () => {
  it('recognises the ZIP signature', () => {
    expect(looksLikeXlsx(new Uint8Array([0x50, 0x4b, 3, 4, 0]))).toBe(true)
    expect(looksLikeXlsx(new TextEncoder().encode('name,phone\n'))).toBe(false)
  })
})

describe('readXlsx', () => {
  it('reads shared strings and inline values', async () => {
    const file = buildXlsx({
      'xl/sharedStrings.xml':
        '<?xml version="1.0"?><sst><si><t>Full Name</t></si><si><t>Telephone No.</t></si><si><t>Alan Whitfield</t></si></sst>',
      'xl/worksheets/sheet1.xml': sheet(
        '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
          '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>1132000000</v></c></row>',
      ),
    })

    const rows = await readXlsx(file)
    expect(rows[0]).toEqual(['Full Name', 'Telephone No.'])
    expect(rows[1]).toEqual(['Alan Whitfield', '1132000000'])
  })

  it('keeps empty cells in the right columns', async () => {
    // Excel omits empty cells entirely. Appending in order would shift every
    // later column left and silently misalign the whole file.
    const file = buildXlsx({
      'xl/worksheets/sheet1.xml': sheet(
        '<row r="1"><c r="A1" t="inlineStr"><is><t>a</t></is></c>' +
          '<c r="C1" t="inlineStr"><is><t>c</t></is></c></row>',
      ),
    })
    const rows = await readXlsx(file)
    expect(rows[0]).toEqual(['a', '', 'c'])
  })

  it('concatenates runs within one string', async () => {
    const file = buildXlsx({
      'xl/sharedStrings.xml':
        '<?xml version="1.0"?><sst><si><r><t>Ms </t></r><r><t>Aoife</t></r></si></sst>',
      'xl/worksheets/sheet1.xml': sheet('<row r="1"><c r="A1" t="s"><v>0</v></c></row>'),
    })
    expect((await readXlsx(file))[0]).toEqual(['Ms Aoife'])
  })

  it('decodes entities without double-decoding ampersands', async () => {
    const file = buildXlsx({
      'xl/sharedStrings.xml':
        '<?xml version="1.0"?><sst><si><t>Smith &amp;amp; Sons</t></si></sst>',
      'xl/worksheets/sheet1.xml': sheet('<row r="1"><c r="A1" t="s"><v>0</v></c></row>'),
    })
    expect((await readXlsx(file))[0]![0]).toBe('Smith &amp; Sons')
  })

  it('rejects a file that is not a workbook', async () => {
    await expect(readXlsx(new TextEncoder().encode('not a zip at all'))).rejects.toThrow(
      /not a valid/i,
    )
  })

  it('rejects a ZIP with no worksheet', async () => {
    const file = buildXlsx({ 'docProps/app.xml': '<Properties/>' })
    await expect(readXlsx(file)).rejects.toThrow(/no readable worksheet/i)
  })
})

describe('xlsx feeds the same import pipeline as csv', () => {
  it('normalises exactly as a CSV upload would', async () => {
    const file = buildXlsx({
      'xl/sharedStrings.xml':
        '<?xml version="1.0"?><sst>' +
        '<si><t>Full Name</t></si><si><t>Telephone No.</t></si><si><t>Post Code</t></si>' +
        '<si><t>alan whitfield</t></si><si><t>ls11ab</t></si>' +
        '</sst>',
      'xl/worksheets/sheet1.xml': sheet(
        '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>' +
          '<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2"><v>1132000000</v></c><c r="C2" t="s"><v>4</v></c></row>',
      ),
    })

    const rows = await readXlsx(file)
    const result = importContactsFromRows(rows, { campaignId: 'c1', batchId: 'b1' })

    expect(result.imported).toBe(1)
    expect(result.contacts[0]).toMatchObject({
      firstName: 'Alan',
      lastName: 'Whitfield',
      // The spreadsheet stored the number numerically and lost the leading
      // zero. The shared pipeline restores it.
      phone: '01132000000',
      postcode: 'LS1 1AB',
    })
  })
})
