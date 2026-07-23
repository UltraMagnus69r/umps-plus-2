import { memo } from 'react'
import type { TriStatus } from '../../authority/statusIndicatorAuthority'
import { TRI_STATUS_LABEL } from '../../authority/statusIndicatorAuthority'
import { UI_TEXT_METADATA } from '../../authority/typographyAuthority'

type Props = {
  status: TriStatus
  className?: string
  /** Extra context (e.g. workflow phase). */
  title?: string
}

/**
 * Phase 16.1 — compact Ready / Invalid / Processing chip (dot + label).
 * Pair with `deriveContextTriStatus` or `deriveExportTriStatus`; no local state logic.
 * Phase 17.3 — memo: parent re-renders skip when tri props unchanged.
 */
function StatusTriIndicator({ status, className = '', title }: Props) {
  return (
    <span
      className={['ui-status-tri', `ui-status-tri--${status}`, className].filter(Boolean).join(' ')}
      title={title}
      aria-label={TRI_STATUS_LABEL[status]}
    >
      <span className="ui-status-tri__dot" aria-hidden />
      <span className={`ui-status-tri__label ${UI_TEXT_METADATA}`}>{TRI_STATUS_LABEL[status]}</span>
    </span>
  )
}

export default memo(StatusTriIndicator)
