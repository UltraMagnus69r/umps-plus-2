/**
 * Custom Proxy from Scryfall + full-card overlay controls — lazy-loaded off the main editor chunk.
 */
import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { useCardStore } from '../../store/useCardStore'
import {
  isScryfallNoMatchingPrintsMessage,
  UI_GUIDANCE_INLINE,
} from '../../authority/guidanceAuthority'
import {
  UI_ASYNC_SPINNER_SM,
  UI_ASYNC_SPINNER_XS,
  UI_INLINE_STATUS_SUCCESS,
} from '../../authority/stateFeedbackAuthority'
import { filterScryfallPrintCandidates } from '../../authority/scryfallResultsFilterAuthority'
import { UI_FOCUS_RING_CONTROL } from '../../authority/panelSurfaceAuthority'
import { UI_TEXT_HELP_COMPACT } from '../../authority/typographyAuthority'
import { CONSTRAINT_COPY } from '../../authority/constraintFeedbackAuthority'
import FieldRow from '../ui/FieldRow'
import SecondaryUtilityButton from '../ui/SecondaryUtilityButton'
import ConstraintHint from '../ui/ConstraintHint'
import ValidationInline from '../ui/ValidationInline'

const SCRYFALL_PRINT_THUMB_CLASS =
  'h-28 w-20 shrink-0 rounded object-cover border border-neutral-200/50 dark:border-neutral-700/50'
const SCRYFALL_PRINT_ACTION_BTN_CLASS =
  'ui-focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-500 transition-[color,border-color] duration-ui-standard ease-ui-out hover:border-emerald-500/45 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-900/80 dark:text-neutral-400 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400'
const INPUT_CLASS =
  `sidebar-input ${UI_FOCUS_RING_CONTROL} h-10 w-full px-3 text-sm outline-none [direction:ltr]`

type Props = {
  cardImageUrl: string
  setCardImageUrl: (v: string) => void
  cloneExportHint?: string | null
}

