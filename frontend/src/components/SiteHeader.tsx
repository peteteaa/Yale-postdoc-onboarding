import { FULL_NAME } from '#/data/postdoc'
import { Link, useLocation } from '@tanstack/react-router'
import { useState } from 'react'

type Tab = { label: string; to?: '/' | '/checklist' }

// TODO: add `to` to each tab as its page gets built
const TABS: Tab[] = [
  { label: 'Home', to: '/' },
  { label: 'Checklist', to: '/checklist' },
  { label: 'My first-year plan' },
  { label: 'Workbook' },
  { label: 'IDP builder' },
  { label: 'Events & programs' },
  { label: 'Resources' },
  { label: 'Settings' },
]

const TAB_LINK =
  'block border-b border-line py-3 text-medium text-ink no-underline md:border-b-3 md:border-transparent md:pt-3.5 md:pb-2.75 md:hover:border-line aria-[current=page]:font-semibold max-md:aria-[current=page]:pl-3.5 max-md:aria-[current=page]:text-yale-blue max-md:aria-[current=page]:shadow-[inset_4px_0_0_var(--color-yale-blue)] md:aria-[current=page]:border-yale-blue'

/**
 * The Yale header (signature, rule, site title, signed-in postdoc) and the main
 * tabs. On phones the tabs collapse into a Menu button.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = useLocation({ select: (location) => location.pathname })
  const current = TABS.find((tab) => tab.to === pathname)
  const initials = FULL_NAME.split(' ')
    .map((part) => part[0])
    .join('')

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
          <div className="mt-2.5 flex items-end justify-between gap-4 border-t border-head-rule pt-2.5 md:mt-3.5 md:pt-4">
            <Link
              to="/"
              className="font-serif text-site-title text-paper no-underline"
            >
              Postdoc Onboarding
            </Link>
            <div className="flex items-center gap-2.5 text-small whitespace-nowrap">
              <span
                aria-hidden="true"
                className="grid size-7.5 place-items-center rounded-full bg-paper text-label-sm font-semibold text-yale-blue md:size-8.5 md:text-label"
              >
                {initials}
              </span>
              <span className="max-md:sr-only">{FULL_NAME}</span>
            </div>
          </div>
        </div>
      </header>

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
                    to={tab.to}
                    activeOptions={{ exact: true }}
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
    </>
  )
}
