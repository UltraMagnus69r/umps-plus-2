/**
 * Custom font-family listbox with live card preview on hover (see typographyFontPreview in store).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import { getCreativeFontFamily } from '../../data/fontCatalog'
import { UI_FOCUS_RING_CONTROL } from '../../authority/panelSurfaceAuthority'
import {
  CREATIVE_FONT_OPTIONS,
  UI_TEXT_CONTROL,
  type CreativeFontKey,
} from '../../authority/typographyAuthority'
import type { CardTypographyKey } from '../../store/useCardStore'
import { useCardStore } from '../../store/useCardStore'

const FADE_MS = 160

type Props = {
  typographyKey: CardTypographyKey
  value: CreativeFontKey
  onChange: (fontKey: CreativeFontKey) => void
  ariaLabel: string
  className?: string
}

export default function FontFamilyPicker({
  typographyKey,
  value,
  onChange,
  ariaLabel,
  className,
}: Props) {
  const setTypographyFontPreview = useCardStore((s) => s.setTypographyFontPreview)

  const currentLabel = useMemo(
    () => CREATIVE_FONT_OPTIONS.find((o) => o.key === value)?.label ?? value,
    [value],
  )

  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [query, setQuery] = useState('')
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

  const setPreview = useCallback(
    (fontKey: CreativeFontKey | null) => {
      if (fontKey == null) setTypographyFontPreview(null)
      else setTypographyFontPreview({ typographyKey, fontKey })
    },
    [setTypographyFontPreview, typographyKey],
  )

  const updatePos = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom - 8
    const spaceAbove = r.top - 8
    const openUp = spaceBelow < 320 && spaceAbove > spaceBelow
    setPos(
      openUp
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4, maxHeight: spaceAbove }
        : { left: r.left, width: r.width, top: r.bottom + 4, maxHeight: spaceBelow },
    )
  }, [])

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
    (fontKey: CreativeFontKey) => {
      onChange(fontKey)
      finishClose()
    },
    [finishClose, onChange],
  )

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CREATIVE_FONT_OPTIONS
    return CREATIVE_FONT_OPTIONS.filter((o) => o.label.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (buttonRef.current?.contains(t)) return
      cancelClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelClose()
    }
    const onScroll = () => updatePos()
    const onResize = () => updatePos()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [cancelClose, open, updatePos])

  useEffect(() => () => setPreview(null), [setPreview])

  const panelVisible = open && !closing
  const triggerClass =
    className ??
    `flex h-[var(--ui-control-height-sm)] w-full items-center justify-between rounded-[var(--ui-radius-xl)] border border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] px-ui2 ${UI_TEXT_CONTROL} ${UI_FOCUS_RING_CONTROL} text-[var(--ui-color-text)] outline-none`

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open && !closing ? cancelClose() : openPanel())}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={panelVisible}
        aria-label={ariaLabel}
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-70 transition-transform ${panelVisible ? 'rotate-180' : ''}`}
        />
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
            className={`flex flex-col overflow-hidden rounded-xl border border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] shadow-2xl transition-opacity duration-150 ${
              closing ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
            role="listbox"
            aria-label={ariaLabel}
          >
            <div className="shrink-0 border-b border-[var(--ui-color-border)] p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ui-color-text-muted)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search fonts…"
                  className={`w-full rounded-lg border border-[var(--ui-color-border)] bg-[var(--ui-color-surface)] py-1.5 pl-8 pr-7 ${UI_TEXT_CONTROL} outline-none ${UI_FOCUS_RING_CONTROL}`}
                  aria-label="Search fonts"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ui-color-text-muted)] hover:text-[var(--ui-color-text)]"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-1" onMouseLeave={() => setPreview(null)}>
              {filteredOptions.length === 0 ? (
                <div className={`px-2 py-6 text-center ${UI_TEXT_CONTROL} text-[var(--ui-color-text-muted)]`}>
                  No matches
                </div>
              ) : (
                filteredOptions.map((o) => {
                  const selected = o.key === value
                  const family = getCreativeFontFamily(o.key)
                  return (
                    <button
                      key={o.key}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setPreview(o.key)}
                      onFocus={() => setPreview(o.key)}
                      onClick={() => handlePick(o.key)}
                      className={[
                        'block w-full truncate rounded-lg px-2 py-1.5 text-left text-[var(--ui-color-text)] hover:bg-[var(--ui-color-surface-muted)]',
                        selected
                          ? 'bg-[color-mix(in_srgb,var(--ui-color-primary)_14%,var(--ui-color-surface-elevated))] font-semibold text-[var(--ui-color-text-strong)]'
                          : '',
                      ].join(' ')}
                      style={family ? { fontFamily: `"${family}", serif` } : undefined}
                    >
                      {o.label}
                    </button>
                  )
                })
              )}
            </div>

            <div className="shrink-0 border-t border-[var(--ui-color-border)] px-2 py-1 text-[11px] text-[var(--ui-color-text-muted)]">
              {filteredOptions.length} font{filteredOptions.length === 1 ? '' : 's'} — hover to preview on card
            </div>
          </div>,
          (typeof document !== 'undefined' && document.querySelector('[data-app-theme]')) || document.body,
        )}
    </div>
  )
}
