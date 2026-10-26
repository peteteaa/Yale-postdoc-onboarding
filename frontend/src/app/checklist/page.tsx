import type { Metadata } from 'next'

import { Checklist } from '#/components/Checklist'

export const metadata: Metadata = {
  title: 'Onboarding checklist | Yale University',
}

export default function ChecklistPage() {
  return <Checklist />
}
