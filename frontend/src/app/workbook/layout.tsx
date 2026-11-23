import type { ReactNode } from 'react'

import { WorkbookShell } from '#/components/Workbook'
import { WorkbookAnswersProvider } from '#/components/WorkbookAnswers'
import { getAnswers } from '#/lib/workbook'

// Loads the answers here rather than in each section's page, so changes made
// in one section are still there in the next.
export default async function WorkbookLayout({
  children,
}: {
  children: ReactNode
}) {
  // proxy.ts has already sent signed-out visitors to /login
  const { userId, answers, error } = await getAnswers()

  return (
    <WorkbookAnswersProvider userId={userId} savedAnswers={answers}>
      <WorkbookShell loadError={Boolean(error)}>{children}</WorkbookShell>
    </WorkbookAnswersProvider>
  )
}
