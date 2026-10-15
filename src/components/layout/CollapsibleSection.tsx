import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { UI_TEXT_SECTION_HEADER } from '../../authority/typographyAuthority'
import { PANEL_CLASS } from '../../data/layoutConstants'

export type CollapsibleSectionMode = 'accordion' | 'drill'

export default function CollapsibleSection({
  title,
  icon,
  open,
  onToggle,
  children,
  mode = 'accordion',
  /** When another drill section owns the stack, hide this closed menu row. */
  stackOccupied = false,
  /**
   * Sole-section pills: skip accordion / drill chrome and render children directly
   * under the inspector (no chevron, no Back header).
   */
  inline = false,
}: {
  title: string
  icon?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  mode?: CollapsibleSectionMode
  stackOccupied?: boolean
  inline?: boolean
}) {
  if (inline) {
    return (
      <div className="inspector-drill-inline" aria-label={title}>
        {children}
      </div>
    )
  }

  if (mode === 'drill') {
    if (!open) {
      if (stackOccupied) return null
      return (
        <button
          type="button"
          className="inspector-drill-row ui-focus-ring"
          onClick={onToggle}
          aria-expanded={false}
        >
          <span className="flex min-w-0 items-center gap-ui2">
            {icon ? <span className="sidebar-section-icon shrink-0">{icon}</span> : null}
            <span className={UI_TEXT_SECTION_HEADER}>{title}</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden />
        </button>
      )
    }

    return (
      <section className="inspector-drill-panel" aria-label={title}>
        <header className="inspector-drill-panel__header">
          <button
            type="button"
            className="inspector-drill-back ui-focus-ring"
            onClick={onToggle}
            aria-label={`Back from ${title}`}
          >
            <ChevronLeft size={18} aria-hidden />
            <span>Back</span>
          </button>
          <div className="inspector-drill-panel__title">
            {icon ? <span className="sidebar-section-icon shrink-0">{icon}</span> : null}
            <h3 className={UI_TEXT_SECTION_HEADER}>{title}</h3>
          </div>
        </header>
        <div className="inspector-drill-panel__body">{children}</div>
      </section>
    )
  }

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
