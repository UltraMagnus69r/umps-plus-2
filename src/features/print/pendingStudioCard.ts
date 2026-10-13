/** In-memory handoff: Studio → Proxy Printer (survives route change within the SPA). */

export type PendingStudioPrintCard = {
  blob: Blob
  name: string
}

let pending: PendingStudioPrintCard | null = null

export function stashStudioCardForPrint(blob: Blob, name: string) {
  pending = { blob, name }
}

export function takePendingStudioCard(): PendingStudioPrintCard | null {
  const next = pending
  pending = null
  return next
}
