import { isPanelTextureBackground } from '../../authority/panelBackgroundAuthority'
import { panelBoxColorPickerValue } from '../../authority/boxColorUiAuthority'
import { outerBorderPngUrl } from '../../data/outerBorderOptions'

type PanelFillSwatchProps = {
  value: string
  ariaLabel: string
  onHexChange: (hex: string) => void
}

/** Swatch for panel fill: texture thumbnail when `m15tex:` / `m15solid:`, else `<input type="color">`. */
export default function PanelFillSwatch({ value, ariaLabel, onHexChange }: PanelFillSwatchProps) {
  const textureUrl = isPanelTextureBackground(value) ? outerBorderPngUrl(value) : null

  if (textureUrl) {
    return (
      <div
        className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
        aria-label={ariaLabel}
        title={value}
      >
        <img src={textureUrl} alt="" className="h-full w-full object-cover" draggable={false} />
      </div>
    )
  }

  return (
    <input
      type="color"
      value={panelBoxColorPickerValue(value)}
      onChange={(e) => onHexChange(e.target.value)}
      className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border border-neutral-200 bg-white p-0 dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
      aria-label={ariaLabel}
    />
  )
}
