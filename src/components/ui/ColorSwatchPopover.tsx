/**
 * Color swatch that opens a viewport-clamped popover (native color inputs often
 * open off-screen near inspector edges).
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { clampPopupPosition } from '../../utils/clampPopupPosition'

const PANEL_W = 220
const PANEL_H = 72

type Props = {
  value: string
  onChange: (hex: string) => void
  ariaLabel: string
  className?: string
}

function normalizeHex(value: string): string {
  return /^#([0-9a-f]{6})$/i.test(value) ? value : '#111111'
}

export default function ColorSwatchPopover({ value, onChange, ariaLabel, className }: Props) {
  const hex = normalizeHex(value)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputId = useId()

  const place = useCallback(() => {
    const el = buttonRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    // Prefer left of swatch (inspector is usually on the right); else below.
    const preferLeft = r.left - PANEL_W - 8
    const leftCandidate = preferLeft >= 8 ? preferLeft : r.right + 8
    const topCandidate = r.top + r.height / 2 - PANEL_H / 2
    setPos(clampPopupPosition(topCandidate, leftCandidate, PANEL_W, PANEL_H, 8))
  }, [])

  useEffect(() => {
    if (!open) return
    place()
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      if (buttonRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onReposition = () => place()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReposition)
    window.addEventListener('scroll', onReposition, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }
  }, [open, place])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={
          className ??
          'h-[var(--ui-control-height-sm)] w-full cursor-pointer rounded-[var(--ui-radius-xl)] border border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] p-ui1'
        }
        style={{ backgroundColor: hex }}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open && pos
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={ariaLabel}
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: PANEL_W,
                zIndex: 1100,
              }}
              className="rounded-xl border border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] p-3 shadow-2xl"
            >
              <label htmlFor={inputId} className="mb-1.5 block text-[11px] font-semibold text-[var(--ui-color-text-muted)]">
                Text color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={inputId}
                  type="color"
                  value={hex}
                  onChange={(e) => onChange(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--ui-color-border)] bg-transparent p-0.5"
                  aria-label={ariaLabel}
                />
                <input
                  type="text"
                  value={hex.toUpperCase()}
                  onChange={(e) => {
                    const next = e.target.value.trim()
                    if (/^#?[0-9a-f]{6}$/i.test(next)) {
                      onChange(next.startsWith('#') ? next : `#${next}`)
                    }
                  }}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--ui-color-border)] bg-[var(--ui-color-surface)] px-2 text-sm tabular-nums outline-none"
                  aria-label={`${ariaLabel} hex`}
                  spellCheck={false}
                />
              </div>
            </div>,
            (typeof document !== 'undefined' && document.querySelector('[data-app-theme]')) ||
              document.body,
          )
        : null}
    </>
  )
}
