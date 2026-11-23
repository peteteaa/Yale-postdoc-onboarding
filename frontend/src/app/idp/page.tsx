import type { Metadata } from 'next'

import { IdpBuilder } from '#/components/IdpBuilder'
import { getCurrentUser } from '#/lib/auth'
import { getIdpAnswers } from '#/lib/idp'

export const metadata: Metadata = {
  title: 'IDP builder | Yale University',
}

export default async function IdpPage() {
  // proxy.ts has already sent signed-out visitors to /login
  const [user, saved] = await Promise.all([getCurrentUser(), getIdpAnswers()])
  // Start the name field with their full name. `user.name` falls back to their
  // email or "Signed in" when we don't have one.
  const name =
    user &&
    !user.isGuest &&
    user.email !== user.name &&
    user.name !== 'Signed in'
      ? user.name
      : ''

  return (
    <IdpBuilder
      savedAnswers={saved.answers}
      loadError={Boolean(saved.error)}
      defaultName={name}
    />
  )
}
