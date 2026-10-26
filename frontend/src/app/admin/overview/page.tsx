import type { Metadata } from 'next'

import { OverviewView } from '#/components/Admin'

export const metadata: Metadata = {
  title: 'Completion overview | Yale University',
}

export default function OverviewPage() {
  return <OverviewView />
}
