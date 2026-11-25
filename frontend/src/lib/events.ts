import type { EventCategory, EventStatus, PostdocEvent } from '#/data/events'
import { EVENT_CATEGORIES } from '#/data/events'

// The admin Events form, checked the same way in the browser and in the
// Server Action that saves it.

/** What the admin Events form edits: an event without its id or status. */
export type EventForm = Omit<PostdocEvent, 'id' | 'category' | 'status'> & {
  category: EventCategory | ''
}
export type EventFormField = keyof EventForm
export type EventFormErrors = Partial<Record<EventFormField, string>>

export const BLANK_EVENT_FORM: EventForm = {
  title: '',
  date: '',
  start: '',
  end: '',
  location: '',
  category: '',
  host: 'Office of Postdoctoral Affairs',
  description: '',
  link: '',
}

const FIELDS = Object.keys(BLANK_EVENT_FORM) as EventFormField[]
const TIME = /^\d{2}:\d{2}$/

export function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === 'string' && Object.hasOwn(EVENT_CATEGORIES, value)
}

export function isEventStatus(value: unknown): value is EventStatus {
  return value === 'published' || value === 'draft'
}

/**
 * An EventForm from untrusted input (a Server Action's arguments), with text
 * trimmed. Anything that isn't a string becomes ''.
 */
export function cleanEventForm(input: unknown): EventForm {
  const record =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>)
      : {}
  const form = {} as Record<EventFormField, string>
  for (const key of FIELDS) {
    const value = record[key]
    form[key] = typeof value === 'string' ? value.trim() : ''
  }
  return form as EventForm
}

/** What's wrong with the form, by field. Empty when it can be saved. */
export function validateEvent(form: EventForm): EventFormErrors {
  const errors: EventFormErrors = {}
  if (!form.title.trim()) errors.title = 'Add a title.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errors.date = 'Choose a date.'
  if (!TIME.test(form.start)) errors.start = 'Add a start time.'
  if (form.end && !TIME.test(form.end)) errors.end = 'Use a time like 1:00 pm.'
  else if (form.start && form.end && form.end <= form.start)
    errors.end = 'End time must be after the start time.'
  if (!isEventCategory(form.category))
    errors.category = 'Choose a category so postdocs can filter for it.'
  if (form.link.trim() && !/^https:\/\/\S+\.\S+/.test(form.link.trim()))
    errors.link = 'Use a full link that starts with https://'
  return errors
}
