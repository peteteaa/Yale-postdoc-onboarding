export type Status = 'done' | 'in-progress' | 'not-started' | 'overdue'

/**
 * Status glyph from the Figma "Status icon" component. It's decorative, so
 * always show the status as text next to it (WCAG 1.4.1).
 */
export function StatusIcon({ status }: { status: Status }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 shrink-0">
      {status === 'done' && (
        <>
          <circle cx="10" cy="10" r="9" className="fill-ok" />
          <path
            d="M5.8 10.3l2.8 2.8 5.6-6"
            className="fill-none stroke-paper"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {status === 'in-progress' && (
        <>
          <circle
            cx="10"
            cy="10"
            r="8.1"
            className="fill-none stroke-prog"
            strokeWidth={1.8}
          />
          <path d="M10 1.9a8.1 8.1 0 0 1 0 16.2z" className="fill-prog" />
        </>
      )}
      {status === 'not-started' && (
        <circle
          cx="10"
          cy="10"
          r="8.1"
          className="fill-none stroke-todo"
          strokeWidth={1.8}
        />
      )}
      {status === 'overdue' && (
        <>
          <circle cx="10" cy="10" r="9" className="fill-late" />
          <path
            d="M10 5.2v6"
            className="fill-none stroke-paper"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <circle cx="10" cy="14.6" r="1.3" className="fill-paper" />
        </>
      )}
    </svg>
  )
}
