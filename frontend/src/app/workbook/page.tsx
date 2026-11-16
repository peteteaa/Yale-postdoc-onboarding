import type { Metadata } from 'next'

import { Workbook } from '#/components/Workbook'
import { getResources } from '#/lib/resources'
import { getAnswers } from '#/lib/workbook'

export const metadata: Metadata = {
  title: 'Workbook | Yale University',
}

export default async function WorkbookPage() {
  // proxy.ts has already sent signed-out visitors to /login
  const [answers, resources] = await Promise.all([getAnswers(), getResources()])

  return (
    <Workbook
      savedAnswers={answers.answers}
      loadError={Boolean(answers.error)}
      resources={resources.error ? null : resources.resources}
    />
  )
}
