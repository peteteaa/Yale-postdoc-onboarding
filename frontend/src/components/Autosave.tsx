'use client'

import { GHOST_BUTTON } from '#/components/Form'
import { useCallback, useEffect, useRef, useState } from 'react'

/** How long to wait after the last change before saving. */
const SAVE_DELAY_MS = 1000

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Saves answers a moment after the last change, by calling `save` with the
 * ones that changed, by id. Answers that don't save are kept and sent again
 * with the next save. `save` should keep the same identity between renders.
 */
export function useAutosave<T>(
  save: (answers: Record<string, T>) => Promise<{ ok: boolean }>,
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  // Answers that haven't been saved yet, by id.
  const unsaved = useRef(new Map<string, T>())
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const saveNow = useCallback(async () => {
    clearTimeout(timer.current)
    if (unsaved.current.size === 0) return
    const sending = new Map(unsaved.current)
    setStatus('saving')

    let ok = false
    try {
      ok = (await save(Object.fromEntries(sending))).ok
    } catch (error) {
      // e.g. offline
      console.error('Saving answers failed:', error)
    }
    if (!ok) {
      setStatus('error')
      return
    }
    // Forget what was saved, unless it changed again while saving.
    for (const [id, answer] of sending) {
      if (unsaved.current.get(id) === answer) unsaved.current.delete(id)
    }
    if (unsaved.current.size === 0) setStatus('saved')
  }, [save])

  const queueSave = useCallback(
    (id: string, answer: T) => {
      unsaved.current.set(id, answer)
      setStatus('saving')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => void saveNow(), SAVE_DELAY_MS)
    },
    [saveNow],
  )

  // Save right away when leaving the page for another one in the app.
  useEffect(() => () => void saveNow(), [saveNow])

  // Ask before closing the tab or reloading while answers aren't saved.
  useEffect(() => {
    if (status !== 'saving' && status !== 'error') return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status])

  return { status, queueSave, saveNow }
}

export function SaveMessage({
  status,
  onRetry,
  className = 'mt-5',
}: {
  status: SaveStatus
  onRetry: () => void
  className?: string
}) {
  if (status === 'error') {
    return (
      <div
        role="alert"
        className={`${className} flex flex-wrap items-center gap-x-4 gap-y-2`}
      >
        <p className="font-semibold text-late">Your changes didn’t save.</p>
        <button type="button" onClick={onRetry} className={GHOST_BUTTON}>
          Try again
        </button>
      </div>
    )
  }
  // Takes up its line even when empty, so content below doesn't jump when it appears.
  return (
    <p className={`${className} min-h-[1lh] text-small text-ink-2`}>
      {status === 'saving' && 'Saving…'}
      {status === 'saved' && 'Saved'}
    </p>
  )
}
