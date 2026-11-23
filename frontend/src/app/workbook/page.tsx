import { redirect } from 'next/navigation'

import { firstUnfinished, SECTIONS, sectionHref } from '#/data/workbook'
import { getAnswers } from '#/lib/workbook'

// Each section has its own page. This one picks up where they left off.
export default async function WorkbookPage() {
  // If the answers can't be loaded, the first section shows that error.
  const { answers } = await getAnswers()
  const { module, section } = firstUnfinished(SECTIONS, answers)
  redirect(sectionHref(module.id, section.id))
}
