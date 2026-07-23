/**
 * Module UI-B — FieldRow Authority.
 * Canonical form row: label left, control right (or stacked for same-as-current appearance).
 */
import type { ReactNode } from 'react'
import { UI_TEXT_LABEL } from '../../authority/typographyAuthority'

const LABEL_CLASS = `${UI_TEXT_LABEL} shrink-0`

export default function FieldRow({
  label,
  children,
  layout = 'horizontal',
}: {
  label: string
  children: ReactNode
  /** 'stacked' = label above control (preserves current sidebar look); 'horizontal' = label left, control right */
  layout?: 'horizontal' | 'stacked'
}) {
  if (layout === 'stacked') {
    return (
      <div className="space-y-ui2 py-ui2">
        <label className={LABEL_CLASS}>{label}</label>
        <div className="min-w-0">{children}</div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-ui3 py-ui2">
      <label className={LABEL_CLASS}>{label}</label>
      <div className="min-w-0 flex-1 flex justify-end">{children}</div>
    </div>
  )
}
