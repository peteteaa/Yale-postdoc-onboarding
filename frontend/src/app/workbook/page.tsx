import type { Metadata } from 'next'

import { Workbook } from '#/components/Workbook'
import { getResources } from '#/lib/resources'

export const metadata: Metadata = {
  title: 'Workbook | Yale University',
}

// The saved answers are loaded by the workbook layout.
export default async function WorkbookPage() {
  const resources = await getResources()

  return <Workbook resources={resources.error ? null : resources.resources} />
}
