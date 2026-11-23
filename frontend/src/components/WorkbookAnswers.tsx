'use client'

import { saveAnswers } from '#/app/workbook/actions'
import type { SaveStatus } from '#/components/Autosave'
import { SAVE_DELAY_MS } from '#/components/Autosave'
import type { Answer, SectionAnswers, WorkbookAnswers } from '#/data/workbook'
import type { ReactNode } from 'react'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'

/** A new answer, or a function that builds it from the latest one. */
export type AnswerUpdate = Answer | ((prev: Answer | undefined) => Answer)

/*
 * Answers changed in this tab, and their saving, live here in the module
 * rather than in a component, so they outlast the workbook's components:
 * - A save that is waiting or sending still finishes after you leave the page.
 * - Coming back shows your latest answers, even when Next.js shows an older
 *   copy of the page, as it does after the Back button.
 * Only event handlers and effects write to them, so they stay empty on the
 * server, where they'd be shared between visitors.
 */

type Changes = {
  /** Whose changes these are. They're dropped when someone else signs in. */
  userId: string | null
  /** Answers changed in this tab, by section and prompt id. */
  answers: WorkbookAnswers
  /** The save status of each section with changes. */
  status: Record<string, SaveStatus | undefined>
}

const NO_CHANGES: Changes = { userId: null, answers: {}, status: {} }
let changes = NO_CHANGES
const listeners = new Set<() => void>()

// Changes that haven't been saved yet, by section and prompt id, and each
// section's timer for its next save.
let unsaved = new Map<string, Map<string, Answer>>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function update(next: Partial<Changes>) {
  changes = { ...changes, ...next }
  // Ask before closing the tab or reloading while changes aren't saved. This
  // stays on after leaving the workbook, until they save.
  if (
    Object.values(changes.status).some((s) => s === 'saving' || s === 'error')
  ) {
    window.addEventListener('beforeunload', warnBeforeUnload)
  } else {
    window.removeEventListener('beforeunload', warnBeforeUnload)
  }
  for (const listener of listeners) listener()
}

function warnBeforeUnload(event: BeforeUnloadEvent) {
  event.preventDefault()
}

/** Forgets the last person's changes, so the next person never sees or saves them. */
function switchUser(userId: string) {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
  unsaved = new Map()
  update({ userId, answers: {}, status: {} })
}

function change(
  userId: string,
  sectionId: string,
  promptId: string,
  answer: Answer,
) {
  if (changes.userId !== userId) switchUser(userId)
  let queue = unsaved.get(sectionId)
  if (!queue) unsaved.set(sectionId, (queue = new Map()))
  queue.set(promptId, answer)
  clearTimeout(timers.get(sectionId))
  timers.set(
    sectionId,
    setTimeout(() => void save(sectionId), SAVE_DELAY_MS),
  )
  update({
    answers: {
      ...changes.answers,
      [sectionId]: { ...changes.answers[sectionId], [promptId]: answer },
    },
    status: { ...changes.status, [sectionId]: 'saving' },
  })
}

function setStatus(sectionId: string, status: SaveStatus) {
  update({ status: { ...changes.status, [sectionId]: status } })
}

/**
 * Saves a section's changes now. Changes that don't save are kept and sent
 * again with the next save.
 */
async function save(sectionId: string) {
  clearTimeout(timers.get(sectionId))
  timers.delete(sectionId)
  const queue = unsaved.get(sectionId)
  if (!queue?.size) return
  const { userId } = changes
  const sending = new Map(queue)
  setStatus(sectionId, 'saving')

  let ok = false
  try {
    ok = (await saveAnswers(sectionId, Object.fromEntries(sending))).ok
  } catch (error) {
    // e.g. offline
    console.error('Saving workbook answers failed:', error)
  }
  // Someone else signed in while it was sending.
  if (changes.userId !== userId) return
  if (!ok) {
    setStatus(sectionId, 'error')
    return
  }
  // Forget what was saved, unless it changed again while saving.
  for (const [promptId, answer] of sending) {
    if (queue.get(promptId) === answer) queue.delete(promptId)
  }
  if (queue.size === 0) setStatus(sectionId, 'saved')
}

type Saved = { userId: string | null; answers: WorkbookAnswers }

const SavedContext = createContext<Saved | null>(null)

function useSaved() {
  const saved = use(SavedContext)
  if (!saved) throw new Error('Needs a WorkbookAnswersProvider around it')
  return saved
}

/**
 * Gives the workbook the signed-in person's saved answers. Used by the
 * workbook layout, so it stays while moving around the workbook.
 */
export function WorkbookAnswersProvider({
  userId,
  savedAnswers,
  children,
}: {
  userId: string | null
  savedAnswers: WorkbookAnswers
  children: ReactNode
}) {
  useEffect(() => {
    // Someone else made changes in this tab, then signed out.
    if (userId && changes.userId && changes.userId !== userId) {
      switchUser(userId)
    }
  }, [userId])

  // Save right away when leaving the workbook for another page in the app.
  useEffect(
    () => () => {
      for (const sectionId of unsaved.keys()) void save(sectionId)
    },
    [],
  )

  const saved = useMemo(
    () => ({ userId, answers: savedAnswers }),
    [userId, savedAnswers],
  )
  return <SavedContext value={saved}>{children}</SavedContext>
}

/** The changes made in this tab, if they're the signed-in person's. */
function useChanges(userId: string | null) {
  const current = useSyncExternalStore(
    subscribe,
    () => changes,
    () => NO_CHANGES,
  )
  // Until they're forgotten, someone else's changes are just ignored.
  return current.userId === userId ? current : NO_CHANGES
}

/** Every section's answers, with any changes. */
export function useAllAnswers() {
  const saved = useSaved()
  const changed = useChanges(saved.userId).answers
  return useMemo(() => {
    const all: WorkbookAnswers = { ...saved.answers }
    for (const [sectionId, answers] of Object.entries(changed)) {
      all[sectionId] = { ...saved.answers[sectionId], ...answers }
    }
    return all
  }, [saved.answers, changed])
}

/** The ids of sections whose changes didn't save. */
export function useFailedSaves() {
  const { status } = useChanges(useSaved().userId)
  return Object.keys(status).filter((id) => status[id] === 'error')
}

/** Tries saving a section's changes again. */
export function retrySave(sectionId: string) {
  void save(sectionId)
}

/** One section's answers, with any changes, and how saving them is going. */
export function useSectionAnswers(sectionId: string) {
  const saved = useSaved()
  const { userId } = saved
  const current = useChanges(userId)
  const changed = current.answers[sectionId]
  const savedAnswers = saved.answers[sectionId]
  const answers: SectionAnswers = useMemo(
    () => ({ ...savedAnswers, ...changed }),
    [savedAnswers, changed],
  )
  const status = current.status[sectionId] ?? 'idle'

  const onAnswer = useCallback(
    (promptId: string, update: AnswerUpdate) => {
      if (!userId) return
      // Read the latest answer here, not from `answers`: quick clicks can
      // come before a re-render.
      const latest =
        changes.userId === userId ? changes.answers[sectionId] : undefined
      const prev =
        latest && Object.hasOwn(latest, promptId)
          ? latest[promptId]
          : savedAnswers?.[promptId]
      change(
        userId,
        sectionId,
        promptId,
        typeof update === 'function' ? update(prev) : update,
      )
    },
    [userId, sectionId, savedAnswers],
  )

  return { answers, status, onAnswer }
}
