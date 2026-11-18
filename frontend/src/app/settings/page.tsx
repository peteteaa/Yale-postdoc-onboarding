import type { Metadata } from 'next'

import { ProfileForm } from '#/components/ProfileForm'
import { SetPasswordForm } from '#/components/SetPasswordForm'
import { getCurrentUser } from '#/lib/auth'
import {
  BLANK_PROFILE_FORM,
  type ProfileForm as ProfileFormValues,
} from '#/lib/profile'
import { loadOwnProfile } from '#/lib/supabase/progress'

export const metadata: Metadata = {
  title: 'Settings | Yale University',
}

// TODO: the rest of the Settings screen from the mockup (reminders, what OPA
// can see, your data)
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // proxy.ts has already sent signed-out visitors to /login
  const [user, own] = await Promise.all([getCurrentUser(), loadOwnProfile()])
  // They came from a set-your-password email (Create account on an email that
  // already had an account).
  const { 'set-password': settingPassword, setup: settingUp } =
    await searchParams
  // They were sent here to add their appointment details (?setup=1).
  const setup = Boolean(settingUp)

  // The name to start the form with, unless it's just their email or a
  // placeholder.
  const hasRealName =
    user?.name &&
    user.name !== user.email &&
    user.name !== 'Guest' &&
    user.name !== 'Signed in'
  const initial: ProfileFormValues =
    own.kind === 'loaded' && own.profile
      ? own.profile
      : { ...BLANK_PROFILE_FORM, fullName: hasRealName ? user.name : '' }

  return (
    <main className="mx-auto max-w-page px-4 pt-6 pb-12 md:px-10 md:pt-10 md:pb-18">
      <div className="mb-7 max-w-195">
        <h1 className="mb-2.5 text-h1 text-yale-blue">Settings</h1>
      </div>

      <section
        id="appointment"
        aria-labelledby="appointment-heading"
        className="max-w-115 rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6"
      >
        <h2 id="appointment-heading" className="mb-2 text-h3">
          Your appointment
        </h2>
        {setup && (
          <p role="status" className="mb-4.5 rounded bg-tint px-3.5 py-3">
            Welcome! Add your appointment details to set up your checklist and
            first-year plan.
          </p>
        )}
        <p className="mb-4.5 text-small text-ink-2">
          OPA staff can see your name, NetID, department, start date and which
          checklist tasks you’ve done. They never see your workbook answers or
          IDP.
        </p>
        {own.kind === 'guest' && (
          <p className="text-small text-ink-2">
            Guest accounts can’t save appointment details. To save your
            progress, sign out and create an account.
          </p>
        )}
        {own.kind === 'load-failed' && (
          <p className="text-small text-late">
            Couldn’t load your details. Reload the page to try again.
          </p>
        )}
        {own.kind === 'loaded' && (
          <ProfileForm initial={initial} setup={setup} />
        )}
      </section>

      <section
        aria-labelledby="password-heading"
        className="mt-6 max-w-115 rounded border border-card-line bg-paper p-4.5 shadow-card md:p-6"
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
