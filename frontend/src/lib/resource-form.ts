import type { ResourceTopic } from '#/data/resources'
import { isResourceTopic } from '#/data/resources'

// Shared by the staff Resources form (to show errors as you go) and its Server
// Actions (which can't trust what the browser sends).

export type ResourceInput = {
  topic: ResourceTopic | ''
  name: string
  url: string
  host: string
  description: string
}
export type ResourceField = keyof ResourceInput
export type ResourceErrors = Partial<Record<ResourceField, string>>

export const BLANK_RESOURCE: ResourceInput = {
  topic: '',
  name: '',
  url: '',
  host: '',
  description: '',
}

/** Trims every field. */
export function cleanResource(input: ResourceInput): ResourceInput {
  return {
    topic: input.topic,
    name: input.name.trim(),
    url: input.url.trim(),
    host: input.host.trim(),
    description: input.description.trim(),
  }
}

/** Errors for a cleaned-up input, by field. Empty when it can be saved. */
export function validateResource(input: ResourceInput): ResourceErrors {
  const errors: ResourceErrors = {}
  if (!isResourceTopic(input.topic))
    errors.topic = 'Choose a topic so postdocs can find it.'
  if (!input.name) errors.name = 'Add a name.'
  else if (input.name.length > 200)
    errors.name = 'Keep the name under 200 characters.'
  if (!/^https?:\/\/\S+\.\S+/.test(input.url))
    errors.url = 'Use a full link that starts with https://'
  else if (input.url.length > 2000) errors.url = 'That link is too long.'
  if (input.host.length > 200) errors.host = 'Keep this under 200 characters.'
  if (input.description.length > 1000)
    errors.description = 'Keep the description under 1,000 characters.'
  return errors
}
