import type { Metadata } from 'next'

import { EventsView } from '#/components/Admin'
import { listEvents } from '#/lib/supabase/events'

export const metadata: Metadata = {
  title: 'Events | Yale University',
}

export default async function EventsPage() {
  return <EventsView events={await listEvents()} />
}
