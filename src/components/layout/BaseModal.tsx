import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  UI_MODAL_BACKDROP,
  UI_MODAL_BACKDROP_CENTERED,
  UI_MODAL_BACKDROP_CLEAR,
  UI_MODAL_BACKDROP_OPEN,
  type ModalZIndexVarName,
} from '../../authority/modalAuthority'

export type BaseModalProps = {
  open: boolean
  onClose: () => void
  /** Root stacking token, e.g. `--ui-z-mana-popup`. */
  zIndexVar: ModalZIndexVarName
  /** Quick view: true. Floating pickers: usually false. */
  lockBodyScroll?: boolean
  /**
   * `centered` — flexbox-centered shell (one primary panel).
   * `anchored` — full-viewport backdrop only; child panel uses fixed coordinates.
   */
  backdropLayout: 'centered' | 'anchored'
  /** `clear` = no blur/dim so underlying UI stays visible (pickers). */
  backdropVisual?: 'standard' | 'clear'
  children: ReactNode
  /** Extra classes on backdrop (e.g. utilities). */
  backdropClassName?: string
}

/**
 * Phase 12.3 — shared portal modal: Escape, backdrop click, optional body scroll lock.
 * Children must call `stopPropagation` on the panel root to avoid backdrop close.
 */
export default function BaseModal({
  open,
  onClose,
  zIndexVar,
  lockBodyScroll = false,
  backdropLayout,
  backdropVisual = 'standard',
  children,
  backdropClassName = '',
}: BaseModalProps) {
  const backdropEl = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)
  const [backdropVisible, setBackdropVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setBackdropVisible(true))
      })
      return () => cancelAnimationFrame(id)
    }
    setBackdropVisible(false)
  }, [open])

  const onBackdropTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.target !== backdropEl.current) return
      if (e.propertyName !== 'opacity') return
      if (!open) setMounted(false)
    },
    [open],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!mounted || !lockBodyScroll) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted, lockBodyScroll])

  if (!mounted || typeof document === 'undefined') return null

  const backdropClass = [
    UI_MODAL_BACKDROP,
    backdropVisual === 'clear' ? UI_MODAL_BACKDROP_CLEAR : '',
    backdropLayout === 'centered' ? UI_MODAL_BACKDROP_CENTERED : '',
    backdropVisible ? UI_MODAL_BACKDROP_OPEN : '',
    backdropClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return createPortal(
    <div
      ref={backdropEl}
      className={backdropClass}
      style={{ zIndex: `var(${zIndexVar})` }}
      onClick={onClose}
      onTransitionEnd={onBackdropTransitionEnd}
      role="presentation"
    >
      {children}
    </div>,
    document.body,
  )
}
