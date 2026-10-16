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
const SCRYFALL_USER_AGENT = 'PipMint/1.0 (custom card creator; https://github.com/)'

function scryfallFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (!headers.has('User-Agent')) headers.set('User-Agent', SCRYFALL_USER_AGENT)
  return fetch(url, { ...init, headers })
}

/** Minimal card JSON shape from Scryfall (normal cards + optional faces). */
type ScryfallImageUris = ScryfallImageUriSet & { small?: string }
type ScryfallCardFace = {
  name?: string | null
  mana_cost?: string | null
  type_line?: string | null
  oracle_text?: string | null
  flavor_text?: string | null
  power?: string | null
  toughness?: string | null
  loyalty?: string | null
  /** Battle / Siege defense (face-level). */
  defense?: string | null
  artist?: string | null
  watermark?: string | null
  image_uris?: ScryfallImageUris
}

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
  defense?: string | null
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
  /** Scryfall layout id: normal, saga, class, battle, transform, … */
  layout?: string | null
  frame?: string | null
  border_color?: string | null
  full_art?: boolean
  frame_effects?: string[] | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function faceTypeLine(face: ScryfallCardFace | null | undefined): string {
  return String(face?.type_line ?? '')
}

/**
 * Prefer the face that matches the inferred PipMint layout (Saga Creature back,
 * Saga/Class face, etc.). Falls back to the first face with oracle text.
 */
function pickImportFace(
  card: ScryfallRawCard,
  inferred: LayoutId,
): ScryfallCardFace | null {
  const faces = Array.isArray(card.card_faces) ? card.card_faces : []
  if (faces.length === 0) return null
  const score = (face: ScryfallCardFace): number => {
    const tl = faceTypeLine(face)
    let s = 0
    if (inferred.variant === 'saga-creature') {
      if (/\bCreature\b/i.test(tl) && /\bSaga\b/i.test(tl)) s += 100
      else if (/\bSaga\b/i.test(tl)) s += 40
    } else if (inferred.variant === 'saga') {
      if (/\bSaga\b/i.test(tl) && !/\bCreature\b/i.test(tl)) s += 100
      else if (/\bSaga\b/i.test(tl)) s += 50
    } else if (inferred.variant === 'class') {
      if (/\bClass\b/i.test(tl)) s += 100
    } else if (inferred.family === 'battle') {
      if (/\bBattle\b/i.test(tl)) s += 100
    }
    if (typeof face.oracle_text === 'string' && face.oracle_text.trim()) s += 5
    if (face.image_uris) s += 1
    return s
  }
  let best = faces[0]
  let bestScore = score(best)
  for (let i = 1; i < faces.length; i++) {
    const sc = score(faces[i])
    if (sc > bestScore) {
      best = faces[i]
      bestScore = sc
    }
  }
  return best
}

