import type { ReactNode } from 'react'

import { WorkbookAnswersProvider } from '#/components/WorkbookAnswers'
import { getAnswers } from '#/lib/workbook'

// Loads the answers here rather than in each page, so changes made on one
// workbook page are still there on the next.
export default async function WorkbookLayout({
  children,
}: {
  children: ReactNode
}) {
  // proxy.ts has already sent signed-out visitors to /login
  const { userId, answers, error } = await getAnswers()

  return (
    <WorkbookAnswersProvider
      userId={userId}
      savedAnswers={answers}
      loadError={Boolean(error)}
    >
      {children}
    </WorkbookAnswersProvider>
  )
}
