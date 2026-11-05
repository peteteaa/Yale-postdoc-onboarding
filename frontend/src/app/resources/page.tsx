import type { Metadata } from 'next'

import { Resources } from '#/components/Resources'
import { isAdmin } from '#/lib/auth'
import { getResources } from '#/lib/resources'

export const metadata: Metadata = {
  title: 'Resources | Yale University',
}

export default async function ResourcesPage() {
  // proxy.ts has already sent signed-out visitors to /login
  const [admin, { resources, error }] = await Promise.all([
    isAdmin(),
    getResources(),
  ])

  return (
    <Resources
      resources={resources}
      loadError={Boolean(error)}
      isAdmin={admin}
    />
  )
}
