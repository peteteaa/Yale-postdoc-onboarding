// The Resources page's links live in the Supabase `resources` table (see
// supabase/migrations), so OPA staff can add and remove them. Only the topics
// are fixed here.

/** The sections of the Resources page, in order. */
export const RESOURCE_TOPICS = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'international', label: 'International scholars' },
  { id: 'career', label: 'Career planning' },
  { id: 'skills', label: 'Writing, teaching & funding' },
  { id: 'leadership', label: 'Leadership & mentoring' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'time', label: 'Time management' },
  { id: 'community', label: 'Community' },
] as const

/** Keep in sync with the `topic` check on the `resources` table. */
export type ResourceTopic = (typeof RESOURCE_TOPICS)[number]['id']

export function isResourceTopic(value: unknown): value is ResourceTopic {
  return RESOURCE_TOPICS.some((topic) => topic.id === value)
}

/** A row of the `resources` table. */
export type Resource = {
  id: number
  topic: ResourceTopic
  name: string
  url: string
  /** Who runs it, e.g. "Office of Career Strategy". May be empty. */
  host: string
  /** May be empty. */
  description: string
}
