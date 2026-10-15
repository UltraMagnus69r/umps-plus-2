import type { ReactNode } from 'react'
import { UI_VALIDATION_INLINE } from '../../authority/validationFeedbackAuthority'
import { UI_TEXT_METADATA_DANGER } from '../../authority/typographyAuthority'

type Props = {
  children: ReactNode
  id?: string
}

/** Phase 16.2 — compact field- or panel-local validation line (quiet danger metadata). */
export default function ValidationInline({ children, id }: Props) {
  return (
    <p id={id} className={`${UI_VALIDATION_INLINE} ${UI_TEXT_METADATA_DANGER}`} role="status">
      {children}
    </p>
  )
}
