import { notFound, redirect } from 'next/navigation'

import { MODULES, sectionHref } from '#/data/workbook'

/** A module has no page of its own, so this goes to its first section. */
export default async function WorkbookModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const found = MODULES.find((m) => m.id === moduleId)
  if (!found) notFound()
  redirect(sectionHref(found.id, found.sections[0].id))
}
