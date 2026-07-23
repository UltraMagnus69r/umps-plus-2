import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import { useCardStore } from '../../store/useCardStore'
import {
  OUTER_BORDER_COLOR_CHIPS,
  OUTER_BORDER_IDENTITY_TAGS,
  OUTER_BORDER_SECTIONS,
  getOuterBorderSectionsByIds,
  type ColorTag,
} from '../../data/outerBorderOptions'
import {
  effectivePanelBackground,
  isPanelBackgroundField,
  type PanelBackgroundField,
} from '../../authority/panelBackgroundAuthority'

const FADE_MS = 160

const IDENTITY = new Set<ColorTag>(OUTER_BORDER_IDENTITY_TAGS)

// Thematic highlight per mana color when its chip is active. Use `background`
// instead of `backgroundColor` so any inherited button gradient/background image is cleared.
const COLOR_HEX: Record<string, { bg: string; fg: string }> = {
  W: { bg: '#efe7c8', fg: '#1a1a1a' },
  U: { bg: '#0e68ab', fg: '#ffffff' },
  B: { bg: '#1a1410', fg: '#ffffff' },
  R: { bg: '#d3202a', fg: '#ffffff' },
  G: { bg: '#00733d', fg: '#ffffff' },
  C: { bg: '#b0b7c2', fg: '#1a1a1a' },
}

/**
 * Outer Border picker — custom dropdown with live hover preview and fade-to-close.
 * Filters: free-text search, identity chips (W U B R G C — the selected set must match
 * an item's colors exactly, so 1 = mono, 2 = that dual pair, up to all 5 for WUBRG), and
 * per-section chips. Hovering an option previews it on the card; picking commits + fades.
 */
type BorderPickerProps = {
  /** Which CardData field this picker drives. Defaults to the outer border. */
  field?: 'outerBorderColor' | 'innerBorderBackground' | PanelBackgroundField
  /** Optional pinned option shown at the top (e.g. the inner border's "From Color Identity"). */
  identityOption?: { value: string; label: string }
  /** Fixed text shown on the trigger button instead of the current selection. */
  buttonLabel?: string
  /** When set, only these picker sections are listed (e.g. `['classic']` for panel backgrounds). */
  sectionIds?: readonly string[]
}

