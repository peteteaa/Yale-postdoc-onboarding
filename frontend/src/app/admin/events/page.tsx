import type { Metadata } from 'next'

import { EventsView } from '#/components/Admin'

export const metadata: Metadata = {
  title: 'Events | Yale University',
}

export default function EventsPage() {
  return <EventsView />
}
