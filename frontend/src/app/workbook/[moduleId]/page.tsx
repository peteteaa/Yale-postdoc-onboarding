import { notFound, redirect } from 'next/navigation'

import { firstUnfinished, SECTIONS, sectionHref } from '#/data/workbook'
import { getAnswers } from '#/lib/workbook'

/**
 * A module has no page of its own, so this goes to its first section that
 * isn't done.
 */
export default async function WorkbookModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const sections = SECTIONS.filter(({ module }) => module.id === moduleId)
  if (sections.length === 0) notFound()
  const { answers } = await getAnswers()
  const { module, section } = firstUnfinished(sections, answers)
  redirect(sectionHref(module.id, section.id))
}