export default function OuterBorderPicker({
  field = 'outerBorderColor',
  identityOption,
  buttonLabel,
  sectionIds,
}: BorderPickerProps = {}) {
  const fallback = field === 'innerBorderBackground' ? 'identity' : field === 'outerBorderColor' ? 'black' : '#f7f7f0'
  const catalogSections = useMemo(
    () => (sectionIds?.length ? getOuterBorderSectionsByIds(sectionIds) : OUTER_BORDER_SECTIONS),
    [sectionIds],
  )
  const panelBackgroundPreview = useCardStore((s) => s.panelBackgroundPreview)
  const storedValue = useCardStore(
    (s) => ((s.cardData as unknown as Record<string, unknown>)[field] as string | undefined) ?? fallback,
  )
  const value = isPanelBackgroundField(field)
    ? effectivePanelBackground(field, storedValue, panelBackgroundPreview)
    : storedValue
  const setField = useCardStore((s) => s.setField)
  const commitState = useCardStore((s) => s.commitState)
  const setOuterPreview = useCardStore((s) => s.setOuterBorderColorPreview)
  const setInnerPreview = useCardStore((s) => s.setInnerBorderBackgroundPreview)
  const setPanelPreview = useCardStore((s) => s.setPanelBackgroundPreview)
  const setPreview = useCallback(
    (v: string | null) => {
      if (isPanelBackgroundField(field)) {
        if (v == null) setPanelPreview(null)
        else setPanelPreview({ field, value: v })
        return
      }
      if (field === 'innerBorderBackground') {
        setInnerPreview(v)
        return
      }
      if (field === 'outerBorderColor') {
        setOuterPreview(v)
      }
    },
    [field, setInnerPreview, setOuterPreview, setPanelPreview],
  )
  const setPreviewRef = useRef(setPreview)
  setPreviewRef.current = setPreview

  const currentLabel = useMemo(() => {
    if (identityOption && value === identityOption.value) return identityOption.label
    for (const section of catalogSections) {
      const found = section.items.find((i) => i.value === value)
      if (found) return found.label
    }
    for (const section of OUTER_BORDER_SECTIONS) {
      const found = section.items.find((i) => i.value === value)
      if (found) return found.label
    }
    return value
  }, [value, identityOption, catalogSections])

  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [query, setQuery] = useState('')
  const [colors, setColors] = useState<ColorTag[]>([])
  const [sections, setSections] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)
  const [pos, setPos] = useState<{
    left: number
    width: number
    top?: number
    bottom?: number
    maxHeight: number
  } | null>(null)

  // Position the portal panel relative to the trigger, flipping upward near the viewport bottom.
  const updatePos = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom - 8
    const spaceAbove = r.top - 8
    const openUp = spaceBelow < 360 && spaceAbove > spaceBelow
    setPos(
      openUp
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4, maxHeight: spaceAbove }
        : { left: r.left, width: r.width, top: r.bottom + 4, maxHeight: spaceBelow },
    )
  }, [])

  const toggleColor = (tag: ColorTag) => {
    setColors((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]))
  }

  const toggleSection = (id: string) => {
    setSections((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]))
  }

  const clearFilters = () => {
    setQuery('')
    setColors([])
    setSections([])
  }

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalogSections.map((section) => {
      if (sections.length > 0 && !sections.includes(section.id)) return { ...section, items: [] }
      const items = section.items.filter((it) => {
        if (q && !it.label.toLowerCase().includes(q)) return false
        if (colors.length > 0) {
          // Exact identity match: selected set must equal the item's W/U/B/R/G/C identity.
          const identity = it.colors.filter((c) => IDENTITY.has(c))
          if (identity.length !== colors.length) return false
          if (!colors.every((c) => identity.includes(c))) return false
        }
        return true
      })
      return { ...section, items }
    }).filter((section) => section.items.length > 0)
  }, [query, colors, sections, catalogSections])

  const resultCount = useMemo(
    () => filteredSections.reduce((n, s) => n + s.items.length, 0),
    [filteredSections],
  )

  const hasFilters = query.trim() !== '' || colors.length > 0 || sections.length > 0

  const finishClose = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setOpen(false)
    setClosing(false)
    setPreview(null)
  }, [setPreview])

  const fadeClose = useCallback(() => {
    setClosing(true)
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(finishClose, FADE_MS)
  }, [finishClose])

  const cancelClose = useCallback(() => {
    setPreview(null)
    fadeClose()
  }, [fadeClose, setPreview])

  const openPanel = useCallback(() => {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current)
    closeTimer.current = null
    setClosing(false)
    updatePos()
    setOpen(true)
  }, [updatePos])

  const handlePick = useCallback(
    (v: string) => {
      setField(field, v)
      commitState()
      finishClose()
    },
    [commitState, field, finishClose, setField],
  )

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (containerRef.current?.contains(t)) return
      cancelClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelClose()
    }
    const onReflow = () => updatePos()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReflow)
    window.addEventListener('scroll', onReflow, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReflow)
      window.removeEventListener('scroll', onReflow, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(
    () => () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current)
      setPreviewRef.current(null)
    },
    [],
  )

  const panelVisible = open && !closing

  const chipBase = 'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors border'
  const chipOff =
    'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)] dark:text-neutral-300 dark:hover:bg-neutral-800'
  const sectionOn =
    'border-transparent bg-neutral-900 text-white ring-2 ring-inset ring-neutral-500 dark:bg-neutral-100 dark:text-neutral-900 dark:ring-neutral-400'

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open && !closing ? cancelClose() : openPanel())}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
        aria-haspopup="listbox"
        aria-expanded={panelVisible}
      >
        <span className="truncate">{buttonLabel ?? currentLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${panelVisible ? 'rotate-180' : ''}`} />
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: pos.left,
              width: pos.width,
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxHeight,
              zIndex: 1000,
            }}
            className={`flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl transition-opacity duration-150 dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)] ${
              closing ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            role="listbox"
          >
          {/* Search + filters (fixed) */}
          <div className="shrink-0 space-y-2 border-b border-neutral-200 p-2 dark:border-[var(--sb-border)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search borders…"
                className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-7 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface)]"
                aria-label="Search outer borders"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Row 1: single-color identity chips */}
            <div className="flex flex-wrap gap-1">
              {OUTER_BORDER_COLOR_CHIPS.map((c) => {
                const active = colors.includes(c.tag)
                const hex = COLOR_HEX[c.tag]
                return (
                  <button
                    key={c.tag}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleColor(c.tag)}
                    className={`${chipBase} h-7 w-8 p-0 text-center ${active ? 'border-transparent font-semibold' : chipOff}`}
                    style={
                      active
                        ? { background: hex.bg, color: hex.fg, boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.45)' }
                        : undefined
                    }
                  >
                    {c.label}
                  </button>
                )
              })}
              {colors.length >= 1 && (
                <span className="self-center pl-1 text-[11px] text-neutral-400">
                  {colors.length === 1 ? 'mono' : `${colors.length}-color`}
                </span>
              )}
            </div>

            {/* Row 2+: section header chips (hidden when catalog is fixed to one section) */}
            {(!sectionIds || sectionIds.length > 1) && (
            <div className="flex flex-wrap gap-1">
              {catalogSections.map((s) => {
                const active = sections.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSection(s.id)}
                    className={`${chipBase} ${active ? sectionOn : chipOff}`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
            )}

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-medium text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Results (scroll) */}
          <div className="min-h-0 flex-1 overflow-auto p-1" onMouseLeave={() => setPreview(null)}>
            {identityOption && (
              <button
                type="button"
                role="option"
                aria-selected={value === identityOption.value}
                onMouseEnter={() => setPreview(identityOption.value)}
                onFocus={() => setPreview(identityOption.value)}
                onClick={() => handlePick(identityOption.value)}
                className={`mb-1 block w-full truncate rounded-lg border border-neutral-200 px-2 py-1.5 text-left ui-text-control text-neutral-800 hover:bg-neutral-100 dark:border-[var(--sb-border)] dark:text-neutral-100 dark:hover:bg-neutral-800 ${
                  value === identityOption.value ? 'bg-neutral-100 font-semibold dark:bg-neutral-800' : ''
                }`}
              >
                {identityOption.label}
              </button>
            )}
            {filteredSections.length === 0 ? (
              <div className="px-2 py-6 text-center ui-text-control text-neutral-400">No matches</div>
            ) : (
              filteredSections.map((section) => (
                <div key={section.id} className="mb-1">
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    {section.label}
                  </div>
                  {section.items.map((it) => {
                    const selected = it.value === value
                    return (
                      <button
                        key={it.value}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setPreview(it.value)}
                        onFocus={() => setPreview(it.value)}
                        onClick={() => handlePick(it.value)}
                        className={`block w-full truncate rounded-lg px-2 py-1.5 text-left ui-text-control text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800 ${
                          selected ? 'bg-neutral-100 font-semibold dark:bg-neutral-800' : ''
                        }`}
                      >
                        {it.label}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

            {/* Footer count */}
            <div className="shrink-0 border-t border-neutral-200 px-2 py-1 text-[11px] text-neutral-400 dark:border-[var(--sb-border)]">
              {resultCount} option{resultCount === 1 ? '' : 's'}
            </div>
          </div>,
          (typeof document !== 'undefined' && document.querySelector('[data-app-theme]')) || document.body,
        )}
    </div>
  )
}
