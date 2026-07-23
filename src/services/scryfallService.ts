/**
 * Scryfall API adapters for exact-print import + multi-print search.
 * https://scryfall.com/docs/api
 */

import {
  inferScryfallLayoutId,
  readScryfallLayoutHints,
  resolveScryfallImportArtUri,
  type ScryfallImageUriSet,
} from '../authority/scryfallLayoutAuthority'
import type { LayoutId } from '../authority/layoutTaxonomy'

const SCRYFALL_API_BASE = 'https://api.scryfall.com'
const SCRYFALL_NAMED_FUZZY = `${SCRYFALL_API_BASE}/cards/named`
const SCRYFALL_CARDS_SEARCH = `${SCRYFALL_API_BASE}/cards/search`
const SCRYFALL_CARDS_COLLECTION = `${SCRYFALL_API_BASE}/cards/collection`
const SCRYFALL_USER_AGENT = 'UMPS/1.0 (custom Magic card editor; https://github.com/)'

function scryfallFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (!headers.has('User-Agent')) headers.set('User-Agent', SCRYFALL_USER_AGENT)
  return fetch(url, { ...init, headers })
}

/** Minimal card JSON shape from Scryfall (normal cards + optional faces). */
type ScryfallImageUris = ScryfallImageUriSet & { small?: string }
type ScryfallCardFace = { image_uris?: ScryfallImageUris }

type ScryfallRawCard = {
  id?: string
  object?: string
  details?: string
  name?: string
  mana_cost?: string | null
  type_line?: string | null
  oracle_text?: string | null
  flavor_text?: string | null
  loyalty?: string | null
  power?: string | null
  toughness?: string | null
  set?: string | null
  collector_number?: string | null
  rarity?: string | null
  artist?: string | null
  /** Oracle language code (e.g. `en`). Module 4.1 — optional 12-point schema field. */
  lang?: string | null
  /** Guild / promo watermark id when present. */
  watermark?: string | null
  card_faces?: ScryfallCardFace[]
  /** Official color identity, e.g. ["W","U"]. */
  color_identity?: string[] | null
  set_name?: string | null
  released_at?: string | null
  image_uris?: ScryfallImageUris
  frame?: string | null
  border_color?: string | null
  full_art?: boolean
  frame_effects?: string[] | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function readPrimaryImageUris(card: ScryfallRawCard): ScryfallImageUriSet | null {
  if (card.image_uris) return card.image_uris
  const faces = card.card_faces
  if (Array.isArray(faces) && faces.length > 0) {
    return faces[0]?.image_uris ?? null
  }
  return null
}

/** Full-card PNG for clone workflow (fallback: first face PNG). */
function extractPngUrl(data: ScryfallRawCard): string | null {
  const direct = data.image_uris?.png
  if (typeof direct === 'string' && direct.length > 0) return direct
  const faces = data.card_faces
  if (Array.isArray(faces) && faces.length > 0) {
    const first = faces[0]?.image_uris?.png
    if (typeof first === 'string' && first.length > 0) return first
  }
  return null
}

/** Typed payload for store mapping (null = absent / unknown). */
export type ScryfallCardFields = {
  id: string | null
  name: string | null
  mana_cost: string | null
  type_line: string | null
  oracle_text: string | null
  flavor_text: string | null
  loyalty: string | null
  power: string | null
  toughness: string | null
  /** Lowercase set code for `getSetSymbolUrl`. */
  set: string | null
  collector_number: string | null
  rarity: string | null
  artist: string | null
  /** ISO language code from Scryfall (uppercased in store). */
  lang: string | null
  watermark: string | null
  /** Resolved import art URI (variant-aware; prefers art_crop). */
  art_crop_uri: string | null
  /** Full-card PNG used by Scryfall Clone flow. */
  png_uri: string | null
  /** Scryfall `color_identity` (W/U/B/R/G only in store). */
  color_identity: string[] | null
  /** Scryfall print metadata used to infer UMPS layout on import. */
  full_art: boolean
  border_color: string | null
  frame_effects: readonly string[]
  inferred_layout: LayoutId
}

export type ScryfallPrintCandidate = {
  id: string
  name: string
  set: string
  set_name: string | null
  collector_number: string
  released_at: string | null
  small_image: string | null
  rarity: string | null
  lang: string | null
}

function toStr(v: string | null | undefined): string | null {
  if (v == null) return null
  return String(v)
}

async function parseJsonResponse(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    throw new Error('Invalid JSON from Scryfall')
  }
}

