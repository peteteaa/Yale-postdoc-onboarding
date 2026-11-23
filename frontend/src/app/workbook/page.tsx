import { redirect } from 'next/navigation'

import { SECTIONS, sectionHref } from '#/data/workbook'

// Each section has its own page.
// TODO: go to the first section they haven't finished, once sections show
// whether they're done.
export default function WorkbookPage() {
  const { module, section } = SECTIONS[0]
  redirect(sectionHref(module.id, section.id))
}
