/**
 * PipMint mana picker — anchored popover / mobile top sheet.
 * Symbols live in the popup (one scroll inside the popup only).
 * Never covers name / P/T / font inputs (collision-aware placement).
 * On narrow viewports: top sheet under the header, above the phone dock.
 * Classic (default) + Legacy set switcher; no Alternate/Custom; no Quick Picks; no syntax dump.
 */
import { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import {
  buildManaPickerKeysForSet,
  formatManaTokenInnerForSet,
  getManaSymbolMap,
  MANA_PICKER_SET_IDS,
  MANA_SYMBOL_SET_LABELS,
  normalizeManaSymbolSetId,
  splitPrefixedManaTokenInner,
  type ManaSymbolSetId,
} from '../../authority/manaSymbolSetAuthority'
import { getSymbolDataUrl, scaleManaPipDisplaySizePx } from '../../authority/symbolAuthority'
import { useCardStore } from '../../store/useCardStore'
import { normalizeStoreManaCost } from '../../utils/manaCanonical'
import { UI_TEXT_SECTION_HEADER } from '../../authority/typographyAuthority'
import {
  collectManaKeepClearRects,
  computeManaPopoverPlacement,
  findManaAnchorRect,
  type ManaPopoverPlacement,
} from '../../utils/manaPopoverPlacement'

const PIP_PREVIEW_PX = 32

type ManaCostChip = {
  raw: string
  start: number
  end: number
  lookupKey: string
  symbolSet: ManaSymbolSetId
}

function parseManaCostChips(manaCost: string): ManaCostChip[] {
  const s = String(manaCost ?? '')
  const out: ManaCostChip[] = []
  const re = /\{([^{}]+)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    const inner = m[1].trim()
    const { symbolSet, coreInner } = splitPrefixedManaTokenInner(inner)
    const lookupKey = coreInner
      .toLowerCase()
      .replace(/[\s/]+/g, '')
    out.push({
      raw: m[0],
      start: m.index,
      end: m.index + m[0].length,
      lookupKey: lookupKey === 't' ? 'tap' : lookupKey,
      symbolSet,
    })
  }
  return out
}

export default function ManaSymbolPopupPanel() {
  const manaPopupOpen = useCardStore((s) => s.manaPopupOpen)
  const manaPopupHost = useCardStore((s) => s.manaPopupHost)
  const manaPopupTarget = useCardStore((s) => s.manaPopupTarget)
  const manaSymbolSet = useCardStore((s) => normalizeManaSymbolSetId(s.cardData.manaSymbolSet))
  const setActiveInputId = useCardStore((s) => s.setActiveInputId)
  const setActiveSelectionRange = useCardStore((s) => s.setActiveSelectionRange)
  const insertManaSymbol = useCardStore((s) => s.insertManaSymbol)
  const closeManaPopup = useCardStore((s) => s.closeManaPopup)
  const setManaPopupTarget = useCardStore((s) => s.setManaPopupTarget)
  const registerManaInputFocus = useCardStore((s) => s.registerManaInputFocus)
  const setField = useCardStore((s) => s.setField)
  const commitState = useCardStore((s) => s.commitState)
  const manaCost = useCardStore((s) => s.cardData.manaCost)
  const cardText = useCardStore((s) => s.cardData.cardText)
  const activeInputId = useCardStore((s) => s.activeInputId)
  const activeSelectionStart = useCardStore((s) => s.activeSelectionStart)
  const activeSelectionEnd = useCardStore((s) => s.activeSelectionEnd)

  const panelRef = useRef<HTMLDivElement | null>(null)
  const [placement, setPlacement] = useState<ManaPopoverPlacement | null>(null)

  const manaPickerKeys = useMemo(() => buildManaPickerKeysForSet(manaSymbolSet), [manaSymbolSet])
  const manaSymbolMap = useMemo(() => getManaSymbolMap(manaSymbolSet), [manaSymbolSet])
  const costChips = useMemo(() => parseManaCostChips(manaCost ?? ''), [manaCost])

  const handleManaSymbolSetChange = useCallback(
    (nextSet: ManaSymbolSetId) => {
      if (!MANA_PICKER_SET_IDS.includes(nextSet)) return
      setField('manaSymbolSet', nextSet)
      commitState()
    },
    [setField, commitState],
  )

  const recomputePlacement = useCallback(() => {
    if (!manaPopupOpen) {
      setPlacement(null)
      return
    }
    const host = manaPopupHost ?? manaPopupTarget ?? 'manaCost'
    const anchor = findManaAnchorRect(host)
    const keepClear = collectManaKeepClearRects()
    if (!anchor) {
      // Fallback sheet if the CTA isn't in the DOM yet
      setPlacement(
        computeManaPopoverPlacement(
          new DOMRect(window.innerWidth / 2, window.innerHeight * 0.35, 1, 1),
          keepClear,
        ),
      )
      return
    }
    setPlacement(computeManaPopoverPlacement(anchor, keepClear))
  }, [manaPopupOpen, manaPopupHost, manaPopupTarget])

  useLayoutEffect(() => {
    recomputePlacement()
  }, [recomputePlacement, manaPopupOpen, costChips.length, manaSymbolSet])

  useEffect(() => {
    if (!manaPopupOpen) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t)) return
      const entry = (e.target as HTMLElement | null)?.closest?.('[data-mana-picker-entry]')
      if (entry) return
      closeManaPopup()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeManaPopup()
    }
    const onReposition = () => recomputePlacement()
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
  }, [manaPopupOpen, closeManaPopup, recomputePlacement])

  const handleInsert = useCallback(
    (token: string) => {
      const current = manaPopupTarget === 'manaCost' ? (manaCost ?? '') : (cardText ?? '')
      const len = current.length
      setActiveInputId(manaPopupTarget)
      const useStoredCaret =
        manaPopupTarget === activeInputId &&
        Number.isFinite(activeSelectionStart) &&
        Number.isFinite(activeSelectionEnd)
      const start = useStoredCaret
        ? Math.max(0, Math.min(len, Math.floor(activeSelectionStart)))
        : len
      const end = useStoredCaret
        ? Math.max(0, Math.min(len, Math.floor(activeSelectionEnd)))
        : len
      // Mana cost: always append (chip-row mental model). Rules: respect caret when known.
      if (manaPopupTarget === 'manaCost') {
        setActiveSelectionRange(len, len)
      } else {
        setActiveSelectionRange(start, end)
      }
      const caret = insertManaSymbol(token)
      registerManaInputFocus?.(manaPopupTarget, caret)
      if (manaPopupTarget === 'manaCost') commitState()
    },
    [
      manaPopupTarget,
      manaCost,
      cardText,
      activeInputId,
      activeSelectionStart,
      activeSelectionEnd,
      setActiveInputId,
      setActiveSelectionRange,
      insertManaSymbol,
      registerManaInputFocus,
      commitState,
    ],
  )

  const handleRemoveChip = useCallback(
    (index: number) => {
      const chips = parseManaCostChips(manaCost ?? '')
      const chip = chips[index]
      if (!chip) return
      const next = normalizeStoreManaCost(
        `${(manaCost ?? '').slice(0, chip.start)}${(manaCost ?? '').slice(chip.end)}`,
      )
      setField('manaCost', next)
      commitState()
    },
    [manaCost, setField, commitState],
  )

  /** Backspace-style: remove one pip from the end of the current cost. */
  const handleClearCost = useCallback(() => {
    const chips = parseManaCostChips(manaCost ?? '')
    if (chips.length === 0) return
    const chip = chips[chips.length - 1]
    const next = normalizeStoreManaCost(
      `${(manaCost ?? '').slice(0, chip.start)}${(manaCost ?? '').slice(chip.end)}`,
    )
    setField('manaCost', next)
    commitState()
  }, [manaCost, setField, commitState])

  const handleTargetChange = useCallback(
    (next: 'manaCost' | 'rulesText') => {
      setManaPopupTarget(next)
      setActiveInputId(next)
      const current = next === 'manaCost' ? (manaCost ?? '') : (cardText ?? '')
      const len = current.length
      setActiveSelectionRange(len, len)
    },
    [setManaPopupTarget, setActiveInputId, setActiveSelectionRange, manaCost, cardText],
  )

  if (!manaPopupOpen || !placement) return null

  const allPips = manaPickerKeys.filter((k) => !!manaSymbolMap[k.dataKey])

  const renderPip = (token: string, dataKey: string) => {
    const src = manaSymbolMap[dataKey]
    if (!src) return null
    return (
      <button
        key={`pip-${manaSymbolSet}-${dataKey}`}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleInsert(token)}
        className="mana-picker-pip ui-focus-ring"
        aria-label={`Insert {${formatManaTokenInnerForSet(manaSymbolSet, token)}}`}
        title={`Insert {${formatManaTokenInnerForSet(manaSymbolSet, token)}}`}
      >
        <img
          src={src}
          alt=""
          style={{
            width: scaleManaPipDisplaySizePx(PIP_PREVIEW_PX, manaSymbolSet),
            height: scaleManaPipDisplaySizePx(PIP_PREVIEW_PX, manaSymbolSet),
          }}
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      </button>
    )
  }

  const portalRoot =
    (typeof document !== 'undefined' && document.querySelector('[data-app-theme]')) ||
    (typeof document !== 'undefined' ? document.body : null)

  if (!portalRoot) return null

  return createPortal(
    <>
      {placement.mode === 'sheet' ? (
        <div
          className={[
            'mana-picker-sheet-veil',
            placement.edge === 'top' ? 'is-top' : 'is-bottom',
          ].join(' ')}
          aria-hidden
        />
      ) : null}
      <div
        ref={panelRef}
        className={[
          'mana-picker-popover',
          placement.mode === 'sheet'
            ? `is-sheet is-sheet-${placement.edge}`
            : 'is-anchored',
        ].join(' ')}
        role="dialog"
        aria-modal="false"
        aria-label="Mana symbol picker"
        style={{
          position: 'fixed',
          top: placement.top,
          left: placement.left,
          width: placement.width,
          // Definite height so flex body (symbol grid) cannot collapse under chrome.
          height: placement.maxHeight,
          maxHeight: placement.maxHeight,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="mana-picker-popover__chrome">
          <div className="mana-picker-popover__title-row">
            <h3 className={UI_TEXT_SECTION_HEADER}>Mana</h3>
            <button
              type="button"
              className="mana-picker-popover__close ui-focus-ring"
              onMouseDown={(e) => e.preventDefault()}
              onClick={closeManaPopup}
              aria-label="Close mana picker"
            >
              <X size={16} aria-hidden />
            </button>
          </div>

          <div className="mana-picker-segment" role="group" aria-label="Insert destination">
            <button
              type="button"
              onClick={() => handleTargetChange('manaCost')}
              className={[
                'mana-picker-segment__btn ui-focus-ring',
                manaPopupTarget === 'manaCost' ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={manaPopupTarget === 'manaCost'}
            >
              Cost
            </button>
            <button
              type="button"
              onClick={() => handleTargetChange('rulesText')}
              className={[
                'mana-picker-segment__btn ui-focus-ring',
                manaPopupTarget === 'rulesText' ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={manaPopupTarget === 'rulesText'}
            >
              Rules
            </button>
          </div>

          <div className="mana-picker-segment" role="group" aria-label="Mana symbol set">
            {MANA_PICKER_SET_IDS.map((setId) => (
              <button
                key={setId}
                type="button"
                onClick={() => handleManaSymbolSetChange(setId)}
                className={[
                  'mana-picker-segment__btn ui-focus-ring',
                  manaSymbolSet === setId ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={manaSymbolSet === setId}
                aria-label={`Use ${MANA_SYMBOL_SET_LABELS[setId]} mana symbols`}
              >
                {MANA_SYMBOL_SET_LABELS[setId]}
              </button>
            ))}
          </div>

          <div className="mana-picker-sheet__chips-block">
            <div className="mana-picker-sheet__chips-head">
              <span className="mana-picker-sheet__hint">Current cost</span>
              {costChips.length > 0 ? (
                <button
                  type="button"
                  className="mana-picker-sheet__clear ui-focus-ring"
                  onClick={handleClearCost}
                  aria-label="Delete last mana symbol"
                  title="Delete last symbol"
                >
                  Delete
                </button>
              ) : null}
            </div>
            <div className="mana-picker-chips" role="list" aria-label="Mana cost chips">
              {costChips.length === 0 ? (
                <span className="mana-picker-chips__empty">Tap a symbol to add</span>
              ) : (
                costChips.map((chip, i) => {
                  const src = getSymbolDataUrl(chip.lookupKey, chip.symbolSet)
                  return (
                    <button
                      key={`${chip.raw}-${chip.start}`}
                      type="button"
                      role="listitem"
                      className="mana-picker-chip ui-focus-ring"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleRemoveChip(i)}
                      aria-label={`Remove ${chip.raw} from mana cost`}
                      title="Tap to remove"
                    >
                      {src ? (
                        <img src={src} alt="" width={26} height={26} draggable={false} />
                      ) : (
                        <span className="mana-picker-chip__fallback">{chip.raw}</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </header>

        {/* Sole scroll owner — one flat wrapping grid of all standard symbols. */}
        <div className="mana-picker-popover__body">
          <div className="mana-picker-sheet__pips">
            {allPips.length > 0 ? (
              <div
                className="mana-picker-pip-grid"
                role="list"
                aria-label={`${MANA_SYMBOL_SET_LABELS[manaSymbolSet]} mana symbols`}
              >
                {allPips.map((k) => renderPip(k.token, k.dataKey))}
              </div>
            ) : (
              <p className="mana-picker-sheet__hint">No symbols available.</p>
            )}
          </div>
        </div>
      </div>
    </>,
    portalRoot,
  )
}
