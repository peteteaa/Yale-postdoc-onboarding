import type { ReactNode } from 'react'

// Button and form-field styles shared by the admin pages and the sign-in page.

export const BUTTON =
  'inline-flex min-h-11 cursor-pointer items-center justify-center rounded border-[1.5px] border-yale-blue px-4.5 py-2.5 leading-tight font-semibold'
export const PRIMARY_BUTTON = `${BUTTON} bg-yale-blue text-paper hover:brightness-115`
export const GHOST_BUTTON = `${BUTTON} bg-paper text-yale-blue hover:bg-tint`
export const LINK_BUTTON =
  'cursor-pointer px-0.5 py-1 text-small leading-none font-semibold underline underline-offset-3'
/** Add to a button that's disabled while its form submits. */
export const BUSY = 'disabled:cursor-wait disabled:opacity-60'
export const INPUT =
  'w-full min-w-0 rounded border-[1.5px] border-field-line bg-paper px-3 py-2.5 text-large leading-[1.45] aria-invalid:border-late'

/** Props that tie a form control to its label, hint, and error. */
export type ControlProps = {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

/** A labeled form control with an optional hint and error message. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: (props: ControlProps) => ReactNode
}) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="mb-4.5 grid grid-cols-1 gap-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-small text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small font-semibold text-late">
          {error}
        </p>
      )}
    </div>
  )
}
