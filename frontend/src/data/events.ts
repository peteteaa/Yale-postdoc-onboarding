// Events that OPA staff publish. Stored in the Supabase `events` table (see
// supabase/migrations); sample rows are in supabase/seed.sql.

export type EventCategory =
  'orientation' | 'career' | 'wellness' | 'community' | 'international'

export const EVENT_CATEGORIES: Record<EventCategory, string> = {
  orientation: 'Orientation',
  career: 'Career',
  wellness: 'Wellness',
  community: 'Community',
  international: 'International',
}

/** Drafts are only visible to staff. */
export type EventStatus = 'published' | 'draft'

export type PostdocEvent = {
  id: string
  title: string
  /** 'YYYY-MM-DD' */
  date: string
  /** 'HH:MM', 24-hour */
  start: string
  /** 'HH:MM', 24-hour, or '' when there's no set end time. */
  end: string
  location: string
  category: EventCategory
  /** The office or group running the event. */
  host: string
  description: string
  /** Registration page, or '' when no registration is needed. */
  link: string
  status: EventStatus
}
