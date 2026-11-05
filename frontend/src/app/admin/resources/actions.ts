'use server'

import type { Resource } from '#/data/resources'
import { isAdmin } from '#/lib/auth'
import type { ResourceErrors, ResourceInput } from '#/lib/resource-form'
import { cleanResource, validateResource } from '#/lib/resource-form'
import { RESOURCE_COLUMNS } from '#/lib/resources'
import { createClient } from '#/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ResourceResult =
  | { ok: true; resource: Resource }
  | { ok: false; errors?: ResourceErrors; message?: string }

const NOT_ADMIN = 'Only OPA staff can change resources.'

/**
 * A Supabase client, if whoever's calling is an admin. Checked here as well as
 * by the database's row-level security: Server Actions can be called directly.
 */
async function adminClient() {
  const supabase = await createClient()
  return (await isAdmin(supabase)) ? supabase : null
}

function refresh() {
  revalidatePath('/resources')
  revalidatePath('/admin/resources')
}

/** Adds a resource, or changes the one with `id`. */
export async function saveResource(
  id: number | null,
  input: ResourceInput,
): Promise<ResourceResult> {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: NOT_ADMIN }

  const values = cleanResource(input)
  const errors = validateResource(values)
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const query =
    id === null
      ? supabase.from('resources').insert(values)
      : supabase.from('resources').update(values).eq('id', id)
  const { data, error } = await query
    .select(RESOURCE_COLUMNS)
    .overrideTypes<Resource[], { merge: false }>()

  if (error) {
    console.error('Saving a resource failed:', error)
    return { ok: false, message: 'That didn’t save. Try again.' }
  }
  const [resource] = data
  if (!resource) {
    return {
      ok: false,
      message: 'That resource was removed by someone else. Refresh the page.',
    }
  }
  refresh()
  return { ok: true, resource }
}

export async function deleteResource(
  id: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await adminClient()
  if (!supabase) return { ok: false, message: NOT_ADMIN }

  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) {
    console.error('Removing a resource failed:', error)
    return { ok: false, message: 'That wasn’t removed. Try again.' }
  }
  refresh()
  return { ok: true }
}
