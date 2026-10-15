import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  createPrintPagePlacements,
  printBuiltinBacks,
  type PrintBuiltinBackId,
} from '../authority/printFeatureAuthority'
import type { PrintPageLayoutResult, PrintSlotBackMode, PrintUploadedFrontCard } from '../types/printFeature'

type FrontCardsSetter = Dispatch<SetStateAction<PrintUploadedFrontCard[]>>

function createCardId(file: File, index: number, offset: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${offset + index}`
}

function isRenderableImageFile(file: File) {
  return file.type.startsWith('image/')
}

function revokeSlotBack(card: PrintUploadedFrontCard) {
  if (card.backImageUrl) {
    URL.revokeObjectURL(card.backImageUrl)
  }
}

function loadFrontDimensions(id: string, url: string, setFrontCards: FrontCardsSetter) {
  const image = new Image()
  image.onload = () => {
    const widthPx = image.naturalWidth
    const heightPx = image.naturalHeight
    setFrontCards((current) =>
      current.map((card) => (card.id === id ? { ...card, widthPx, heightPx } : card)),
    )
  }
  image.src = url
}

function loadBackDimensions(id: string, url: string, setFrontCards: FrontCardsSetter) {
  const image = new Image()
  image.onload = () => {
    const backWidthPx = image.naturalWidth
    const backHeightPx = image.naturalHeight
    setFrontCards((current) =>
      current.map((card) => (card.id === id ? { ...card, backWidthPx, backHeightPx } : card)),
    )
  }
  image.src = url
}

export type AddFrontOptions = {
  /** Optional custom back for this slot (sets backMode to custom). */
  backBlob?: Blob
  backName?: string
  backMode?: PrintSlotBackMode
}

export function usePrintFeatureState() {
  const [frontCards, setFrontCards] = useState<PrintUploadedFrontCard[]>([])
  /** Fallback builtin for slots on `backMode: 'default'`. */
  const [sheetFallbackBackId, setSheetFallbackBackId] = useState<PrintBuiltinBackId>('default')
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)

  const sheetFallbackBack =
    printBuiltinBacks.find((back) => back.id === sheetFallbackBackId) ?? printBuiltinBacks[0]

  const layout: PrintPageLayoutResult = useMemo(() => createPrintPagePlacements(frontCards), [frontCards])

  useEffect(() => {
    setActiveSheetIndex((prev) => Math.min(prev, Math.max(0, layout.totalSheets - 1)))
  }, [layout.totalSheets])

  const addFrontFiles = useCallback((files: FileList | null) => {
    if (!files) return

    const pngFiles = Array.from(files).filter((file) => file.type === 'image/png')
    if (pngFiles.length === 0) return

    setFrontCards((prev) => {
      const nextBatch: PrintUploadedFrontCard[] = pngFiles.map((file, index) => {
        const id = createCardId(file, index, prev.length)
        const url = URL.createObjectURL(file)
        loadFrontDimensions(id, url, setFrontCards)
        return {
          id,
          name: file.name,
          url,
          widthPx: 0,
          heightPx: 0,
          backMode: 'default',
        }
      })
      return [...prev, ...nextBatch]
    })
  }, [])

  const addFrontBlob = useCallback((blob: Blob, name: string, options?: AddFrontOptions) => {
    const fileName = name.endsWith('.png') ? name : `${name}.png`
    const id = `studio-${fileName}-${blob.size}-${Date.now()}`
    const url = URL.createObjectURL(blob)
    loadFrontDimensions(id, url, setFrontCards)

    let backMode: PrintSlotBackMode = options?.backMode ?? 'default'
    let backImageUrl: string | undefined
    let backImageName: string | undefined
    if (options?.backBlob) {
      backMode = 'custom'
      backImageUrl = URL.createObjectURL(options.backBlob)
      backImageName = options.backName ?? 'card-back.png'
      loadBackDimensions(id, backImageUrl, setFrontCards)
    }

    setFrontCards((prev) => [
      ...prev,
      {
        id,
        name: fileName,
        url,
        widthPx: 0,
        heightPx: 0,
        backMode,
        backImageUrl,
        backImageName,
        backWidthPx: 0,
        backHeightPx: 0,
      },
    ])
  }, [])

  /** Pair one front + one back as a single double-sided slot. */
  const addFrontAndBackFiles = useCallback((frontFile: File | null, backFile: File | null) => {
    if (!frontFile || frontFile.type !== 'image/png') return
    if (!backFile || !isRenderableImageFile(backFile)) return

    const id = createCardId(frontFile, 0, Date.now())
    const url = URL.createObjectURL(frontFile)
    const backImageUrl = URL.createObjectURL(backFile)
    loadFrontDimensions(id, url, setFrontCards)
    loadBackDimensions(id, backImageUrl, setFrontCards)

    setFrontCards((prev) => [
      ...prev,
      {
        id,
        name: frontFile.name,
        url,
        widthPx: 0,
        heightPx: 0,
        backMode: 'custom',
        backImageUrl,
        backImageName: backFile.name,
        backWidthPx: 0,
        backHeightPx: 0,
      },
    ])
  }, [])

  const setSlotBackMode = useCallback((cardId: string, backMode: PrintSlotBackMode) => {
    setFrontCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card
        if (backMode !== 'custom') {
          revokeSlotBack(card)
          return {
            ...card,
            backMode,
            backImageUrl: undefined,
            backImageName: undefined,
            backWidthPx: undefined,
            backHeightPx: undefined,
          }
        }
        return { ...card, backMode }
      }),
    )
  }, [])

  const setSlotCustomBackFromFiles = useCallback((cardId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!isRenderableImageFile(file)) return
    const backImageUrl = URL.createObjectURL(file)
    loadBackDimensions(cardId, backImageUrl, setFrontCards)
    setFrontCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card
        revokeSlotBack(card)
        return {
          ...card,
          backMode: 'custom',
          backImageUrl,
          backImageName: file.name,
          backWidthPx: 0,
          backHeightPx: 0,
        }
      }),
    )
  }, [])

  const removeFrontCard = useCallback((cardId: string) => {
    setFrontCards((prev) => {
      const target = prev.find((card) => card.id === cardId)
      if (target) {
        URL.revokeObjectURL(target.url)
        revokeSlotBack(target)
      }
      return prev.filter((card) => card.id !== cardId)
    })
  }, [])

  const clearFronts = useCallback(() => {
    setFrontCards((prev) => {
      prev.forEach((card) => {
        URL.revokeObjectURL(card.url)
        revokeSlotBack(card)
      })
      return []
    })
  }, [])

  const selectSheetFallbackBack = useCallback((id: PrintBuiltinBackId) => {
    setSheetFallbackBackId(id)
  }, [])

  return {
    frontCards,
    sheetFallbackBackId,
    sheetFallbackBack,
    layout,
    activeSheetIndex,
    setActiveSheetIndex,
    addFrontFiles,
    addFrontBlob,
    addFrontAndBackFiles,
    setSlotBackMode,
    setSlotCustomBackFromFiles,
    removeFrontCard,
    clearFronts,
    selectSheetFallbackBack,
  }
}