function readScryfallError(raw: unknown, status: number): string {
  if (isRecord(raw) && typeof raw.details === 'string') return raw.details
  return `Scryfall request failed (${status})`
}

function assertValidCardResponse(raw: unknown): ScryfallRawCard {
  if (!isRecord(raw) || raw.object === 'error') {
    const details = isRecord(raw) && typeof raw.details === 'string' ? raw.details : 'Unexpected Scryfall response'
    throw new Error(details)
  }
  return raw as ScryfallRawCard
}

function mapRawCardToFields(card: ScryfallRawCard): ScryfallCardFields {
  const setRaw = card.set != null ? toStr(card.set) : null
  const setNormalized = setRaw != null ? setRaw.trim().toLowerCase() : null
  const layoutHints = readScryfallLayoutHints(card)
  const inferredLayout = inferScryfallLayoutId(layoutHints)
  const imageUris = readPrimaryImageUris(card)
  return {
    id: card.id != null ? toStr(card.id) : null,
    name: toStr(card.name),
    mana_cost: card.mana_cost != null ? toStr(card.mana_cost) : null,
    type_line: card.type_line != null ? toStr(card.type_line) : null,
    oracle_text: card.oracle_text != null ? toStr(card.oracle_text) : null,
    flavor_text: card.flavor_text != null ? toStr(card.flavor_text) : null,
    loyalty: card.loyalty != null ? toStr(card.loyalty) : null,
    power: card.power != null ? toStr(card.power) : null,
    toughness: card.toughness != null ? toStr(card.toughness) : null,
    set: setNormalized,
    collector_number: card.collector_number != null ? toStr(card.collector_number) : null,
    rarity: card.rarity != null ? toStr(card.rarity) : null,
    artist: card.artist != null ? toStr(card.artist) : null,
    lang: card.lang != null ? toStr(card.lang) : null,
    watermark: card.watermark != null ? toStr(card.watermark) : null,
    art_crop_uri: resolveScryfallImportArtUri(imageUris, inferredLayout.variant),
    png_uri: extractPngUrl(card),
    color_identity: Array.isArray(card.color_identity)
      ? (card.color_identity.filter((x): x is string => typeof x === 'string') as string[])
      : null,
    full_art: layoutHints.full_art,
    border_color: layoutHints.border_color,
    frame_effects: layoutHints.frame_effects,
    inferred_layout: inferredLayout,
  }
}

