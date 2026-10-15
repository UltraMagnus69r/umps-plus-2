/** In-memory handoff: Studio → Proxy Printer (survives route change within the SPA). */

export type PendingStudioPrintCard = {
  blob: Blob
  name: string
  /** Optional maker-stored back art for this card. */
  backBlob?: Blob
  backName?: string
}

let pending: PendingStudioPrintCard | null = null

export function stashStudioCardForPrint(blob: Blob, name: string, back?: { blob: Blob; name?: string }) {
  pending = {
    blob,
    name,
    backBlob: back?.blob,
    backName: back?.name,
  }
}

export function takePendingStudioCard(): PendingStudioPrintCard | null {
  const next = pending
  pending = null
  return next
}
