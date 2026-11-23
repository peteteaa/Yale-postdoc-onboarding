import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { WorkbookSection } from '#/components/Workbook'
import { findSection } from '#/data/workbook'
import { getResources } from '#/lib/resources'

type Props = { params: Promise<{ moduleId: string; sectionId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleId, sectionId } = await params
  const found = findSection(moduleId, sectionId)
  if (!found) notFound()
  // Each section gets its own title, which screen readers announce when
  // moving between sections.
  return { title: `${found.section.title} | Workbook | Yale University` }
}

// The saved answers are loaded by the workbook layout.
export default async function WorkbookSectionPage({ params }: Props) {
  const { moduleId, sectionId } = await params
  const found = findSection(moduleId, sectionId)
  if (!found) notFound()
  // Only some sections show links from the Resources page.
  const resources = found.section.resources ? await getResources() : null

  return (
    <WorkbookSection
      moduleId={moduleId}
      sectionId={sectionId}
      resources={resources && !resources.error ? resources.resources : null}
    />
  )
}
