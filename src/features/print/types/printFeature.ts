export type PrintSheetSide = 'front' | 'back'

/** Per-slot back choice. Custom uses `backImageUrl` on the same slot. */
export type PrintSlotBackMode = 'default' | 'magic' | 'custom'

export interface PrintUploadedFrontCard {
  id: string
  name: string
  url: string
  /** Natural pixel size. 0 until the file has loaded. */
  widthPx: number
  heightPx: number
  /**
   * Back for this slot on the duplex backs page.
   * New uploads default to `'default'` (Proxy Printer default card back).
   */
  backMode: PrintSlotBackMode
  /** Object URL when `backMode === 'custom'`. */
  backImageUrl?: string
  backImageName?: string
  /** Natural size of the custom back image. 0 until loaded. */
  backWidthPx?: number
  backHeightPx?: number
}

export interface PrintPlacement {
  id: string
  cardId: string
  index: number
  xPx: number
  yPx: number
  widthPx: number
  heightPx: number
  rotationDeg?: number
}

export interface PrintLayoutTemplate {
  id: 'letter-8-up'
  label: string
  orientation: 'portrait' | 'hybrid'
  columns: number
  rows: number
  layoutDescription: string
  gridLabel: string
  capacity: number
  frontSlots: Array<{ xPx: number; yPx: number; widthPx: number; heightPx: number; rotationDeg: number }>
  backSlots: Array<{ xPx: number; yPx: number; widthPx: number; heightPx: number; rotationDeg: number }>
}

export interface PrintTemplateEvaluation {
  templateId: PrintLayoutTemplate['id']
  label: string
  columns: number
  rows: number
  capacity: number
  valid: boolean
}

export interface PrintSheetLayout {
  sheetIndex: number
  frontPlacements: PrintPlacement[]
  backPlacements: PrintPlacement[]
}

export interface PrintPageLayoutResult {
  capacity: number
  columns: number
  rows: number
  template: PrintLayoutTemplate
  templateEvaluations: PrintTemplateEvaluation[]
  totalSheets: number
  uploadedCount: number
  placedCount: number
  overflowCount: number
  spilloverCount: number
  sheets: PrintSheetLayout[]
}

export interface PrintCutMark {
  xPx: number
  yPx: number
  widthPx: number
  heightPx: number
}

/** Resolved back asset for one slot (preview + export). */
export interface PrintResolvedSlotBack {
  url: string
  fillBleedBox: boolean
  label: 'Default' | 'Magic' | 'Custom'
  widthPx: number
  heightPx: number
}
