import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/**
 * The enterprise surface card.
 *
 * A gold hairline sweeps across the top edge on hover and the panel lifts a
 * couple of pixels — enough to feel responsive, restrained enough to survive
 * a boardroom screenshot.
 */
export function Card({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'panel group relative overflow-hidden',
        interactive &&
          'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
            'hover:-translate-y-1 hover:border-gold/30 ' +
            'hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]',
        className,
      )}
    >
      {interactive && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-gold via-gold/40 to-transparent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
        />
      )}
      {children}
    </div>
  )
}

interface ServiceCardProps {
  index: string
  title: string
  summary: string
  points: readonly string[]
  to?: string
  icon?: ReactNode
}

export function ServiceCard({
  index,
  title,
  summary,
  points,
  to,
  icon,
}: ServiceCardProps) {
  const inner = (
    <Card interactive className="flex h-full flex-col p-7 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-[11px] tracking-[0.2em] text-gold/75">
          {index}
        </span>
        {icon && (
          <span className="text-exec-300 transition-colors duration-500 group-hover:text-gold">
            {icon}
          </span>
        )}
      </div>

      <h3 className="mt-7 text-xl leading-snug text-pearl lg:text-[1.35rem]">
        {title}
      </h3>

      <p className="mt-3.5 text-[14.5px] leading-[1.7] text-pearl-dim">
        {summary}
      </p>

      <ul className="mt-6 space-y-2.5 border-t border-pearl/8 pt-6">
        {points.map((p) => (
          <li
            key={p}
            className="flex items-start gap-3 text-[13.5px] leading-relaxed text-pearl-faint"
          >
            <span
              className="mt-[7px] h-1 w-1 shrink-0 bg-gold/70"
              aria-hidden="true"
            />
            {p}
          </li>
        ))}
      </ul>

      {to && (
        <span className="mt-7 inline-flex items-center gap-2 text-[13px] font-medium text-gold/80 transition-all duration-300 group-hover:gap-3.5 group-hover:text-gold">
          Explore
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 7h11M7.5 2.5 12 7l-4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </Card>
  )

  return to ? (
    <Link to={to} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  )
}
