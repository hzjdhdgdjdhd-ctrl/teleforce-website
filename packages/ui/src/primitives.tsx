import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gold text-obsidian hover:bg-gold-300 disabled:hover:bg-gold ' +
    'shadow-[0_0_0_0_rgba(212,175,55,0.4)] hover:shadow-[0_6px_24px_-8px_rgba(212,175,55,0.55)]',
  secondary:
    'border border-pearl/20 text-pearl hover:border-gold/60 hover:text-gold hover:bg-gold/[0.05]',
  ghost: 'text-pearl-dim hover:text-pearl hover:bg-pearl/[0.06]',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10 hover:border-danger',
  success: 'border border-ok/40 text-ok hover:bg-ok/10 hover:border-ok',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12.5px] gap-1.5',
  md: 'px-4.5 py-2.5 text-[13.5px] gap-2',
  lg: 'px-6 py-3.5 text-[15px] gap-2.5',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Keyboard shortcut rendered on the right of the label. */
  shortcut?: string
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  shortcut,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium select-none',
        'transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
      {shortcut && <Kbd className="ml-1.5 opacity-60">{shortcut}</Kbd>}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Keyboard hint                                                       */
/* ------------------------------------------------------------------ */

export function Kbd({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[3px]',
        'border border-current/25 px-1 font-mono text-[10px] leading-none',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Panel({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'aside'
}) {
  return <Tag className={cn('panel', className)}>{children}</Tag>
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="h-px w-5 bg-gold/50" aria-hidden="true" />
      <span className="eyebrow">{children}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'info' | 'gold'

const TONES: Record<Tone, string> = {
  neutral: 'border-pearl/20 text-pearl-dim bg-pearl/[0.04]',
  ok: 'border-ok/35 text-ok bg-ok/[0.08]',
  warn: 'border-warn/35 text-warn bg-warn/[0.08]',
  danger: 'border-danger/35 text-danger bg-danger/[0.08]',
  info: 'border-ice/35 text-ice bg-ice/[0.08]',
  gold: 'border-gold/35 text-gold bg-gold/[0.08]',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  title,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
  /** Native tooltip — useful for explaining a status without cluttering it. */
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-0.5',
        'font-mono text-[10.5px] uppercase tracking-[0.12em]',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Small pulsing dot used for live status in the wallboard and headers. */
export function StatusDot({ tone = 'neutral' }: { tone?: Tone }) {
  const color: Record<Tone, string> = {
    neutral: 'bg-pearl-faint',
    ok: 'bg-ok',
    warn: 'bg-warn',
    danger: 'bg-danger',
    info: 'bg-ice',
    gold: 'bg-gold',
  }
  return (
    <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
      <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-70 animate-pulse-soft', color[tone])} />
      <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', color[tone])} />
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Forms                                                               */
/* ------------------------------------------------------------------ */

export const inputClass =
  'w-full border border-pearl/12 bg-pearl/[0.02] px-3.5 py-2.5 text-[14px] text-pearl ' +
  'placeholder:text-pearl-faint transition-colors duration-200 ' +
  'focus:border-gold/60 focus:bg-pearl/[0.04] focus:outline-none'

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="flex items-baseline gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-pearl-faint">
        {label}
        {required && <span className="text-gold/70">*</span>}
      </span>
      <div className="mt-2">{children}</div>
      {hint && !error && (
        <span className="mt-1.5 block text-[11.5px] text-pearl-faint">{hint}</span>
      )}
      {error && <span className="mt-1.5 block text-[11.5px] text-danger">{error}</span>}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-5 text-exec-300">{icon}</div>}
      <h3 className="text-[17px] text-pearl">{title}</h3>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-pearl-dim">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
