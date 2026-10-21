import type { ReactNode } from 'react'

type PillVariant = 'default' | 'required' | 'overdue' | 'due-soon'

const VARIANT_CLASSES: Record<PillVariant, string> = {
  default: 'border-line bg-paper text-ink-2',
  required: 'border-yale-blue bg-paper text-yale-blue',
  overdue: 'border-late bg-late text-paper',
  'due-soon': 'border-soon bg-soon text-ink',
}

/** Short status or category tag, from the Figma "Pill" component. */
export function Pill({
  variant = 'default',
  children,
}: {
  variant?: PillVariant
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.25 py-1.25 text-label leading-none font-semibold tracking-wide whitespace-nowrap ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  )
}
