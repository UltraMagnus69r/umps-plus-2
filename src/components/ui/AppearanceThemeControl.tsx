import { useId } from 'react'
import { useAppearanceTheme } from '../../hooks/useAppearanceTheme'
import type { AppearanceTheme } from '../../theme/appearanceTheme'
import { UI_TEXT_LABEL_MD } from '../../authority/typographyAuthority'

const OPTIONS: { id: AppearanceTheme; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
]

/** Settings pill control — Dark | Light (default), persisted via useAppearanceTheme. */
export default function AppearanceThemeControl() {
  const [theme, setTheme] = useAppearanceTheme()
  const labelId = useId()

  return (
    <div className="space-y-1.5">
      <div className={UI_TEXT_LABEL_MD} id={labelId}>
        Appearance
      </div>
      <div
        className="studio-segmented w-full"
        role="radiogroup"
        aria-labelledby={labelId}
      >
        {OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={theme === id}
            className="studio-segmented__btn flex-1"
            onClick={() => setTheme(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
