import type { Metadata } from 'next'

import { ResourcesEditor } from '#/components/ResourcesEditor'
import { getResources } from '#/lib/resources'

export const metadata: Metadata = {
  title: 'Resources | Yale University',
}

// proxy.ts only lets admins into /admin, and saving checks again.
export default async function AdminResourcesPage() {
  const { resources, error } = await getResources()
  if (error) {
    return (
      <div className="max-w-180">
        <h1 className="mb-2.5 text-h1 text-yale-blue">Resources</h1>
        <p role="alert" className="rounded bg-wash px-4 py-3">
          Resources couldn’t be loaded: {error}
        </p>
      </div>
    )
  }

  return <ResourcesEditor resources={resources} />
}
