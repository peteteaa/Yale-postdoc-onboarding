import type { EventCategory, EventStatus, PostdocEvent } from '#/data/events'
import { todayInNewHaven } from '#/lib/dates'
import type { EventForm } from '#/lib/events'
import { createClient } from '#/lib/supabase/server'

// Reading and writing the `events` table (supabase/migrations). Row-level
// security decides what each person sees: published events for everyone
// signed in, drafts too for admins. Only admins can write.

/** A row of the `events` table, as Supabase returns it. */
export type EventRow = {
  id: string
  title: string
  date: string
  /** 'HH:MM:SS' */
  start_time: string
  end_time: string | null
  location: string
  category: EventCategory
  host: string
  description: string
  link: string
  status: EventStatus
}

export const EVENT_COLUMNS =
  'id, title, date, start_time, end_time, location, category, host, description, link, status'

export function fromRow(row: EventRow): PostdocEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    start: row.start_time.slice(0, 5),
    end: row.end_time?.slice(0, 5) ?? '',
    location: row.location,
    category: row.category,
    host: row.host,
    description: row.description,
    link: row.link,
    status: row.status,
  }
}

/** The columns to write for a checked, valid form. */
export function toRow(
  form: EventForm,
  status: EventStatus,
): Omit<EventRow, 'id'> {
  return {
    title: form.title,
    date: form.date,
    start_time: form.start,
    end_time: form.end || null,
    location: form.location,
    category: form.category as EventCategory,
    host: form.host,
    description: form.description,
    link: form.link,
    status,
  }
}

/**
 * Every event the signed-in person can see, soonest first. null if they
 * couldn't be loaded.
 */
export async function listEvents(): Promise<PostdocEvent[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .order('date')
    .order('start_time')
  if (error) {
    console.error('Couldn’t load events:', error.message)
    return null
  }
  return (data as EventRow[]).map(fromRow)
}

/**
 * The next `limit` published events, from today on, soonest first. null if
 * they couldn't be loaded.
 */
export async function upcomingEvents(
  limit: number,
): Promise<PostdocEvent[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('status', 'published')
    .gte('date', todayInNewHaven())
    .order('date')
    .order('start_time')
    .limit(limit)
  if (error) {
    console.error('Couldn’t load upcoming events:', error.message)
    return null
  }
  return (data as EventRow[]).map(fromRow)
}
