import { UI_TEXT_LABEL_MD } from '../../authority/typographyAuthority'

/** Canonical toggle for the project. All feature toggles must use this component. */
export default function SwitchRow({
  label,
  checked,
  onToggle,
  ariaLabel,
  disabled = false,
}: {
  label: string
  checked: boolean
  onToggle: () => void
  ariaLabel: string
  disabled?: boolean
}) {
  return (
    <div
      className={['flex items-center justify-between gap-ui3', disabled ? 'pointer-events-none opacity-50' : ''].join(
        ' ',
      )}
    >
      <span className={UI_TEXT_LABEL_MD}>{label}</span>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={[
          'sidebar-switch ui-focus-ring relative inline-flex h-6 w-11 items-center rounded-full border transition-[border-color,background-color,box-shadow] duration-ui-standard ease-ui-out',
          checked
            ? 'border-[var(--ui-color-primary)] bg-[color-mix(in_srgb,var(--ui-color-primary)_26%,transparent)]'
            : 'border-[var(--ui-color-border)] bg-[var(--ui-color-surface-muted)]',
        ].join(' ')}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
      >
        <span
          className={['sidebar-switch-thumb absolute top-0.5 h-5 w-5 rounded-full transition-all', checked ? 'left-5' : 'left-0.5'].join(
            ' ',
          )}
        />
      </button>
    </div>
  )
}
