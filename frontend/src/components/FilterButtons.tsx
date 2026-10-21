/**
 * A row of toggle buttons where exactly one is selected, from the Figma
 * "Segment" component. Screen readers hear each button as pressed or not.
 */
export function FilterButtons<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  /** Names the group for screen readers, e.g. "Show tasks". */
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className="min-h-10 cursor-pointer rounded-full border-[1.5px] border-field-line bg-paper px-3.75 py-2 text-small leading-none font-semibold text-ink aria-pressed:border-yale-blue aria-pressed:bg-yale-blue aria-pressed:text-paper"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
