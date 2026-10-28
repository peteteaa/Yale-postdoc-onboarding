'use client'

import { signOut } from '#/app/login/actions'
import type { CurrentUser } from '#/lib/auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type Tab = {
  label: string
  to?: '/' | '/checklist' | '/workbook' | '/settings'
}

// TODO: add `to` to each tab as its page gets built
const TABS: Tab[] = [
  { label: 'Home', to: '/' },
  { label: 'Checklist', to: '/checklist' },
  { label: 'My first-year plan' },
  { label: 'Workbook', to: '/workbook' },
  { label: 'IDP builder' },
  { label: 'Events & programs' },
  { label: 'Resources' },
  { label: 'Settings', to: '/settings' },
]

const TAB_LINK =
  'block border-b border-line py-3 text-medium text-ink no-underline md:border-b-3 md:border-transparent md:pt-3.5 md:pb-2.75 md:hover:border-line aria-[current=page]:font-semibold max-md:aria-[current=page]:pl-3.5 max-md:aria-[current=page]:text-yale-blue max-md:aria-[current=page]:shadow-[inset_4px_0_0_var(--color-yale-blue)] md:aria-[current=page]:border-yale-blue'

/** "Priya Raman" → "PR", "guest" or "priya@example.com" → "G" or "P". */
function initialsOf(name: string) {
  const words = name.includes('@') ? [name] : name.split(/\s+/)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * The Yale header (signature, rule, site title, signed-in user, Sign out) and
 * the main tabs. On phones the tabs collapse into a Menu button. Admin pages
 * get no tabs, and signed-out visitors (the sign-in page) get neither.
 */
export function SiteHeader({ user }: { user: CurrentUser | null }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const current = TABS.find((tab) => tab.to === pathname)
  // Staff pages have their own tabs instead
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')

  return (
    <>
      <header className="bg-yale-blue text-paper [&_:focus-visible]:outline-blue-light">
        <div className="mx-auto max-w-page px-4 pt-3 pb-3.5 md:px-10 md:pt-4.5 md:pb-5.5">
          <a
            href="https://www.yale.edu"
            className="inline-block font-serif text-signature text-paper no-underline"
          >
            Yale University
          </a>
          <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-head-rule pt-2.5 md:mt-3.5 md:pt-4">
            <Link
              href="/"
              className="font-serif text-site-title text-paper no-underline"
            >
              Postdoc Onboarding
            </Link>
            {user && (
              <div className="flex min-w-0 items-center gap-2.5 text-small whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className="grid size-7.5 shrink-0 place-items-center rounded-full bg-paper text-label-sm font-semibold text-yale-blue md:size-8.5 md:text-label"
                >
                  {initialsOf(user.name)}
                </span>
                <span className="truncate max-md:sr-only">{user.name}</span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="ml-1.5 cursor-pointer font-semibold text-paper underline underline-offset-3"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {user && !isAdmin && (
        <nav aria-label="Main" className="border-b border-line bg-paper">
          <div className="mx-auto max-w-page px-4 md:px-10">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="main-tabs"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex min-h-12.5 w-full cursor-pointer items-center justify-between text-medium font-semibold md:hidden"
            >
              Menu
              {current && (
                <span className="font-normal text-ink-2">{current.label}</span>
              )}
            </button>
            <ul
              id="main-tabs"
              className={`${menuOpen ? 'flex' : 'hidden'} flex-col pb-2 md:flex md:flex-row md:flex-wrap md:gap-x-7 md:pb-0`}
            >
              {TABS.map((tab) => (
                <li key={tab.label}>
                  {tab.to ? (
                    <Link
                      href={tab.to}
                      aria-current={tab.to === pathname ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                      className={TAB_LINK}
                    >
                      {tab.label}
                    </Link>
                  ) : (
                    <a href="#" className={TAB_LINK}>
                      {tab.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </>
  )
}
