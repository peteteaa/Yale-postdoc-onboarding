import type { Metadata } from 'next'

import { Workbook } from '#/components/Workbook'
import { getAnswers } from '#/lib/workbook'

export const metadata: Metadata = {
  title: 'Workbook | Yale University',
}

export default async function WorkbookPage() {
  // proxy.ts has already sent signed-out visitors to /login
  const { answers, error } = await getAnswers()

  return <Workbook savedAnswers={answers} loadError={Boolean(error)} />
}
