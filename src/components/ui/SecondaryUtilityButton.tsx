/**
 * Module UI-B — Secondary Utility Button Authority.
 * Canonical button for non-destructive support actions (Load Design, Undo, Redo, etc.).
 */
import type { ReactNode } from 'react'

export default function SecondaryUtilityButton({
  onClick,
  disabled = false,
  children,
  className = '',
  ariaLabel,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'sidebar-raised-btn ui-focus-ring flex min-h-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
