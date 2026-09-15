import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Stagger index — multiplied into the delay. */
  index?: number
  delay?: number
  y?: number
  as?: 'div' | 'li' | 'section' | 'article'
}

/**
 * Scroll-triggered entrance. One wrapper used site-wide so the whole page
 * shares a single motion signature rather than a patchwork of easings.
 */
export default function Reveal({
  children,
  className,
  index = 0,
  delay = 0,
  y = 24,
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion()
  const MotionTag = motion[as]

  if (reduced) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.7,
        delay: delay + index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionTag>
  )
}
