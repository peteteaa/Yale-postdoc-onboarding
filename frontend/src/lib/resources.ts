import type { Resource } from '#/data/resources'
import { RESOURCE_TOPICS } from '#/data/resources'
import { createClient } from '#/lib/supabase/server'

/** Columns to select: exactly the fields of `Resource`. */
export const RESOURCE_COLUMNS = 'id, topic, name, url, host, description'

const topicOrder = (resource: Resource) =>
  RESOURCE_TOPICS.findIndex((topic) => topic.id === resource.topic)

/**
 * Every resource, by topic in page order, then in the order they were added.
 * `error` is set when the table can't be read (for example, before the
 * migration has been run).
 */
export async function getResources(): Promise<{
  resources: Resource[]
  error: string | null
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('resources')
    .select(RESOURCE_COLUMNS)
    .order('id')
    .overrideTypes<Resource[], { merge: false }>()

  if (error) {
    console.error('Loading resources failed:', error)
    return { resources: [], error: error.message }
  }
  const resources = [...data].sort((a, b) => topicOrder(a) - topicOrder(b))
  return { resources, error: null }
}
