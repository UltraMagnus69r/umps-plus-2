export type PrintSheetSide = 'front' | 'back'

export interface PrintUploadedFrontCard {
  id: string
  name: string
  url: string
  /** Natural pixel size. 0 until the file has loaded. */
  widthPx: number
  heightPx: number
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
