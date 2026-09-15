/**
 * Minimal XLSX reader.
 *
 * Written rather than pulled in. This page handles other people's personal
 * data, and a spreadsheet parser is a large attack surface to take on trust:
 * the popular library is ~1 MB, has a history of prototype-pollution and
 * ReDoS advisories, and is no longer published to npm by its maintainers.
 *
 * An .xlsx file is a ZIP of XML. Browsers and Node both ship
 * DecompressionStream now, so inflating it needs no dependency at all. We
 * read exactly what a contact import needs — the first worksheet, as text —
 * and deliberately support nothing else: no formulas, no macros, no
 * external references.
 */

/* ------------------------------------------------------------------ */
/* ZIP                                                                 */
/* ------------------------------------------------------------------ */

interface ZipEntry {
  name: string
  compressed: boolean
  data: Uint8Array
}

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_SIGNATURE = 0x02014b50

export class XlsxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'XlsxError'
  }
}

function readEntries(buf: Uint8Array): Map<string, ZipEntry> {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

  // The end-of-central-directory record sits at the tail, after a comment of
  // unknown length, so it is found by scanning backwards for its signature.
  let eocd = -1
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 65_558; i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) {
      eocd = i
      break
    }
  }
  if (eocd === -1) throw new XlsxError('Not a valid .xlsx file (no ZIP directory)')

  const count = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)

  const entries = new Map<string, ZipEntry>()

  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== CENTRAL_SIGNATURE) break

    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)

    const name = new TextDecoder().decode(
      buf.subarray(offset + 46, offset + 46 + nameLength),
    )

    // The local header repeats the name and extra fields, with its own
    // lengths — the central directory's extra length does not apply here.
    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const dataStart = localOffset + 30 + localNameLength + localExtraLength

    entries.set(name, {
      name,
      compressed: method === 8,
      data: buf.subarray(dataStart, dataStart + compressedSize),
    })

    offset += 46 + nameLength + extraLength + commentLength
  }

  return entries
}

async function inflate(entry: ZipEntry): Promise<string> {
  if (!entry.compressed) return new TextDecoder().decode(entry.data)

  if (typeof DecompressionStream === 'undefined') {
    throw new XlsxError(
      'This browser cannot read .xlsx files. Save the file as CSV and upload that instead.',
    )
  }

  // subarray() returns a view onto the parent buffer, typed as
  // ArrayBufferLike; copy it so Blob gets a plain ArrayBuffer.
  const copy = new Uint8Array(entry.data.length)
  copy.set(entry.data)

  const stream = new Blob([copy.buffer])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'))
  return new Response(stream).text()
}

/* ------------------------------------------------------------------ */
/* XML                                                                 */
/* ------------------------------------------------------------------ */

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    // Ampersand last, or an escaped entity would be decoded twice.
    .replace(/&amp;/g, '&')
}

/** Shared strings are stored once and referenced by index from each cell. */
function parseSharedStrings(xml: string): string[] {
  const out: string[] = []
  for (const si of xml.match(/<si\b[\s\S]*?<\/si>/g) ?? []) {
    // A string can be split across runs; concatenate every <t> inside it.
    const parts = si.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) ?? []
    out.push(
      parts
        .map((t) => decodeEntities(t.replace(/<t\b[^>]*>|<\/t>/g, '')))
        .join(''),
    )
  }
  return out
}

/** Convert an A1-style reference to a zero-based column index. */
export function columnIndex(ref: string): number {
  const letters = ref.replace(/\d+/g, '')
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Read the first worksheet of an .xlsx file as rows of text.
 *
 * Values come back as strings deliberately: a phone number stored as a
 * number has already lost its leading zero, and the import pipeline restores
 * it. Converting to number here would lose it again.
 */
export async function readXlsx(bytes: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const entries = readEntries(buf)

  const sheetEntry =
    entries.get('xl/worksheets/sheet1.xml') ??
    [...entries.values()].find((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name))

  if (!sheetEntry) {
    throw new XlsxError('That workbook has no readable worksheet')
  }

  const sharedEntry = entries.get('xl/sharedStrings.xml')
  const shared = sharedEntry ? parseSharedStrings(await inflate(sharedEntry)) : []
  const sheet = await inflate(sheetEntry)

  const rows: string[][] = []

  for (const rowXml of sheet.match(/<row\b[\s\S]*?(?:\/>|<\/row>)/g) ?? []) {
    const cells: string[] = []

    for (const cellXml of rowXml.match(/<c\b[\s\S]*?(?:\/>|<\/c>)/g) ?? []) {
      const ref = cellXml.match(/\br="([A-Z]+\d+)"/)?.[1]
      const type = cellXml.match(/\bt="([^"]+)"/)?.[1]

      let value = ''

      if (type === 'inlineStr') {
        const parts = cellXml.match(/<t\b[^>]*>([\s\S]*?)<\/t>/g) ?? []
        value = parts
          .map((t) => decodeEntities(t.replace(/<t\b[^>]*>|<\/t>/g, '')))
          .join('')
      } else {
        const raw = cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1]
        if (raw !== undefined) {
          const decoded = decodeEntities(raw)
          if (type === 's') {
            value = shared[Number(decoded)] ?? ''
          } else if (type === 'b') {
            value = decoded === '1' ? 'TRUE' : 'FALSE'
          } else {
            // Everything else stays as written. A phone number stored as a
            // number has already lost its leading zero; the import pipeline
            // restores it, and coercing to Number here would lose it again.
            value = decoded
          }
        }
      }

      // Honour the cell reference: an empty cell is omitted from the XML
      // entirely, so appending in order would shift every later column left.
      if (ref) {
        const col = columnIndex(ref)
        while (cells.length < col) cells.push('')
        cells[col] = value
      } else {
        cells.push(value)
      }
    }

    rows.push(cells)
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** True when the bytes look like a ZIP, which every .xlsx is. */
export function looksLikeXlsx(bytes: ArrayBuffer | Uint8Array): boolean {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return b.length > 4 && b[0] === 0x50 && b[1] === 0x4b
}
