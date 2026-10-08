import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createPrintPagePlacements,
  printBuiltinBacks,
  type PrintBuiltinBackId,
} from '../authority/printFeatureAuthority'
import type { PrintPageLayoutResult, PrintUploadedFrontCard } from '../types/printFeature'

function createCardId(file: File, index: number, offset: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${offset + index}`
}

function isRenderableImageFile(file: File) {
  return file.type.startsWith('image/')
}

export function usePrintFeatureState() {
  const [frontCards, setFrontCards] = useState<PrintUploadedFrontCard[]>([])
  const [builtinBackId, setBuiltinBackId] = useState<PrintBuiltinBackId>('default')
  const [customBackObjectUrl, setCustomBackObjectUrl] = useState<string | null>(null)
  const [customBackFileName, setCustomBackFileName] = useState<string | null>(null)
  const [backAssetLoaded, setBackAssetLoaded] = useState(false)
  const [backSourceSize, setBackSourceSize] = useState({ width: 0, height: 0 })
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)

  const builtinBack = printBuiltinBacks.find((back) => back.id === builtinBackId) ?? printBuiltinBacks[0]
  const usingCustomBack = customBackObjectUrl !== null
  const backAssetUrl = customBackObjectUrl ?? builtinBack.path
  const backFillsBleedBox = usingCustomBack ? false : builtinBack.fillBleedBox
  const activeBackLabel = usingCustomBack ? 'Your upload' : builtinBack.label

  useEffect(() => {
    return () => {
      if (customBackObjectUrl) {
        URL.revokeObjectURL(customBackObjectUrl)
      }
    }
  }, [customBackObjectUrl])

  const setCustomBackFromFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }
    const file = files[0]
    if (!isRenderableImageFile(file)) {
      return
    }
    setCustomBackObjectUrl(URL.createObjectURL(file))
    setCustomBackFileName(file.name)
  }, [])

  const clearCustomBack = useCallback(() => {
    setCustomBackObjectUrl(null)
    setCustomBackFileName(null)
  }, [])

  const selectBuiltinBack = useCallback((id: PrintBuiltinBackId) => {
    setBuiltinBackId(id)
    setCustomBackObjectUrl(null)
    setCustomBackFileName(null)
  }, [])

  const layout: PrintPageLayoutResult = useMemo(() => createPrintPagePlacements(frontCards), [frontCards])

  useEffect(() => {
    setActiveSheetIndex((prev) => Math.min(prev, Math.max(0, layout.totalSheets - 1)))
  }, [layout.totalSheets])

  const addFrontFiles = (files: FileList | null) => {
    if (!files) {
      return
    }

    const pngFiles = Array.from(files).filter((file) => file.type === 'image/png')
    if (pngFiles.length === 0) {
      return
    }

    const nextBatch: PrintUploadedFrontCard[] = pngFiles.map((file, index) => {
      const id = createCardId(file, index, frontCards.length)
      const url = URL.createObjectURL(file)
      const image = new Image()
      image.onload = () => {
        const widthPx = image.naturalWidth
        const heightPx = image.naturalHeight
        setFrontCards((current) =>
          current.map((card) => (card.id === id ? { ...card, widthPx, heightPx } : card)),
        )
      }
      image.src = url
      return { id, name: file.name, url, widthPx: 0, heightPx: 0 }
    })

    setFrontCards((prev) => [...prev, ...nextBatch])
  }

  const removeFrontCard = (cardId: string) => {
    setFrontCards((prev) => {
      const target = prev.find((card) => card.id === cardId)
      if (target) {
        URL.revokeObjectURL(target.url)
      }
      return prev.filter((card) => card.id !== cardId)
    })
  }

  const clearFronts = () => {
    setFrontCards((prev) => {
      prev.forEach((card) => URL.revokeObjectURL(card.url))
      return []
    })
  }

  return {
    frontCards,
    backAssetUrl,
    backFillsBleedBox,
    builtinBackId,
    activeBackLabel,
    usingCustomBack,
    customBackFileName,
    backAssetLoaded,
    setBackAssetLoaded,
    backSourceSize,
    setBackSourceSize,
    layout,
    activeSheetIndex,
    setActiveSheetIndex,
    addFrontFiles,
    removeFrontCard,
    clearFronts,
    setCustomBackFromFiles,
    clearCustomBack,
    selectBuiltinBack,
  }
}
