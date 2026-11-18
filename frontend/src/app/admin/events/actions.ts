'use server'

import { revalidatePath } from 'next/cache'

import { isAdmin } from '#/lib/auth'
import type { EventFormErrors } from '#/lib/events'
import { cleanEventForm, isEventStatus, validateEvent } from '#/lib/events'
import { toRow } from '#/lib/supabase/events'
import { createClient } from '#/lib/supabase/server'

export type EventActionResult =
  { ok: true } | { ok: false; message?: string; errors?: EventFormErrors }

const NOT_ADMIN: EventActionResult = {
  ok: false,
  message: 'Only OPA staff can change events.',
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * /admin/events: add an event (`id` null) or replace one, as published or a
 * draft.
 */
export async function saveEvent(
  id: string | null,
  input: unknown,
  status: unknown,
): Promise<EventActionResult> {
  // Check here too, not just in the admin layout: Server Actions can be called
  // directly. Row-level security would also refuse the write.
  if (!(await isAdmin())) return NOT_ADMIN
  if (id !== null && !(typeof id === 'string' && UUID.test(id))) {
    return { ok: false, message: 'That event no longer exists.' }
  }
  if (!isEventStatus(status)) {
    return { ok: false, message: 'Choose Publish or Save as draft.' }
  }
  const form = cleanEventForm(input)
  const errors = validateEvent(form)
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const supabase = await createClient()
  const row = toRow(form, status)
  const { data, error } = id
    ? await supabase.from('events').update(row).eq('id', id).select('id')
    : await supabase.from('events').insert(row).select('id')
  if (error) {
    console.error('Couldn’t save event:', error.message)
    return { ok: false, message: 'Couldn’t save the event. Try again.' }
  }
  if (data.length === 0) {
    return { ok: false, message: 'That event no longer exists.' }
  }

  // Home and the admin list both show events.
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** /admin/events: delete an event. */
export async function deleteEvent(id: unknown): Promise<EventActionResult> {
  if (!(await isAdmin())) return NOT_ADMIN
  if (!(typeof id === 'string' && UUID.test(id))) {
    return { ok: false, message: 'That event was already deleted.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) {
    console.error('Couldn’t delete event:', error.message)
    return { ok: false, message: 'Couldn’t delete the event. Try again.' }
  }
  if (data.length === 0) {
    return { ok: false, message: 'That event was already deleted.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
