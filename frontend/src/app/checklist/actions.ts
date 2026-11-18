'use server'

import { revalidatePath } from 'next/cache'

import { TASKS } from '#/data/checklist'
import { createClient } from '#/lib/supabase/server'

export type TaskActionResult = { ok: true } | { ok: false; message: string }

const TASK_IDS = new Set(TASKS.map((task) => task.id))

/** Home and the Checklist: check a task off, or uncheck it. */
export async function setTaskDone(
  taskId: unknown,
  done: unknown,
): Promise<TaskActionResult> {
  if (typeof taskId !== 'string' || !TASK_IDS.has(taskId)) {
    return { ok: false, message: 'That task isn’t on the checklist anymore.' }
  }
  if (typeof done !== 'boolean') {
    return { ok: false, message: 'Couldn’t save that. Try again.' }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub
  if (!userId) return { ok: false, message: 'Sign in again to save this.' }

  // Row-level security limits both to the postdoc's own rows and refuses
  // guests. Checking off a task that's already done changes nothing.
  const { error } = done
    ? await supabase
        .from('checklist_progress')
        .upsert(
          { user_id: userId, task_id: taskId },
          { onConflict: 'user_id,task_id', ignoreDuplicates: true },
        )
    : await supabase
        .from('checklist_progress')
        .delete()
        .eq('user_id', userId)
        .eq('task_id', taskId)
  if (error) {
    console.error('Couldn’t save checklist progress:', error.message)
    return {
      ok: false,
      message:
        // No profile to attach it to (foreign key)
        error.code === '23503'
          ? 'Add your appointment details in Settings to save your progress.'
          : 'Couldn’t save that. Try again.',
    }
  }

  // Home, the Checklist and the admin overview all show it.
  revalidatePath('/', 'layout')
  return { ok: true }
}
