import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'

interface BaseProps {
  children: ReactNode
  variant?: Variant
  className?: string
  icon?: boolean
}

const base =
  'group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-[13px] font-medium tracking-[0.02em] ' +
  'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] select-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-gold text-obsidian hover:bg-gold-300 shadow-[0_0_0_0_rgba(212,175,55,0.4)] ' +
    'hover:shadow-[0_8px_32px_-8px_rgba(212,175,55,0.55)] hover:-translate-y-0.5',
  secondary:
    'border border-pearl/20 text-pearl hover:border-gold/60 hover:text-gold ' +
    'hover:bg-gold/[0.04] hover:-translate-y-0.5',
  ghost:
    'text-pearl-dim hover:text-gold px-0 py-1 hover:gap-3.5',
}

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path
        d="M1 7h11M7.5 2.5 12 7l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ButtonLink({
  to,
  children,
  variant = 'primary',
  className,
  icon = true,
}: BaseProps & { to: string }) {
  const external = to.startsWith('http') || to.startsWith('mailto:')

  const content = (
    <>
      {children}
      {icon && <Arrow />}
    </>
  )

  if (external) {
    return (
      <a
        href={to}
        className={cn(base, variants[variant], className)}
        {...(to.startsWith('http')
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {content}
      </a>
    )
  }

  return (
    <Link to={to} className={cn(base, variants[variant], className)}>
      {content}
    </Link>
  )
}

export function Button({
  children,
  variant = 'primary',
  className,
  icon = true,
  ...rest
}: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], className)} {...rest}>
      {children}
      {icon && <Arrow />}
    </button>
  )
}