function readPrimaryImageUris(
  card: ScryfallRawCard,
  preferredFace?: ScryfallCardFace | null,
): ScryfallImageUriSet | null {
  if (preferredFace?.image_uris) return preferredFace.image_uris
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
  /** Battle / Siege defense (from face when present). */
  defense: string | null
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
  const face = pickImportFace(card, inferredLayout)
  const faceName = face?.name != null ? toStr(face.name) : null
  const typeLine =
    (face?.type_line != null ? toStr(face.type_line) : null) ??
    (card.type_line != null ? toStr(card.type_line) : null)
  // Re-infer when a DFC face is more specific than the combined type line.
  const faceHints = readScryfallLayoutHints({
    ...card,
    type_line: typeLine,
    layout: card.layout,
  })
  const faceInferred = inferScryfallLayoutId(faceHints)
  const imageUris = readPrimaryImageUris(card, face)
  return {
    id: card.id != null ? toStr(card.id) : null,
    name: faceName ?? toStr(card.name),
    mana_cost:
      (face?.mana_cost != null ? toStr(face.mana_cost) : null) ??
      (card.mana_cost != null ? toStr(card.mana_cost) : null),
    type_line: typeLine,
    oracle_text:
      (face?.oracle_text != null ? toStr(face.oracle_text) : null) ??
      (card.oracle_text != null ? toStr(card.oracle_text) : null),
    flavor_text:
      (face?.flavor_text != null ? toStr(face.flavor_text) : null) ??
      (card.flavor_text != null ? toStr(card.flavor_text) : null),
    loyalty:
      (face?.loyalty != null ? toStr(face.loyalty) : null) ??
      (card.loyalty != null ? toStr(card.loyalty) : null),
    power:
      (face?.power != null ? toStr(face.power) : null) ??
      (card.power != null ? toStr(card.power) : null),
    toughness:
      (face?.toughness != null ? toStr(face.toughness) : null) ??
      (card.toughness != null ? toStr(card.toughness) : null),
    defense:
      (face?.defense != null ? toStr(face.defense) : null) ??
      (card.defense != null ? toStr(card.defense) : null),
    set: setNormalized,
    collector_number: card.collector_number != null ? toStr(card.collector_number) : null,
    rarity: card.rarity != null ? toStr(card.rarity) : null,
    artist:
      (face?.artist != null ? toStr(face.artist) : null) ??
      (card.artist != null ? toStr(card.artist) : null),
    lang: card.lang != null ? toStr(card.lang) : null,
    watermark:
      (face?.watermark != null ? toStr(face.watermark) : null) ??
      (card.watermark != null ? toStr(card.watermark) : null),
    art_crop_uri: resolveScryfallImportArtUri(imageUris, faceInferred.variant),
    png_uri: extractPngUrl(card),
    color_identity: Array.isArray(card.color_identity)
      ? (card.color_identity.filter((x): x is string => typeof x === 'string') as string[])
      : null,
    full_art: faceHints.full_art,
    border_color: faceHints.border_color,
    frame_effects: faceHints.frame_effects,
    inferred_layout: faceInferred,
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

function mapSearchItemToPrintCandidate(item: unknown): ScryfallPrintCandidate | null {
  if (!isRecord(item) || typeof item.id !== 'string') return null
  const set = toStr((item.set as string | null | undefined) ?? null)
  const collector = toStr((item.collector_number as string | null | undefined) ?? null)
  const nameValue = toStr((item.name as string | null | undefined) ?? null)
  if (!set || !collector || !nameValue) return null
  const imageUris = isRecord(item.image_uris) ? item.image_uris : null
  const smallImage = imageUris && typeof imageUris.small === 'string' ? imageUris.small : null
  return {
    id: item.id,
    name: nameValue,
    set: set.toLowerCase(),
    set_name: toStr((item.set_name as string | null | undefined) ?? null),
    collector_number: collector,
    released_at: toStr((item.released_at as string | null | undefined) ?? null),
    small_image: smallImage,
    rarity: toStr((item.rarity as string | null | undefined) ?? null),
    lang: toStr((item.lang as string | null | undefined) ?? null),
  }
}

function mapRawCardToPrintCandidate(card: ScryfallRawCard): ScryfallPrintCandidate | null {
  return mapSearchItemToPrintCandidate(card)
}

async function searchScryfallPrintList(query: string): Promise<ScryfallPrintCandidate[] | null> {
  const searchUrl = `${SCRYFALL_CARDS_SEARCH}?q=${encodeURIComponent(query)}&unique=prints&order=released&dir=desc`
  const res = await scryfallFetch(searchUrl)
  const raw = await parseJsonResponse(res)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(readScryfallError(raw, res.status))
  if (!isRecord(raw) || !Array.isArray(raw.data)) throw new Error('Unexpected Scryfall search response')
  const out: ScryfallPrintCandidate[] = []
  for (const item of raw.data) {
    const mapped = mapSearchItemToPrintCandidate(item)
    if (mapped) out.push(mapped)
  }
  return out
}

/**
 * Resolve every print of a card name for the import/clone picker.
 *
 * Strategy:
 * 1. Exact name (`!"Name"`) — normal catalog prints
 * 2. Exact name + `include:extras` — Heroes of the Realm / promo-only names (e.g. War of the Spark ph19)
 * 3. `/cards/named?fuzzy=` → retry exact (+extras) on the canonical name; else return that single print
 */
export async function searchScryfallPrintsByName(name: string): Promise<ScryfallPrintCandidate[]> {
  const q = String(name ?? '').trim()
  if (!q) throw new Error('Card name is required')

  const exact = `!"${q}"`
  const primary = await searchScryfallPrintList(exact)
  if (primary && primary.length > 0) return primary

  const withExtras = await searchScryfallPrintList(`${exact} include:extras`)
  if (withExtras && withExtras.length > 0) return withExtras

  // Fuzzy named resolves typos / near-matches; then re-run exact print search on the oracle name.
  const namedUrl = `${SCRYFALL_NAMED_FUZZY}?fuzzy=${encodeURIComponent(q)}`
  const namedRes = await scryfallFetch(namedUrl)
  const namedRaw = await parseJsonResponse(namedRes)
  if (!namedRes.ok) throw new Error(readScryfallError(namedRaw, namedRes.status))
  const card = assertValidCardResponse(namedRaw)
  const canonical = toStr(card.name)?.trim()
  if (canonical && canonical.toLowerCase() !== q.toLowerCase()) {
    const canonExact = `!"${canonical}"`
    const canonPrimary = await searchScryfallPrintList(canonExact)
    if (canonPrimary && canonPrimary.length > 0) return canonPrimary
    const canonExtras = await searchScryfallPrintList(`${canonExact} include:extras`)
    if (canonExtras && canonExtras.length > 0) return canonExtras
  }
  const single = mapRawCardToPrintCandidate(card)
  if (single) return [single]

  throw new Error(
    "Your query didn't match any cards. Adjust your search terms or refer to the syntax guide at https://scryfall.com/docs/reference",
  )
}

/** Scryfall SVG set symbol CDN (Module 5.2). */
export function getSetSymbolUrl(setCode: string): string {
  const code = String(setCode ?? '').trim().toLowerCase()
  return `https://svgs.scryfall.io/sets/${code}.svg`
}
