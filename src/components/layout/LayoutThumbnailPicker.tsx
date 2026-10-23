import { isPkmnBasicLandFrameVariantId } from '../../data/pkmnFrameOptions'
import { getAllowedVariantsForFamily, getLayoutFamilyLabel, getLayoutVariantLabel, LAYOUT_FAMILY_LABELS, type LayoutFamily, type LayoutId, type LayoutVariant } from '../../authority/layoutTaxonomy'

const FAMILIES = Object.keys(LAYOUT_FAMILY_LABELS) as LayoutFamily[]

/** Tiny schematic card silhouette per family — enough to tell layouts apart at a glance. */
function FamilyGlyph({ family }: { family: LayoutFamily }) {
  const common = 'fill-current opacity-80'
  switch (family) {
    case 'land':
      return (
        <svg viewBox="0 0 40 56" className="h-10 w-7" aria-hidden>
          <rect x="2" y="2" width="36" height="52" rx="3" className={`${common} opacity-25`} />
          <rect x="6" y="8" width="28" height="36" rx="1" className={common} />
        </svg>
      )
    case 'spell':
      return (
        <svg viewBox="0 0 40 56" className="h-10 w-7" aria-hidden>
          <rect x="2" y="2" width="36" height="52" rx="3" className={`${common} opacity-25`} />
          <rect x="6" y="6" width="28" height="14" rx="1" className={common} />
          <rect x="6" y="24" width="28" height="24" rx="1" className={`${common} opacity-50`} />
        </svg>
      )
    case 'battle':
      return (
        <svg viewBox="0 0 56 40" className="h-7 w-10" aria-hidden>
          <rect x="2" y="2" width="52" height="36" rx="3" className={`${common} opacity-25`} />
          <rect x="6" y="5" width="44" height="6" rx="1" className={common} />
          <rect x="6" y="13" width="44" height="12" rx="1" className={`${common} opacity-70`} />
          <rect x="6" y="27" width="44" height="8" rx="1" className={`${common} opacity-45`} />
        </svg>
      )
    case 'prepared':
      return (
        <svg viewBox="0 0 40 56" className="h-10 w-7" aria-hidden>
          <rect x="2" y="2" width="36" height="52" rx="3" className={`${common} opacity-25`} />
          <rect x="6" y="6" width="28" height="16" rx="1" className={common} />
          <rect x="6" y="26" width="13" height="18" rx="1" className={`${common} opacity-45`} />
          <rect x="21" y="26" width="13" height="6" rx="1" className={`${common} opacity-70`} />
          <rect x="21" y="34" width="13" height="10" rx="1" className={`${common} opacity-50`} />
        </svg>
      )
    case 'planeswalker':
      return (
        <svg viewBox="0 0 40 56" className="h-10 w-7" aria-hidden>
          <rect x="2" y="2" width="36" height="52" rx="3" className={`${common} opacity-25`} />
          <rect x="6" y="6" width="28" height="28" rx="1" className={common} />
          <rect x="8" y="38" width="10" height="10" rx="1" className={`${common} opacity-60`} />
          <rect x="22" y="38" width="10" height="10" rx="1" className={`${common} opacity-60`} />
        </svg>
      )
    case 'pkmn':
      return (
        <svg viewBox="0 0 40 56" className="h-10 w-7" aria-hidden>
          <rect x="2" y="2" width="36" height="52" rx="4" className={`${common} opacity-30`} />
          <rect x="7" y="8" width="26" height="18" rx="2" className={common} />
          <circle cx="20" cy="38" r="8" className={`${common} opacity-70`} />
        </svg>
      )
    case 'space-gothic':
      return (
        <svg viewBox="0 0 40 56" className="h-10 w-7" aria-hidden>
          <rect x="2" y="2" width="36" height="52" rx="3" className={`${common} opacity-25`} />
          <rect x="6" y="5" width="28" height="8" rx="3" className={common} />
          <rect x="10" y="16" width="20" height="20" rx="1" className={`${common} opacity-40`} />
          <rect x="6" y="38" width="28" height="12" rx="2" className={`${common} opacity-70`} />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 40 56" className="h-10 w-7" aria-hidden>
          <rect x="2" y="2" width="36" height="52" rx="3" className={`${common} opacity-25`} />
          <rect x="6" y="6" width="28" height="16" rx="1" className={common} />
          <rect x="6" y="26" width="28" height="18" rx="1" className={`${common} opacity-45`} />
          <rect x="22" y="46" width="12" height="6" rx="1" className={`${common} opacity-70`} />
        </svg>
      )
  }
}

type Props = {
  layout: LayoutId
  onSelectFamily: (family: LayoutFamily) => void
  onSelectVariant: (variant: LayoutVariant) => void
}

function VariantChip({
  variant,
  selected,
  onSelect,
}: {
  variant: LayoutVariant
  selected: boolean
  onSelect: (variant: LayoutVariant) => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(variant)}
      className={[
        'ui-focus-ring rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
        selected
          ? 'border-[var(--ui-color-primary)] bg-[color-mix(in_srgb,var(--ui-color-primary)_12%,transparent)] text-[var(--ui-color-text-strong)]'
          : 'border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] text-[var(--ui-color-muted)] hover:border-[color-mix(in_srgb,var(--ui-color-primary)_35%,var(--ui-color-border))]',
      ].join(' ')}
    >
      {getLayoutVariantLabel(variant)}
    </button>
  )
}

export default function LayoutThumbnailPicker({ layout, onSelectFamily, onSelectVariant }: Props) {
  const variants = getAllowedVariantsForFamily(layout.family)
  const pkmnLandVariants =
    layout.family === 'pkmn' ? variants.filter((v) => isPkmnBasicLandFrameVariantId(v)) : []
  const primaryVariants =
    layout.family === 'pkmn' ? variants.filter((v) => !isPkmnBasicLandFrameVariantId(v)) : variants

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 text-[length:var(--ui-font-size-xs)] font-semibold text-[var(--ui-color-muted)]">
          Family
        </div>
        <div className="grid grid-cols-2 gap-1.5" role="listbox" aria-label="Layout family">
          {FAMILIES.map((family) => {
            const selected = layout.family === family
            return (
              <button
                key={family}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelectFamily(family)}
                className={[
                  'ui-focus-ring flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center transition-colors',
                  selected
                    ? 'border-[var(--ui-color-primary)] bg-[color-mix(in_srgb,var(--ui-color-primary)_12%,transparent)] text-[var(--ui-color-text-strong)]'
                    : 'border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] text-[var(--ui-color-muted)] hover:border-[color-mix(in_srgb,var(--ui-color-primary)_35%,var(--ui-color-border))]',
                ].join(' ')}
              >
                <FamilyGlyph family={family} />
                <span className="text-[11px] font-semibold leading-tight">{getLayoutFamilyLabel(family)}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-[length:var(--ui-font-size-xs)] font-semibold text-[var(--ui-color-muted)]">
          Variant
        </div>
        <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Layout variant">
          {primaryVariants.map((variant) => (
            <VariantChip
              key={variant}
              variant={variant}
              selected={layout.variant === variant}
              onSelect={onSelectVariant}
            />
          ))}
        </div>
        {pkmnLandVariants.length > 0 ? (
          <div className="mt-2.5">
            <div className="mb-1.5 text-[length:var(--ui-font-size-xs)] font-semibold text-[var(--ui-color-muted)]">
              PKMN Lands
            </div>
            <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="PKMN land variants">
              {pkmnLandVariants.map((variant) => (
                <VariantChip
                  key={variant}
                  variant={variant}
                  selected={layout.variant === variant}
                  onSelect={onSelectVariant}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
