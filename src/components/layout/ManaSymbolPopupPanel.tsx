/**
 * Phase 17.1 — lazy-loaded mana picker (image grid + manaData). Shell stays in `ManaSymbolPopup.tsx`.
 */
import { useMemo, useState, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import {
  UI_PANEL_BASE,
  UI_PANEL_OVERLAY,
  UI_PANEL_OVERLAY_BODY,
  UI_PANEL_OVERLAY_HEADER,
} from '../../authority/panelSurfaceAuthority'
import {
  buildManaPickerKeysForSet,
  formatManaTokenInnerForSet,
  getManaSymbolMap,
  getManaSymbolSetTokenPrefix,
  MANA_SYMBOL_SET_IDS,
  MANA_SYMBOL_SET_LABELS,
  normalizeManaSymbolSetId,
  type ManaSymbolSetId,
} from '../../authority/manaSymbolSetAuthority'
import {
  UI_TEXT_HELP,
  UI_TEXT_HELP_COMPACT,
  UI_TEXT_INVERSE_STRONG,
  UI_TEXT_LABEL_COMPACT_SEMIBOLD,
  UI_TEXT_LABEL_MD,
  UI_TEXT_SECTION_HEADER,
} from '../../authority/typographyAuthority'
import { MANA_POPUP_PANEL_WIDTH } from '../../data/layoutConstants'
import { scaleManaPipDisplaySizePx } from '../../authority/symbolAuthority'
import { useCardStore } from '../../store/useCardStore'

const MOUNTAIN_RED = '#d3202a'
const MANA_PICKER_PREVIEW_SIZE_PX = 28
/** Common WUBRG + colorless + digits shown first for faster picking. */
const QUICK_MANA_TOKENS = ['W', 'U', 'B', 'R', 'G', 'C', '1', '2', '3', 'X'] as const

const manaSetToggleClass = (active: boolean) =>
  [
    `ui-focus-ring px-3 py-1.5 ${UI_TEXT_LABEL_MD} transition-[background-color,color] duration-ui-standard ease-ui-out`,
    active
      ? 'bg-neutral-200 text-[var(--ui-color-text-strong)] dark:bg-neutral-700 dark:text-[var(--ui-color-text-strong)]'
      : 'bg-white text-[var(--ui-color-muted)] hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800',
  ].join(' ')

export default function ManaSymbolPopupPanel() {
  const manaPopupTarget = useCardStore((s) => s.manaPopupTarget)
  const manaPopupPosition = useCardStore((s) => s.manaPopupPosition)
  const manaSymbolSet = useCardStore((s) => normalizeManaSymbolSetId(s.cardData.manaSymbolSet))
  const setActiveInputId = useCardStore((s) => s.setActiveInputId)
  const setActiveSelectionRange = useCardStore((s) => s.setActiveSelectionRange)
  const insertManaSymbol = useCardStore((s) => s.insertManaSymbol)
  const closeManaPopup = useCardStore((s) => s.closeManaPopup)
  const setManaPopupTarget = useCardStore((s) => s.setManaPopupTarget)
  const setManaPopupPosition = useCardStore((s) => s.setManaPopupPosition)
  const registerManaInputFocus = useCardStore((s) => s.registerManaInputFocus)
  const setField = useCardStore((s) => s.setField)
  const commitState = useCardStore((s) => s.commitState)
  const manaCost = useCardStore((s) => s.cardData.manaCost)
  const cardText = useCardStore((s) => s.cardData.cardText)
  const activeInputId = useCardStore((s) => s.activeInputId)
  const activeSelectionStart = useCardStore((s) => s.activeSelectionStart)
  const activeSelectionEnd = useCardStore((s) => s.activeSelectionEnd)

  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, top: 0, left: 0 })
  const [syntaxOpen, setSyntaxOpen] = useState(false)

  const manaPickerKeys = useMemo(() => buildManaPickerKeysForSet(manaSymbolSet), [manaSymbolSet])
  const manaSymbolMap = useMemo(() => getManaSymbolMap(manaSymbolSet), [manaSymbolSet])

  const handleManaSymbolSetChange = useCallback(
    (nextSet: ManaSymbolSetId) => {
      setField('manaSymbolSet', nextSet)
      commitState()
    },
    [setField, commitState],
  )

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        top: manaPopupPosition.top,
        left: manaPopupPosition.left,
      })
    },
    [manaPopupPosition],
  )

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      setManaPopupPosition(
        dragStart.top + e.clientY - dragStart.y,
        dragStart.left + e.clientX - dragStart.x,
      )
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, dragStart, setManaPopupPosition])

  const handleInsert = useCallback(
    (token: string) => {
      const current =
        manaPopupTarget === 'manaCost' ? (manaCost ?? '') : (cardText ?? '')
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
      setActiveSelectionRange(start, end)
      const caret = insertManaSymbol(token)
      registerManaInputFocus?.(manaPopupTarget, caret)
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
    ],
  )

  return (
    <div
      className={`${UI_PANEL_OVERLAY} select-none`}
      style={{
        position: 'fixed',
        top: manaPopupPosition.top,
        left: manaPopupPosition.left,
        width: MANA_POPUP_PANEL_WIDTH,
        cursor: dragging ? 'grabbing' : undefined,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Mana symbol picker"
    >
      <div
        className={`${UI_PANEL_OVERLAY_HEADER} cursor-grab active:cursor-grabbing`}
        onMouseDown={handleDragStart}
      >
        <div className={UI_TEXT_SECTION_HEADER}>Insert Mana Symbol</div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={closeManaPopup}
          className="ui-focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-white transition-opacity duration-ui-standard ease-ui-out hover:opacity-90"
          style={{ backgroundColor: MOUNTAIN_RED }}
          aria-label="Close mana symbol picker"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className={`${UI_PANEL_OVERLAY_BODY} space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={UI_TEXT_HELP}>Insert into:</span>
          <div className={`flex ${UI_PANEL_BASE} ui-panel--pad-none overflow-hidden`}>
            <button
              type="button"
              onClick={() => setManaPopupTarget('manaCost')}
              className={manaSetToggleClass(manaPopupTarget === 'manaCost')}
              aria-pressed={manaPopupTarget === 'manaCost'}
              aria-label="Insert symbols into mana cost"
            >
              Mana Cost
            </button>
            <button
              type="button"
              onClick={() => setManaPopupTarget('rulesText')}
              className={manaSetToggleClass(manaPopupTarget === 'rulesText')}
              aria-pressed={manaPopupTarget === 'rulesText'}
              aria-label="Insert symbols into rules text"
            >
              Rules Text
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={UI_TEXT_HELP}>Symbol set:</span>
          <div className={`flex ${UI_PANEL_BASE} ui-panel--pad-none overflow-hidden`}>
            {MANA_SYMBOL_SET_IDS.map((setId) => (
              <button
                key={setId}
                type="button"
                onClick={() => handleManaSymbolSetChange(setId)}
                className={manaSetToggleClass(manaSymbolSet === setId)}
                aria-pressed={manaSymbolSet === setId}
                aria-label={`Use ${MANA_SYMBOL_SET_LABELS[setId]} mana symbols`}
              >
                {MANA_SYMBOL_SET_LABELS[setId]}
              </button>
            ))}
          </div>
        </div>

        {getManaSymbolSetTokenPrefix(manaSymbolSet) && manaPickerKeys.length === 0 ? (
          <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
            {MANA_SYMBOL_SET_LABELS[manaSymbolSet]} symbols are not loaded yet. Add entries to{' '}
            <span className="ui-text-mono-value">
              {manaSymbolSet === 'alternate' ? 'manaDataAlternate.js' : 'manaDataCustom.js'}
            </span>{' '}
            using the same keys as <span className="ui-text-mono-value">manaData.js</span>.
          </p>
        ) : null}

        {(() => {
          const byToken = new Map(manaPickerKeys.map((k) => [k.token.toUpperCase(), k]))
          const quick = QUICK_MANA_TOKENS.map((t) => byToken.get(t)).filter(
            (k): k is (typeof manaPickerKeys)[number] => !!k && !!manaSymbolMap[k.dataKey],
          )
          const quickSet = new Set(quick.map((k) => k.dataKey))
          const rest = manaPickerKeys.filter((k) => !quickSet.has(k.dataKey))
          const renderBtn = (token: string, dataKey: string) => {
            const src = manaSymbolMap[dataKey]
            if (!src) return null
            return (
              <button
                key={`${manaSymbolSet}-${dataKey}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleInsert(token)}
                className={[
                  'ui-focus-ring flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-ui-standard ease-ui-out',
                  'border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200',
                  'dark:border-neutral-700 dark:hover:bg-neutral-900 dark:active:bg-neutral-800',
                ].join(' ')}
                aria-label={`Insert {${formatManaTokenInnerForSet(manaSymbolSet, token)}} mana symbol`}
                title={`Insert {${formatManaTokenInnerForSet(manaSymbolSet, token)}}`}
              >
                <img
                  src={src}
                  alt=""
                  style={{
                    width: scaleManaPipDisplaySizePx(MANA_PICKER_PREVIEW_SIZE_PX, manaSymbolSet),
                    height: scaleManaPipDisplaySizePx(MANA_PICKER_PREVIEW_SIZE_PX, manaSymbolSet),
                  }}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            )
          }
          return (
            <>
              {quick.length > 0 ? (
                <div className="space-y-1">
                  <div className={UI_TEXT_HELP_COMPACT}>Quick picks</div>
                  <div className="flex flex-wrap gap-2">
                    {quick.map((k) => renderBtn(k.token, k.dataKey))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {rest.map((k) => renderBtn(k.token, k.dataKey))}
              </div>
            </>
          )
        })()}

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={closeManaPopup}
          className={`ui-focus-ring h-10 w-full rounded-xl ${UI_TEXT_INVERSE_STRONG} transition-opacity duration-ui-standard ease-ui-out hover:opacity-90`}
          style={{ backgroundColor: MOUNTAIN_RED }}
          aria-label="Close mana symbol picker"
        >
          Close
        </button>

        <div className={`w-full ${UI_PANEL_BASE} ui-panel--pad-none overflow-hidden`}>
          <button
            type="button"
            className={`ui-focus-ring flex w-full items-center justify-between px-3 py-2 ${UI_TEXT_SECTION_HEADER} transition-[background-color,color] duration-ui-standard ease-ui-out`}
            onClick={() => setSyntaxOpen((v) => !v)}
            aria-expanded={syntaxOpen}
            aria-label={syntaxOpen ? 'Hide syntax info' : 'Show syntax info'}
          >
            <span>Syntax Info</span>
            {syntaxOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <div className={['ui-subpanel-reveal', syntaxOpen ? 'is-open' : ''].filter(Boolean).join(' ')}>
            <div className="ui-subpanel-reveal-inner">
              <div className="px-3 pb-3 pt-1">
                <div className={UI_TEXT_LABEL_MD}>Mana Symbol Assistant</div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <div>
                    <div className={UI_TEXT_LABEL_COMPACT_SEMIBOLD}>Canonical mana syntax</div>
                    <div className="mt-1 ui-text-mono-value">
                      {'{R}'} {'{1}'} {'{G}'}
                    </div>
                  </div>
                  <div>
                    <div className={UI_TEXT_LABEL_COMPACT_SEMIBOLD}>Hybrid symbols</div>
                    <div className="mt-1 ui-text-mono-value">
                      {'{U/B}'} {'{W/U}'} {'{2/W}'} {'{2/G}'}
                    </div>
                  </div>
                  <div>
                    <div className={UI_TEXT_LABEL_COMPACT_SEMIBOLD}>Phyrexian symbols</div>
                    <div className="mt-1 ui-text-mono-value">
                      {'{W/P}'} {'{U/P}'}
                    </div>
                  </div>
                  <div className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
                    Reminder text (parenthetical/italics) should be typed normally.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
