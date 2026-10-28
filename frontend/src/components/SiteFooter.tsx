// TODO: real link URLs
const LINKS = [
  { label: 'Contact OPA', href: '#' },
  { label: 'Accessibility', href: '#' },
  { label: 'Privacy policy', href: '#' },
]

/**
 * The Yale footer: logo lower-left, then the office, links and copyright. The
 * top rule spans the window; the content stays in the page column.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-page flex-wrap items-end gap-x-14 gap-y-5 px-4 pt-6 pb-8 md:px-10 md:pt-8 md:pb-10">
        {/* TODO: the official footer logo from the University Printer */}
        <a
          href="https://www.yale.edu"
          aria-label="Yale University"
          className="py-1.5 font-serif text-footer-logo text-yale-blue no-underline"
        >
          Yale
        </a>
        <div className="grid gap-1.5 text-caption text-ink-2">
          <p className="font-semibold text-ink">
            Office of Postdoctoral Affairs
          </p>
          <ul className="flex flex-wrap gap-x-4.5 gap-y-1">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
          <p>
            © {new Date().getFullYear()} Yale University. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
