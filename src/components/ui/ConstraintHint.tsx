import type { ReactNode } from 'react'
import { UI_CONSTRAINT_HINT } from '../../authority/constraintFeedbackAuthority'
import { UI_TEXT_HELP_COMPACT } from '../../authority/typographyAuthority'

type Props = {
  children: ReactNode
  className?: string
}

/** Phase 16.3 — subtle inline note for disabled or layout-gated UI (not validation errors). */
export default function ConstraintHint({ children, className = '' }: Props) {
  return (
    <p
      className={[UI_CONSTRAINT_HINT, UI_TEXT_HELP_COMPACT, 'leading-snug', className].filter(Boolean).join(' ')}
    >
      {children}
    </p>
  )
}