export function parseSetCollectorInput(input: string): { set: string; collectorNumber: string } | null {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) return null
  // Require at least one digit in collector number to avoid routing plain names
  // like "Sliver Queen" into exact set/collector lookup.
  const m = trimmed.match(/^([a-z0-9]{2,8})[\s/#:-]+([a-z0-9-]*\d[a-z0-9-]*)$/i)
  if (!m) return null
  return { set: m[1].toLowerCase(), collectorNumber: m[2] }
}

export function parseScryfallCardUrl(input: string): { set: string; collectorNumber: string } | null {
  const raw = String(input ?? '').trim()
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (!/scryfall\.com$/i.test(url.hostname)) return null
  const m = url.pathname.match(/^\/card\/([^/]+)\/([^/]+)/i)
  if (!m) return null
  return { set: String(m[1]).toLowerCase(), collectorNumber: String(m[2]) }
}

/**
 * Fuzzy lookup by card name. Throws Error with a readable message on failure.
 */
export async function fetchScryfallCard(name: string): Promise<ScryfallCardFields> {
  const q = name.trim()
  if (!q) {
    throw new Error('Card name is required')
  }

  const url = `${SCRYFALL_NAMED_FUZZY}?fuzzy=${encodeURIComponent(q)}`
  const res = await scryfallFetch(url)

  const raw = await parseJsonResponse(res)

  if (!res.ok) {
    throw new Error(readScryfallError(raw, res.status))
  }

  return mapRawCardToFields(assertValidCardResponse(raw))
}

export async function fetchScryfallCardBySetCollector(
  setCode: string,
  collectorNumber: string,
): Promise<ScryfallCardFields> {
  const set = String(setCode ?? '').trim().toLowerCase()
  const cn = String(collectorNumber ?? '').trim()
  if (!set || !cn) throw new Error('Set code and collector number are required')

  const url = `${SCRYFALL_API_BASE}/cards/${encodeURIComponent(set)}/${encodeURIComponent(cn)}`
  const res = await scryfallFetch(url)
  const raw = await parseJsonResponse(res)
  if (!res.ok) throw new Error(readScryfallError(raw, res.status))
  return mapRawCardToFields(assertValidCardResponse(raw))
}

export async function fetchScryfallCardById(cardId: string): Promise<ScryfallCardFields> {
  const id = String(cardId ?? '').trim()
  if (!id) throw new Error('Card id is required')
  const res = await scryfallFetch(SCRYFALL_CARDS_COLLECTION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifiers: [{ id }] }),
  })
  const raw = await parseJsonResponse(res)
  if (!res.ok) throw new Error(readScryfallError(raw, res.status))
  if (!isRecord(raw) || !Array.isArray(raw.data) || raw.data.length === 0) {
    throw new Error('No exact print found')
  }
  return mapRawCardToFields(assertValidCardResponse(raw.data[0]))
}

export async function searchScryfallPrintsByName(name: string): Promise<ScryfallPrintCandidate[]> {
  const q = String(name ?? '').trim()
  if (!q) throw new Error('Card name is required')

  const searchUrl = `${SCRYFALL_CARDS_SEARCH}?q=${encodeURIComponent(`!"${q}"`)}&unique=prints&order=released&dir=desc`
  const res = await scryfallFetch(searchUrl)
  const raw = await parseJsonResponse(res)
  if (!res.ok) throw new Error(readScryfallError(raw, res.status))
  if (!isRecord(raw) || !Array.isArray(raw.data)) throw new Error('Unexpected Scryfall search response')

  const out: ScryfallPrintCandidate[] = []
  for (const item of raw.data) {
    if (!isRecord(item) || typeof item.id !== 'string') continue
    const set = toStr((item.set as string | null | undefined) ?? null)
    const collector = toStr((item.collector_number as string | null | undefined) ?? null)
    const nameValue = toStr((item.name as string | null | undefined) ?? null)
    if (!set || !collector || !nameValue) continue
    const imageUris = isRecord(item.image_uris) ? item.image_uris : null
    const smallImage = imageUris && typeof imageUris.small === 'string' ? imageUris.small : null
    out.push({
      id: item.id,
      name: nameValue,
      set: set.toLowerCase(),
      set_name: toStr((item.set_name as string | null | undefined) ?? null),
      collector_number: collector,
      released_at: toStr((item.released_at as string | null | undefined) ?? null),
      small_image: smallImage,
      rarity: toStr((item.rarity as string | null | undefined) ?? null),
      lang: toStr((item.lang as string | null | undefined) ?? null),
    })
  }
  return out
}

/** Scryfall SVG set symbol CDN (Module 5.2). */
export function getSetSymbolUrl(setCode: string): string {
  const code = String(setCode ?? '').trim().toLowerCase()
  return `https://svgs.scryfall.io/sets/${code}.svg`
}
