import type { CardData } from '../store/useCardStore'
import type { DesignSnapshot } from '../store/useCardStore'
import { PERSIST_SCHEMA_VERSION } from '../store/useCardStore'
import { resolveDesignFilename, sanitizeFilenameBase } from './filenameAuthority'
import { offerDownload } from './offerDownload'

export async function saveCardAsJson(
  data: CardData,
  filename: string,
  schemaVersion: number = PERSIST_SCHEMA_VERSION
) {
  const safeBase = sanitizeFilenameBase(filename || 'card')
  const finalName = safeBase.toLowerCase().endsWith('.json') ? safeBase : `${safeBase}.json`

  const payload = {
    schemaVersion,
    cardData: data,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  await offerDownload(blob, finalName)
}

/** Save full design state as JSON (Module 3.5). Routes through filename authority. */
export async function saveDesign(
  snapshot: DesignSnapshot,
  filename: string | undefined,
  filenameSlug: string | undefined,
  filenameFieldDirty: boolean
) {
  const finalName = resolveDesignFilename(filename, filenameSlug, filenameFieldDirty, 'design')
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8' })
  await offerDownload(blob, finalName)
}
