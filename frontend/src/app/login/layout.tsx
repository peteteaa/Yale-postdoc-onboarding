import type { ReactNode } from 'react'

/** The sign-in card and, beside it, what the app is for. Shared by /login and /login/email-link. */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="grid items-start gap-7 md:grid-cols-[minmax(0,460px)_minmax(0,1fr)] md:gap-14">
        <section className="rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6">
          {children}
          <p className="mt-5 text-small text-ink-2">
            Trouble signing in? Contact the Office of Postdoctoral Affairs.
          </p>
        </section>
        <section className="md:pt-2.5">
          <h2 className="mb-3 text-h2">Your first year, in one place</h2>
          <ul className="grid list-disc gap-2 pl-5 text-ink-2">
            <li>
              An onboarding checklist with due dates based on your start date
            </li>
            <li>The OPA orientation workbook, in short sections</li>
            <li>An Initial IDP you can export as a PDF</li>
            <li>Events and resources from across Yale</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
