import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from '@/assets/Logo'
import { Container } from '@/components/ui/Section'
import { company } from '@/config/company'
import { cn } from '@/lib/cn'
import { services } from '@/data/services'

/* ---------------------------------------------------------------- */

interface NavChild {
  label: string
  to: string
  blurb: string
}

interface NavItem {
  label: string
  to: string
  children?: NavChild[]
}

const NAV: NavItem[] = [
  {
    label: 'Services',
    to: '/services',
    children: services.map((s) => ({
      label: s.title,
      to: `/services#${s.id}`,
      blurb: s.short,
    })),
  },
  {
    label: 'Technology',
    to: '/technology',
    children: [
      {
        label: 'Front End',
        to: '/technology#frontend',
        blurb: 'Agent workspaces, client portals and operational dashboards',
      },
      {
        label: 'Back End',
        to: '/technology#backend',
        blurb: 'Integration, access control, workflow and reporting pipelines',
      },
    ],
  },
  {
    label: 'Dedicated Teams',
    to: '/teams',
  },
  {
    label: 'Data Protection',
    to: '/data-protection',
  },
  {
    label: 'Company',
    to: '/company',
  },
]

/* ---------------------------------------------------------------- */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close every menu when the location changes.
     Adjusting state during render is React's documented pattern for reacting
     to a changed input: it settles before paint (so the drawer never flashes
     over the new page) and it covers back/forward navigation as well as
     clicks on our own links. */
  const locationKey = location.pathname + location.hash
  const [lastLocationKey, setLastLocationKey] = useState(locationKey)
  if (lastLocationKey !== locationKey) {
    setLastLocationKey(locationKey)
    setMobileOpen(false)
    setOpenMenu(null)
  }

  /* Lock body scroll behind the mobile drawer */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        scrolled
          ? 'border-b border-pearl/8 bg-obsidian/85 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
      onMouseLeave={() => setOpenMenu(null)}
    >
      {/* ---- Utility bar ---- */}
      <div
        className={cn(
          'hidden overflow-hidden border-b border-pearl/6 transition-all duration-500 lg:block',
          scrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100',
        )}
      >
        <Container>
          <div className="flex h-9 items-center justify-between font-mono text-[10.5px] tracking-[0.16em] text-pearl-faint uppercase">
            <span>
              Human-powered business operations · Delivering to{' '}
              {company.marketsShort}
            </span>
            <span className="flex items-center gap-5">
              <span className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
                Company status: {company.status}
              </span>
              <span className="text-pearl/15">|</span>
              <span>CIN {company.cin}</span>
            </span>
          </div>
        </Container>
      </div>

      {/* ---- Primary bar ---- */}
      <Container>
        <nav
          className="flex h-[72px] items-center justify-between gap-6"
          aria-label="Primary"
        >
          <Link
            to="/"
            className="shrink-0 transition-opacity duration-300 hover:opacity-85"
            aria-label={`${company.shortName} — home`}
          >
            <Logo variant="reversed" className="h-11 w-auto" />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const isOpen = openMenu === item.label
              return (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() =>
                    setOpenMenu(item.children ? item.label : null)
                  }
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-1.5 px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-300',
                        isActive
                          ? 'text-gold'
                          : 'text-pearl/75 hover:text-pearl',
                      )
                    }
                  >
                    {item.label}
                    {item.children && (
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 10 10"
                        fill="none"
                        className={cn(
                          'mt-px transition-transform duration-300',
                          isOpen && 'rotate-180',
                        )}
                        aria-hidden="true"
                      >
                        <path
                          d="M1.5 3.5 5 7l3.5-3.5"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </NavLink>

                  {/* Mega menu */}
                  <AnimatePresence>
                    {item.children && isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{
                          duration: 0.24,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className={cn(
                          'absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3',
                          item.children.length > 3 ? 'w-[620px]' : 'w-[400px]',
                        )}
                      >
                        <div className="panel overflow-hidden shadow-[0_32px_80px_-24px_rgba(0,0,0,0.95)]">
                          <div className="hairline" />
                          <div
                            className={cn(
                              'grid gap-px bg-pearl/6',
                              item.children.length > 3
                                ? 'grid-cols-2'
                                : 'grid-cols-1',
                            )}
                          >
                            {item.children.map((child) => (
                              <Link
                                key={child.to}
                                to={child.to}
                                className="group/item bg-navy-700 px-5 py-4 transition-colors duration-300 hover:bg-exec-700/50"
                              >
                                <span className="flex items-center justify-between gap-3">
                                  <span className="text-[13.5px] font-medium text-pearl transition-colors group-hover/item:text-gold">
                                    {child.label}
                                  </span>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    className="shrink-0 -translate-x-1 text-gold opacity-0 transition-all duration-300 group-hover/item:translate-x-0 group-hover/item:opacity-100"
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
                                </span>
                                <span className="mt-1.5 block text-[12px] leading-relaxed text-pearl-faint">
                                  {child.blurb}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>

          {/* Desktop CTA */}
          <Link
            to="/contact"
            className="hidden shrink-0 items-center gap-2 border border-gold/45 bg-gold/[0.06] px-5 py-2.5 text-[13px] font-medium text-gold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gold hover:bg-gold hover:text-obsidian lg:inline-flex"
          >
            Start a conversation
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span
              className={cn(
                'h-[1.5px] w-6 bg-pearl transition-all duration-300',
                mobileOpen && 'translate-y-[6px] rotate-45',
              )}
            />
            <span
              className={cn(
                'h-[1.5px] w-6 bg-pearl transition-all duration-300',
                mobileOpen && 'opacity-0',
              )}
            />
            <span
              className={cn(
                'h-[1.5px] w-6 bg-pearl transition-all duration-300',
                mobileOpen && '-translate-y-[6px] -rotate-45',
              )}
            />
          </button>
        </nav>
      </Container>

      {/* ---- Mobile drawer ---- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 top-[72px] z-40 overflow-y-auto border-t border-pearl/8 bg-obsidian/98 backdrop-blur-xl lg:hidden"
          >
            <Container className="py-8">
              <ul className="divide-y divide-pearl/8">
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.35 }}
                  >
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between py-5 text-lg',
                          isActive ? 'text-gold' : 'text-pearl',
                        )
                      }
                    >
                      {item.label}
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="text-pearl-faint"
                        aria-hidden="true"
                      >
                        <path
                          d="M1 7h11M7.5 2.5 12 7l-4.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </NavLink>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.4 }}
                className="mt-10"
              >
                <Link
                  to="/contact"
                  className="flex w-full items-center justify-center gap-2 bg-gold px-6 py-4 text-sm font-medium text-obsidian"
                >
                  Start a conversation
                </Link>
                <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.16em] text-pearl-faint">
                  CIN {company.cin}
                </p>
              </motion.div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
