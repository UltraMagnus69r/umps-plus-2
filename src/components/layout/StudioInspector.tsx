import { memo } from 'react'
import type { InspectorSegment } from '../../hooks/useInspectorSegment'
import SidebarLeft from './SidebarLeft'
import SidebarRight from './SidebarRight'

type Props = {
  segment: InspectorSegment
  className?: string
  /** Phone bottom sheet: omit desktop chrome width classes */
  phone?: boolean
}

function StudioInspector({ segment, className = '', phone = false }: Props) {
  return (
    <aside
      className={[
        'studio-inspector',
        phone ? 'studio-phone-sheet' : 'studio-inspector--desktop',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Inspector"
    >
      {phone ? <div className="studio-phone-sheet__handle" aria-hidden /> : null}
      {!phone ? (
        <div className="flex items-center justify-between gap-2 border-b border-[var(--separator)] px-3 py-2.5">
          <div className="min-w-0">
            <div className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              {segment === 'content' ? 'Content' : segment === 'look' ? 'Look' : 'Details'}
            </div>
            <div className="truncate text-[0.6875rem] text-[var(--text-tertiary)]">
              {segment === 'content'
                ? 'Name, mana, type, rules, art'
                : segment === 'look'
                  ? 'Layout, colors, materials'
                  : 'Collector, type, panels, guides'}
            </div>
          </div>
        </div>
      ) : null}
      <div className="studio-inspector__body" key={segment}>
        <div className="studio-inspector__pane">
          {segment === 'content' ? <SidebarLeft inspectorSegment="content" /> : null}
          {segment === 'look' ? <SidebarRight inspectorSegment="look" /> : null}
          {segment === 'details' ? (
            <div className="flex h-full min-h-0 flex-col overflow-y-auto">
              <SidebarLeft inspectorSegment="details" />
              <SidebarRight inspectorSegment="details" />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

export default memo(StudioInspector)
