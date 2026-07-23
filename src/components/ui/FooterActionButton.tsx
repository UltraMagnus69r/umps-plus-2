/**
 * Bottom-bar action control — single raised surface (aligned with sidebar row depth, no double frame).
 */
import type { ReactNode } from 'react'

export default function FooterActionButton({
  onClick,
  disabled = false,
  children,
  className = '',
  ariaLabel,
  title,
}: {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
  ariaLabel?: string
  /** Native tooltip (e.g. error detail when inline message is omitted for space). */
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={['footer-action-btn ui-focus-ring', className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  )
}
