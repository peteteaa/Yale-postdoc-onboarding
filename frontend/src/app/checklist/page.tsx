import type { Metadata } from 'next'

import { Checklist } from '#/components/Checklist'
import { todayInNewHaven } from '#/lib/dates'
import { loadMyChecklist } from '#/lib/supabase/progress'

export const metadata: Metadata = {
  title: 'Onboarding checklist | Yale University',
}

export default async function ChecklistPage() {
  // Sends postdocs who haven't added their appointment yet to Settings.
  const checklist = await loadMyChecklist()
  return <Checklist {...checklist} today={todayInNewHaven()} />
}
