import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Restores the top of the page on route change, and scrolls to the anchor
 * when a hash is present — accounting for the fixed header height.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // Let the new route paint before measuring the target.
      const id = hash.slice(1)
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (!el) return
        const top =
          el.getBoundingClientRect().top + window.scrollY - 100
        window.scrollTo({
          top,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        })
      })
      return
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}
