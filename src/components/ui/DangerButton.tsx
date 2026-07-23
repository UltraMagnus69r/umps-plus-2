/**
 * Module UI-B — Danger Button Authority.
 * Canonical button for destructive or irreversible actions.
 */
import type { ReactNode } from 'react'

export default function DangerButton({
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
        'ui-interactive-btn-danger ui-focus-ring flex h-[var(--ui-control-height-md)] cursor-pointer items-center gap-ui2 rounded-[var(--ui-radius-xl)] border border-[var(--ui-color-danger-border)] bg-[var(--ui-color-danger-surface)] px-ui3 text-[length:var(--ui-font-size-md)] font-semibold text-[var(--ui-color-danger-text)] disabled:cursor-not-allowed disabled:opacity-40',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
