/**
 * Lazy wrapper so outer-border option tables stay off the initial main chunk
 * until a Style section that needs the picker is opened.
 */
import { lazy, Suspense } from 'react'
import { UI_TEXT_HELP_COMPACT } from '../../authority/typographyAuthority'

const OuterBorderPicker = lazy(() => import('./OuterBorderPicker'))

type LazyOuterBorderPickerProps = {
  field?: 'outerBorderColor' | 'innerBorderBackground' | 'nameBoxColor' | 'typeLineBoxColor' | 'rulesTextBoxColor' | 'ptBoxColor'
  identityOption?: { value: string; label: string }
  buttonLabel?: string
  sectionIds?: readonly string[]
}

export default function LazyOuterBorderPicker(props: LazyOuterBorderPickerProps) {
  return (
    <Suspense fallback={<p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>Loading borders…</p>}>
      <OuterBorderPicker {...props} />
    </Suspense>
  )
}
