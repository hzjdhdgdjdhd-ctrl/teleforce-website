import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import Reveal from './Reveal'

/** Page gutter. One container width used everywhere for a consistent grid. */
export function Container({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1280px] px-6 lg:px-10', className)}>
      {children}
    </div>
  )
}

/** The mono micro-label that anchors every section. */
export function Eyebrow({
  children,
  index,
  className,
}: {
  children: ReactNode
  index?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="h-px w-8 bg-gold/50" aria-hidden="true" />
      <span className="eyebrow">
        {index && <span className="text-gold/75">{index} / </span>}
        {children}
      </span>
    </div>
  )
}

interface SectionHeadingProps {
  eyebrow?: ReactNode
  index?: string
  title: ReactNode
  lede?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  index,
  title,
  lede,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <Eyebrow
            index={index}
            className={align === 'center' ? 'justify-center' : undefined}
          >
            {eyebrow}
          </Eyebrow>
        </Reveal>
      )}
      <Reveal delay={0.06}>
        <h2 className="mt-6 text-[clamp(1.9rem,4vw,3.1rem)] leading-[1.08] text-gradient-pearl">
          {title}
        </h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.12}>
          <p className="mt-6 text-[15px] leading-[1.75] text-pearl-dim md:text-base">
            {lede}
          </p>
        </Reveal>
      )}
    </div>
  )
}

/** Standard vertical rhythm for a page section. */
export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('relative py-24 md:py-32', className)}>
      {children}
    </section>
  )
}

/** Thin gold-to-transparent divider used between major bands. */
export function Hairline({ className }: { className?: string }) {
  return <div className={cn('hairline w-full', className)} aria-hidden="true" />
}
