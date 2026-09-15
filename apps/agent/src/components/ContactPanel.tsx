import { useState } from 'react'
import type { Contact } from '@teleforce/core'
import { Badge, Button, Panel, StatusDot, cn } from '@teleforce/ui'

/**
 * The customer card.
 *
 * Agents dial manually, so the phone number is the single most important
 * element on this screen: large, monospaced for digit-by-digit reading, and
 * one click from the clipboard.
 */
export function ContactPanel({
  contact,
  elapsed,
}: {
  contact: Contact
  elapsed: string
}) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      // Clipboard can be blocked by permissions policy. The number is on
      // screen and selectable, so the agent is never stuck.
      setCopied('failed')
      window.setTimeout(() => setCopied(null), 2400)
    }
  }

  const fullName = [contact.title, contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(' ')

  const address = [
    contact.addressLine1,
    contact.addressLine2,
    contact.city,
    contact.postcode,
  ].filter(Boolean)

  return (
    <Panel as="aside" className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-pearl/10 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-pearl-faint">
            <StatusDot tone="gold" />
            On call · {elapsed}
          </span>
          <Badge tone="neutral">
            {contact.attempts === 0
              ? 'First attempt'
              : `Attempt ${contact.attempts + 1}`}
          </Badge>
        </div>

        <h2 className="mt-4 text-[1.55rem] leading-tight text-pearl">
          {fullName}
        </h2>
      </div>

      {/* Phone — the reason this panel exists */}
      <div className="border-b border-pearl/10 px-6 py-5">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-gold/80">
          Dial this number
        </p>

        <div className="mt-3 flex items-center gap-3">
          <span className="select-all font-mono text-[1.85rem] leading-none tracking-[0.02em] text-pearl">
            {formatPhone(contact.phone)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={copied === 'primary' ? 'success' : 'secondary'}
            onClick={() => copy(contact.phone, 'primary')}
            shortcut="C"
          >
            {copied === 'primary' ? 'Copied' : 'Copy number'}
          </Button>
          <a
            href={`tel:${contact.phone}`}
            className="inline-flex items-center border border-pearl/20 px-3 py-1.5 text-[12.5px] font-medium text-pearl transition-colors hover:border-gold/60 hover:text-gold"
          >
            Open in dialler
          </a>
        </div>

        {copied === 'failed' && (
          <p className="mt-3 text-[11.5px] text-warn">
            Clipboard is blocked in this browser — select the number above to
            copy it manually.
          </p>
        )}

        {contact.alternativePhone && (
          <button
            type="button"
            onClick={() => copy(contact.alternativePhone!, 'alt')}
            className={cn(
              'mt-4 flex w-full items-center justify-between border-t border-pearl/8 pt-3 text-left',
              'text-[13px] transition-colors hover:text-gold',
              copied === 'alt' ? 'text-ok' : 'text-pearl-dim',
            )}
          >
            <span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-pearl-faint">
                Alternative
              </span>
              <br />
              <span className="font-mono">{formatPhone(contact.alternativePhone)}</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
              {copied === 'alt' ? 'Copied' : 'Copy'}
            </span>
          </button>
        )}
      </div>

      {/* Everything else we know */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {address.length > 0 && (
          <Detail label="Address">
            <address className="not-italic leading-relaxed">
              {address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </Detail>
        )}

        {contact.email && <Detail label="Email">{contact.email}</Detail>}

        {Object.entries(contact.extra).map(([key, value]) => (
          <Detail key={key} label={key}>
            {value}
          </Detail>
        ))}

        {contact.notes && <Detail label="Previous notes">{contact.notes}</Detail>}
      </div>
    </Panel>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-pearl-faint">
        {label}
      </p>
      <div className="mt-1.5 text-[13.5px] text-pearl-dim">{children}</div>
    </div>
  )
}

/**
 * Group a UK number for reading aloud.
 *
 * Agents read these to customers and mistype them into diallers; grouping
 * cuts both errors. Falls back to the raw value for anything unexpected.
 */
export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('07')) {
    return `${d.slice(0, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  }
  if (d.length === 11 && d.startsWith('02')) {
    return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`
  }
  if (d.length === 11) return `${d.slice(0, 5)} ${d.slice(5)}`
  if (d.length === 10) return `${d.slice(0, 4)} ${d.slice(4)}`
  return phone
}
