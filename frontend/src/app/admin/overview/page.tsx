import type { Metadata } from 'next'

import { OverviewView } from '#/components/Admin'
import { todayInNewHaven } from '#/lib/dates'
import { listPostdocProgress } from '#/lib/supabase/progress'

export const metadata: Metadata = {
  title: 'Completion overview | Yale University',
}

export default async function OverviewPage() {
  const postdocs = await listPostdocProgress()
  return <OverviewView postdocs={postdocs} today={todayInNewHaven()} />
}
