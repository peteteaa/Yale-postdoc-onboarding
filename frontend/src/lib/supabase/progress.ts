import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

import type { Visa } from '#/data/checklist'
import type { PostdocProgress, Profile } from '#/data/postdocs'
import { isAdmin } from '#/lib/auth'
import { dateInNewHaven } from '#/lib/dates'
import { PREVIEW_PROFILE } from '#/lib/profile'
import type { ProfileForm } from '#/lib/profile'
import { createClient } from '#/lib/supabase/server'

// Reading the `profiles` and `checklist_progress` tables (supabase/migrations).
// Row-level security decides what each person sees: their own rows, or
// everyone's for admins.

/** A row of the `profiles` table with its checked-off tasks. */
type ProfileRow = {
  user_id: string
  full_name: string
  net_id: string
  department: string
  start_date: string
  visa: Visa
  last_active_at: string
  checklist_progress: { task_id: string }[]
}

const COLUMNS =
  'user_id, full_name, net_id, department, start_date, visa, last_active_at, checklist_progress(task_id)'

function profileFromRow(row: ProfileRow): Profile {
  return {
    fullName: row.full_name,
    netId: row.net_id,
    department: row.department,
    start: row.start_date,
    visa: row.visa,
  }
}

/** The columns to write for a checked, valid appointment form. */
export function toProfileRow(form: ProfileForm) {
  return {
    full_name: form.fullName,
    net_id: form.netId,
    department: form.department,
    start_date: form.start,
    visa: form.visa as Visa,
  }
}

/**
 * The signed-in postdoc's own profile (null if they haven't saved one) and the
 * ids of their checked-off tasks. null if it couldn't be loaded.
 */
export async function getMyProgress(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ profile: Profile | null; done: string[] } | null> {
  // Admins can read everyone's profiles, so ask for this user's.
  const { data, error } = await supabase
    .from('profiles')
    .select(COLUMNS)
    .eq('user_id', userId)
    .maybeSingle<ProfileRow>()
  if (error) {
    console.error('Couldn’t load the postdoc’s progress:', error.message)
    return null
  }
  if (!data) return { profile: null, done: [] }
  return {
    profile: profileFromRow(data),
    done: data.checklist_progress.map((task) => task.task_id),
  }
}

/** What Home and the Checklist need about the signed-in person's checklist. */
export type MyChecklist = Pick<Profile, 'start' | 'visa'> & {
  /** Ids of the checked-off tasks. */
  done: string[]
  /** Why checking tasks off won't be saved. null when it will be. */
  unsaved: 'guest' | 'no-profile' | 'load-failed' | null
}

/**
 * The signed-in person's checklist, for Home and the Checklist page. Sends
 * postdocs who haven't added their appointment yet to Settings first. Guests
 * and OPA staff without a profile get PREVIEW_PROFILE, and nothing they check
 * off is saved.
 */
export async function loadMyChecklist(): Promise<MyChecklist> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  // proxy.ts sends signed-out visitors to /login, so no claims means a guest
  // whose session is gone. Treat them the same.
  if (!claims || claims.is_anonymous === true) {
    return { ...PREVIEW_PROFILE, done: [], unsaved: 'guest' }
  }

  const progress = await getMyProgress(supabase, claims.sub)
  if (!progress) return { ...PREVIEW_PROFILE, done: [], unsaved: 'load-failed' }
  const { profile, done } = progress
  if (profile) {
    return { start: profile.start, visa: profile.visa, done, unsaved: null }
  }
  if (!(await isAdmin(supabase))) redirect('/settings?setup=1')
  return { ...PREVIEW_PROFILE, done: [], unsaved: 'no-profile' }
}

/**
 * Every postdoc with a profile and their checked-off tasks, by name. For the
 * admin Completion overview. null if they couldn't be loaded.
 */
export async function listPostdocProgress(): Promise<PostdocProgress[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(COLUMNS)
    .order('full_name')
    .overrideTypes<ProfileRow[], { merge: false }>()
  if (error) {
    console.error('Couldn’t load postdoc progress:', error.message)
    return null
  }
  return data.map((row) => ({
    ...profileFromRow(row),
    userId: row.user_id,
    done: row.checklist_progress.map((task) => task.task_id),
    lastActive: dateInNewHaven(new Date(row.last_active_at)),
  }))
}

/** The signed-in person's own profile, for Settings. */
export type OwnProfile =
  | { kind: 'guest' }
  | { kind: 'load-failed' }
  /** profile is null until they save one. */
  | { kind: 'loaded'; profile: Profile | null }

export async function loadOwnProfile(): Promise<OwnProfile> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims || claims.is_anonymous === true) return { kind: 'guest' }
  const progress = await getMyProgress(supabase, claims.sub)
  if (!progress) return { kind: 'load-failed' }
  return { kind: 'loaded', profile: progress.profile }
}