export default function ScryfallImportSection({
  cardImageUrl,
  setCardImageUrl,
  cloneExportHint,
}: Props) {
  const [scryfallSearchQuery, setScryfallSearchQuery] = useState('')
  const [scryfallCloneQuery, setScryfallCloneQuery] = useState('')
  const [scryfallImportPrintFilter, setScryfallImportPrintFilter] = useState('')
  const [scryfallClonePrintFilter, setScryfallClonePrintFilter] = useState('')

  const asyncScryfallFetch = useCardStore((s) => s.asyncStatus.scryfallFetch)
  const fetchAndApplyScryfallData = useCardStore((s) => s.fetchAndApplyScryfallData)
  const importScryfallPrintById = useCardStore((s) => s.importScryfallPrintById)
  const fetchScryfallCloneData = useCardStore((s) => s.fetchScryfallCloneData)
  const applyScryfallCloneById = useCardStore((s) => s.applyScryfallCloneById)
  const clearScryfallSearchFlow = useCardStore((s) => s.clearScryfallSearchFlow)
  const clearScryfallCloneFlow = useCardStore((s) => s.clearScryfallCloneFlow)
  const setClonedCardImage = useCardStore((s) => s.setClonedCardImage)
  const clearClonedCardImage = useCardStore((s) => s.clearClonedCardImage)
  const clonedCardImage = useCardStore((s) => s.cardData.clonedCardImage)
  const scryfallSearchStatus = useCardStore((s) => s.scryfallSearchStatus)
  const scryfallImportStatus = useCardStore((s) => s.scryfallImportStatus)
  const scryfallSearchResults = useCardStore((s) => s.scryfallSearchResults)
  const scryfallChosenPrint = useCardStore((s) => s.scryfallChosenPrint)
  const scryfallCloneSearchStatus = useCardStore((s) => s.scryfallCloneSearchStatus)
  const scryfallCloneApplyStatus = useCardStore((s) => s.scryfallCloneApplyStatus)
  const scryfallCloneSearchResults = useCardStore((s) => s.scryfallCloneSearchResults)
  const scryfallCloneChosenPrint = useCardStore((s) => s.scryfallCloneChosenPrint)
  const workspaceInitEpoch = useCardStore((s) => s.workspaceInitEpoch)

  useEffect(() => {
    setScryfallImportPrintFilter('')
  }, [scryfallSearchResults])
  useEffect(() => {
    setScryfallClonePrintFilter('')
  }, [scryfallCloneSearchResults])
  useEffect(() => {
    setScryfallSearchQuery('')
    setScryfallCloneQuery('')
    clearScryfallSearchFlow()
    clearScryfallCloneFlow()
  }, [workspaceInitEpoch, clearScryfallSearchFlow, clearScryfallCloneFlow])

  const filteredScryfallImportPrints = useMemo(
    () => filterScryfallPrintCandidates(scryfallSearchResults, scryfallImportPrintFilter),
    [scryfallSearchResults, scryfallImportPrintFilter],
  )
  const filteredScryfallClonePrints = useMemo(
    () => filterScryfallPrintCandidates(scryfallCloneSearchResults, scryfallClonePrintFilter),
    [scryfallCloneSearchResults, scryfallClonePrintFilter],
  )

  return (
    <>
      <FieldRow label="Custom Proxy from Scryfall" layout="stacked">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 min-w-0">
          <input
            value={scryfallSearchQuery}
            onChange={(e) => setScryfallSearchQuery(e.target.value)}
            className={`${INPUT_CLASS} flex-1 min-w-0`}
            placeholder="Name, Scryfall URL, or SET 123"
            aria-label="Custom Proxy from Scryfall search"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void fetchAndApplyScryfallData(scryfallSearchQuery)
              }
            }}
          />
          <SecondaryUtilityButton
            onClick={() => {
              void fetchAndApplyScryfallData(scryfallSearchQuery)
            }}
            disabled={asyncScryfallFetch.status === 'loading'}
            ariaLabel="Custom Proxy from Scryfall — search and import"
            className="w-full shrink-0 sm:w-auto"
          >
            {asyncScryfallFetch.status === 'loading' ? (
              <span className="inline-flex items-center gap-2">
                <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
                Working…
              </span>
            ) : (
              'Search / Import'
            )}
          </SecondaryUtilityButton>
        </div>
        {scryfallSearchQuery.trim() === '' &&
        scryfallSearchResults.length === 0 &&
        asyncScryfallFetch.status !== 'loading' &&
        scryfallSearchStatus.status === 'idle' &&
        scryfallImportStatus.status === 'idle' ? (
          <p className={UI_GUIDANCE_INLINE}>Search for a card to import.</p>
        ) : null}
        <div className="pt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          Routing: URL to exact print, SET+collector to exact print, card name to print picker.
        </div>
        {asyncScryfallFetch.status === 'error' &&
        asyncScryfallFetch.message &&
        !isScryfallNoMatchingPrintsMessage(asyncScryfallFetch.message) ? (
          <div className="text-xs text-red-600 dark:text-red-400 pt-1">{asyncScryfallFetch.message}</div>
        ) : null}
        {scryfallSearchStatus.status === 'failure' && scryfallSearchStatus.message ? (
          isScryfallNoMatchingPrintsMessage(scryfallSearchStatus.message) ? (
            <p className={UI_GUIDANCE_INLINE}>No results found.</p>
          ) : (
            <div className="text-xs text-red-600 dark:text-red-400 pt-1">{scryfallSearchStatus.message}</div>
          )
        ) : null}
        {scryfallImportStatus.status === 'failure' && scryfallImportStatus.message && (
          <div className="text-xs text-red-600 dark:text-red-400 pt-1">{scryfallImportStatus.message}</div>
        )}
        {scryfallImportStatus.status === 'success' && (
          <div className={`${UI_INLINE_STATUS_SUCCESS} pt-1`}>Imported</div>
        )}
        {scryfallSearchStatus.status === 'success' && scryfallSearchStatus.message && (
          <div className="text-xs text-emerald-700 dark:text-emerald-400 pt-1">{scryfallSearchStatus.message}</div>
        )}
        {scryfallSearchResults.length > 1 && (
          <div className="pt-2 space-y-2 rounded-xl border border-neutral-200/45 dark:border-neutral-800/45 p-2 bg-white/40 dark:bg-neutral-900/28">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-200">Choose Exact Print</div>
              <button
                type="button"
                className="ui-focus-ring rounded-md px-1 py-0.5 text-[11px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                onClick={() => clearScryfallSearchFlow()}
                aria-label="Clear print search results"
              >
                Clear
              </button>
            </div>
            <input
              type="search"
              value={scryfallImportPrintFilter}
              onChange={(e) => setScryfallImportPrintFilter(e.target.value)}
              className={`${INPUT_CLASS} mt-1 h-9 py-1.5 text-xs`}
              placeholder="Filter prints…"
              aria-label="Filter import print list"
            />
            {scryfallImportPrintFilter.trim() && scryfallSearchResults.length > 1 ? (
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {filteredScryfallImportPrints.length === 0
                  ? 'No prints match filter.'
                  : `Showing ${filteredScryfallImportPrints.length} of ${scryfallSearchResults.length}`}
              </div>
            ) : null}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {filteredScryfallImportPrints.map((print) => {
                const selected = scryfallChosenPrint?.id === print.id
                return (
                  <div
                    key={print.id}
                    className={`rounded-lg border p-2 ${
                      selected
                        ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/20'
                        : 'border-neutral-200/50 dark:border-neutral-800/50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap sm:items-center">
                      {print.small_image ? (
                        <img
                          src={print.small_image}
                          alt={`${print.name} ${print.set} ${print.collector_number}`}
                          className={SCRYFALL_PRINT_THUMB_CLASS}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1 basis-[min(100%,12rem)] sm:basis-auto">
                        <div className="text-xs font-semibold truncate">{print.name}</div>
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                          {print.set.toUpperCase()} #{print.collector_number}
                          {print.set_name ? ` - ${print.set_name}` : ''}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {print.released_at ?? 'Unknown release'}
                          {print.rarity ? ` - ${print.rarity}` : ''}
                          {print.lang ? ` - ${print.lang.toUpperCase()}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`${SCRYFALL_PRINT_ACTION_BTN_CLASS} self-end sm:self-auto`}
                        onClick={() => {
                          void importScryfallPrintById(print.id)
                        }}
                        disabled={scryfallImportStatus.status === 'loading'}
                        aria-label={`Import ${print.name} ${print.set} ${print.collector_number}`}
                        title="Import this print"
                      >
                        {scryfallImportStatus.status === 'loading' ? (
                          <span className={UI_ASYNC_SPINNER_XS} aria-hidden />
                        ) : (
                          <Check className="h-5 w-5 shrink-0 stroke-[2.25]" aria-hidden />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </FieldRow>

      <div className="space-y-3 rounded-xl border border-neutral-200/45 bg-white/40 p-3 dark:border-neutral-800/45 dark:bg-neutral-900/28">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">Full-card overlay</div>
          <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
            For Hidden layout: drop in a printable full-card image. Unlike Custom Proxy from Scryfall, this
            does not fill name, rules, or art fields. Whichever you apply last wins.
          </p>
        </div>

        <FieldRow label="From Scryfall" layout="stacked">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 min-w-0">
            <input
              value={scryfallCloneQuery}
              onChange={(e) => setScryfallCloneQuery(e.target.value)}
              className={`${INPUT_CLASS} flex-1 min-w-0`}
              placeholder="Name, Scryfall URL, or SET 123"
              aria-label="Scryfall overlay search"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void fetchScryfallCloneData(scryfallCloneQuery)
                }
              }}
            />
            <SecondaryUtilityButton
              onClick={() => {
                void fetchScryfallCloneData(scryfallCloneQuery)
              }}
              disabled={
                scryfallCloneApplyStatus.status === 'loading' || scryfallCloneSearchStatus.status === 'loading'
              }
              ariaLabel="Search Scryfall for full-card overlay"
              className="w-full shrink-0 sm:w-auto"
            >
              {scryfallCloneApplyStatus.status === 'loading' ||
              scryfallCloneSearchStatus.status === 'loading' ? (
                <span className="inline-flex items-center gap-2">
                  <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
                  Working…
                </span>
              ) : (
                'Search / Apply'
              )}
            </SecondaryUtilityButton>
          </div>
          {scryfallCloneQuery.trim() === '' &&
          scryfallCloneSearchResults.length === 0 &&
          scryfallCloneSearchStatus.status !== 'loading' &&
          scryfallCloneApplyStatus.status !== 'loading' &&
          scryfallCloneSearchStatus.status === 'idle' &&
          scryfallCloneApplyStatus.status === 'idle' ? (
            <p className={UI_GUIDANCE_INLINE}>Search for a card to use as the overlay.</p>
          ) : null}
          <div className="pt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            Same routing as import; applies the selected print as the full-card overlay.
          </div>
          {scryfallCloneSearchStatus.status === 'failure' && scryfallCloneSearchStatus.message ? (
            isScryfallNoMatchingPrintsMessage(scryfallCloneSearchStatus.message) ? (
              <p className={UI_GUIDANCE_INLINE}>No results found.</p>
            ) : (
              <div className="text-xs text-red-600 dark:text-red-400 pt-1">
                {scryfallCloneSearchStatus.message}
              </div>
            )
          ) : null}
          {scryfallCloneApplyStatus.status === 'failure' && scryfallCloneApplyStatus.message && (
            <div className="text-xs text-red-600 dark:text-red-400 pt-1">{scryfallCloneApplyStatus.message}</div>
          )}
          {scryfallCloneApplyStatus.status === 'success' && (
            <div className={`${UI_INLINE_STATUS_SUCCESS} pt-1`}>Overlay applied</div>
          )}
          {scryfallCloneSearchStatus.status === 'success' && scryfallCloneSearchStatus.message && (
            <div className="text-xs text-emerald-700 dark:text-emerald-400 pt-1">
              {scryfallCloneSearchStatus.message}
            </div>
          )}
          {scryfallCloneSearchResults.length > 1 && (
            <div className="pt-2 space-y-2 rounded-xl border border-neutral-200/45 dark:border-neutral-800/45 p-2 bg-white/40 dark:bg-neutral-900/28">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
                  Choose print for overlay
                </div>
                <button
                  type="button"
                  className="ui-focus-ring rounded-md px-1 py-0.5 text-[11px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                  onClick={() => clearScryfallCloneFlow()}
                  aria-label="Clear overlay print search results"
                >
                  Clear
                </button>
              </div>
              <input
                type="search"
                value={scryfallClonePrintFilter}
                onChange={(e) => setScryfallClonePrintFilter(e.target.value)}
                className={`${INPUT_CLASS} mt-1 h-9 py-1.5 text-xs`}
                placeholder="Filter prints…"
                aria-label="Filter overlay print list"
              />
              {scryfallClonePrintFilter.trim() && scryfallCloneSearchResults.length > 1 ? (
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {filteredScryfallClonePrints.length === 0
                    ? 'No prints match filter.'
                    : `Showing ${filteredScryfallClonePrints.length} of ${scryfallCloneSearchResults.length}`}
                </div>
              ) : null}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filteredScryfallClonePrints.map((print) => {
                  const selected = scryfallCloneChosenPrint?.id === print.id
                  return (
                    <div
                      key={print.id}
                      className={`rounded-lg border p-2 ${
                        selected
                          ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/20'
                          : 'border-neutral-200/50 dark:border-neutral-800/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap sm:items-center">
                        {print.small_image ? (
                          <img
                            src={print.small_image}
                            alt={`${print.name} ${print.set} ${print.collector_number}`}
                            className={SCRYFALL_PRINT_THUMB_CLASS}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1 basis-[min(100%,12rem)] sm:basis-auto">
                          <div className="text-xs font-semibold truncate">{print.name}</div>
                          <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                            {print.set.toUpperCase()} #{print.collector_number}
                            {print.set_name ? ` - ${print.set_name}` : ''}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {print.released_at ?? 'Unknown release'}
                            {print.rarity ? ` - ${print.rarity}` : ''}
                            {print.lang ? ` - ${print.lang.toUpperCase()}` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`${SCRYFALL_PRINT_ACTION_BTN_CLASS} self-end sm:self-auto`}
                          onClick={() => {
                            void applyScryfallCloneById(print.id)
                          }}
                          disabled={scryfallCloneApplyStatus.status === 'loading'}
                          aria-label={`Apply overlay: ${print.name} ${print.set} ${print.collector_number}`}
                          title="Apply this print as overlay"
                        >
                          {scryfallCloneApplyStatus.status === 'loading' ? (
                            <span className={UI_ASYNC_SPINNER_XS} aria-hidden />
                          ) : (
                            <Check className="h-5 w-5 shrink-0 stroke-[2.25]" aria-hidden />
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </FieldRow>

        <FieldRow label="From image URL" layout="stacked">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 min-w-0">
            <input
              value={cardImageUrl}
              onChange={(e) => setCardImageUrl(e.target.value)}
              className={`${INPUT_CLASS} flex-1 min-w-0`}
              placeholder="https://…"
              aria-label="Full-card overlay image URL"
            />
            <SecondaryUtilityButton
              onClick={() => setClonedCardImage(cardImageUrl)}
              ariaLabel="Apply full-card overlay from image URL"
              className="w-full shrink-0 sm:w-auto"
            >
              Apply overlay
            </SecondaryUtilityButton>
          </div>
        </FieldRow>

        <FieldRow label="Remove overlay" layout="stacked">
          <SecondaryUtilityButton
            onClick={() => clearClonedCardImage()}
            disabled={!clonedCardImage}
            ariaLabel="Clear full-card overlay"
            className="w-full"
          >
            Clear overlay
          </SecondaryUtilityButton>
          {cloneExportHint ? (
            <ValidationInline>{cloneExportHint}</ValidationInline>
          ) : !clonedCardImage ? (
            <ConstraintHint>{CONSTRAINT_COPY.sidebarClearClone}</ConstraintHint>
          ) : null}
        </FieldRow>
      </div>
    </>
  )
}
