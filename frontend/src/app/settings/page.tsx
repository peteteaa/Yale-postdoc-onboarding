import type { Metadata } from 'next'

import { SetPasswordForm } from '#/components/SetPasswordForm'
import { getCurrentUser } from '#/lib/auth'

export const metadata: Metadata = {
  title: 'Settings | Yale University',
}

// TODO: the rest of the Settings screen from the mockup (appointment,
// reminders, what OPA can see, your data)
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // proxy.ts has already sent signed-out visitors to /login
  const user = await getCurrentUser()
  // They came from a set-your-password email (Create account on an email that
  // already had an account).
  const { 'set-password': settingPassword } = await searchParams

  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="mb-7 max-w-195">
        <h1 className="mb-2.5 text-h1 text-yale-blue">Settings</h1>
      </div>

      <section
        aria-labelledby="password-heading"
        className="max-w-115 rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6"
      >
        <h2 id="password-heading" className="mb-2 text-h3">
          Password
        </h2>
        {user?.email ? (
          <>
            {settingPassword && (
              <p role="status" className="mb-4.5 rounded bg-tint px-3.5 py-3">
                You’re signed in. Choose a password to finish setting up your
                account.
              </p>
            )}
            <p className="mb-4.5 text-small text-ink-2">
              Set a password to sign in with {user.email} and a password, as
              well as with email links. If you already have one, this replaces
              it.
            </p>
            <SetPasswordForm email={user.email} />
          </>
        ) : (
          <p className="text-small text-ink-2">
            Guest accounts can’t have a password. To get one, sign out and
            create an account.
          </p>
        )}
      </section>
    </main>
  )
}
