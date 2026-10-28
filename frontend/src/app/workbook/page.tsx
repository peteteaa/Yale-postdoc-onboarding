import type { Metadata } from 'next'

import { Workbook } from '#/components/Workbook'

export const metadata: Metadata = {
  title: 'Workbook | Yale University',
}

export default function WorkbookPage() {
  return <Workbook />
}
