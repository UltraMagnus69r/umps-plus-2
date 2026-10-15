/**
 * Module UI-B — Primary Action Button Authority.
 * Canonical button for primary editor actions (Export PNG, Save Design, etc.).
 */
import type { ReactNode } from 'react'

export default function PrimaryActionButton({
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
        'ui-interactive-btn-primary ui-focus-ring flex h-[var(--ui-control-height-md)] items-center gap-ui2 rounded-[var(--ui-radius-xl)] bg-[var(--ui-color-primary)] px-ui3 text-[length:var(--ui-font-size-md)] font-semibold text-[var(--ui-color-on-primary)] hover:bg-[var(--ui-color-primary-hover)] disabled:opacity-70',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
