import { useState, type FormEvent } from 'react'
import { Button, inputClass, cn } from '@teleforce/ui'

/**
 * Pull up a specific contact by number.
 *
 * For a customer ringing back, or a callback the agent has on a note. Agents
 * cannot browse the contact list — deliberately — so this confirms a number
 * they already have rather than letting them search.
 */
export function PhoneLookup({
  onLookup,
  className,
}: {
  onLookup: (phone: string) => Promise<boolean>
  className?: string
}) {
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = phone.trim()
    if (!value) return
    setBusy(true)
    const found = await onLookup(value)
    setBusy(false)
    if (found) setPhone('')
  }

  return (
    <form onSubmit={submit} className={cn('flex gap-2', className)}>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Paste a number to pull up that contact"
        className={cn(inputClass, 'font-mono')}
        aria-label="Find a contact by phone number"
        autoComplete="off"
      />
      <Button type="submit" variant="secondary" disabled={busy || !phone.trim()}>
        {busy ? 'Finding…' : 'Find'}
      </Button>
    </form>
  )
}
