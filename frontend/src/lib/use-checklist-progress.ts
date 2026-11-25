import { useState, useTransition } from 'react'

import { setTaskDone } from '#/app/checklist/actions'

/**
 * Checked-off tasks for Home and the Checklist page. Checking or unchecking
 * shows right away and is saved in the background (when `save` is true); if
 * saving fails, the change is undone and `error` says why.
 */
export function useChecklistProgress(initial: string[], save: boolean) {
  const [done, setDone] = useState(() => new Set(initial))
  const [error, setError] = useState<string | null>(null)
  const [, startSaving] = useTransition()

  const apply = (taskId: string, isDone: boolean) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (isDone) next.add(taskId)
      else next.delete(taskId)
      return next
    })

  const mark = (taskId: string, isDone: boolean) => {
    apply(taskId, isDone)
    setError(null)
    if (!save) return
    startSaving(async () => {
      const result = await setTaskDone(taskId, isDone)
      if (!result.ok) {
        apply(taskId, !isDone)
        setError(result.message)
      }
    })
  }

  return { done, mark, error }
}
