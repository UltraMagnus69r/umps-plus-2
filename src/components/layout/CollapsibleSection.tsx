import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { UI_TEXT_SECTION_HEADER } from '../../authority/typographyAuthority'
import { PANEL_CLASS } from '../../data/layoutConstants'

export default function CollapsibleSection({
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string
  icon?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className={PANEL_CLASS}>
      <button
        type="button"
        className={['sidebar-section-trigger ui-focus-ring', open ? 'is-open' : 'is-closed'].join(' ')}
        onClick={onToggle}
        aria-expanded={open}
      >
        <div className="flex items-center gap-ui2">
          <span className="sidebar-section-icon">{icon}</span>
          <div className={UI_TEXT_SECTION_HEADER}>{title}</div>
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      <div className={['sidebar-section-content-wrap', open ? 'is-open' : 'is-closed'].join(' ')}>
        <div className="sidebar-section-body">{children}</div>
      </div>
    </section>
  )
}
