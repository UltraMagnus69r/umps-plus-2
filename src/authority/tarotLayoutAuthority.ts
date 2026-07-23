/**
 * Special / Tarot — native stage geometry (1650 × 2250). Coordinates are authoritative stage px.
 */
export const TAROT_STAGE = { x: 0, y: 0, width: 1650, height: 2250 } as const

export const TAROT_GEOMETRY = {
  stage: TAROT_STAGE,
  bleedGuide: { x: 75, y: 75, width: 1500, height: 2100 },
  trim: { x: 75, y: 75, width: 1500, height: 2100 },

  outerFrame: { x: 38, y: 35, width: 1574, height: 2180 },

  namePlate: { x: 290, y: 170, width: 1070, height: 120 },
  nameText: { x: 395, y: 198, width: 860, height: 64 },

  mana: {
    y: 390,
    /** Rightmost free → leftward free centers (blueprint). */
    freeCentersX: [1485, 1385, 1285, 1185] as const,
    integratedCenterX: 1585,
    freeRadius: 42,
    integratedRadius: 62,
    /** Center-to-center spacing for extended pip row. */
    stepX: 100,
  },

  artBox: { x: 245, y: 300, width: 1160, height: 940 },
  artClip: {
    left: 245,
    right: 1405,
    bottom: 1240,
    springY: 650,
    cx: 825,
    cy: 650,
    rx: 580,
    ry: 350,
    apexY: 300,
  },

  typeLine: { x: 230, y: 1245, width: 1190, height: 90 },
  typeText: { x: 300, y: 1262, width: 1000, height: 55 },

  expansionMedallion: { x: 1360, y: 1215, width: 120, height: 120 },
  expansionCenter: { x: 1420, y: 1275 },

  textBoxPanel: { x: 235, y: 1335, width: 1180, height: 710 },
  rulesText: { x: 300, y: 1395, width: 1050, height: 360 },
  flavorDivider: { x1: 310, y1: 1780, x2: 1340, y2: 1780 },
  flavorText: { x: 300, y: 1810, width: 850, height: 150 },

  hologram: { x: 1125, y: 1840, width: 170, height: 170 },
  hologramCenter: { x: 1210, y: 1925 },

  ptArea: { x: 585, y: 1980, width: 480, height: 135 },
  ptText: { x: 690, y: 2005, width: 260, height: 75 },

  collectorPrimary: { x: 345, y: 2120, width: 960, height: 45 },
  collectorSecondary: { x: 345, y: 2160, width: 960, height: 30 },
} as const

export const TAROT_PALETTE = {
  cardGround: '#020303',
  plateFill: '#050708',
  deepShadow: '#111617',
  midMetal: '#8f979a',
  lightMetal: '#d9dddc',
  ivoryHighlight: '#f0eee5',
} as const

/** Max mana-cost pips (user: 15). Extends left from the integrated right socket. */
export const TAROT_MANA_SLOT_COUNT = 15

export type TarotStageRect = { x: number; y: number; width: number; height: number }

export type TarotManaSlot = {
  index: number
  cx: number
  cy: number
  r: number
  integrated: boolean
}

export type TarotStageRects = {
  nameBar: TarotStageRect
  art: TarotStageRect
  typeLine: TarotStageRect
  rulesText: TarotStageRect
  flavorText: TarotStageRect
  metadataStrip: TarotStageRect
  lowerRight: TarotStageRect
  expansionSymbol: TarotStageRect
  hologram: TarotStageRect
  outerFrame: TarotStageRect
  namePlate: TarotStageRect
  typePlate: TarotStageRect
  textBoxPanel: TarotStageRect
  ptArea: TarotStageRect
}

/**
 * 15 sockets, left→right by X. Rightmost is the integrated frame socket at x=1585.
 * Occupied pips use the rightmost N sockets so cost reads left→right toward the frame.
 */
export function getTarotManaSlots(): readonly TarotManaSlot[] {
  const { y, integratedCenterX, freeRadius, integratedRadius, stepX } = TAROT_GEOMETRY.mana
  const slots: TarotManaSlot[] = []
  for (let i = 0; i < TAROT_MANA_SLOT_COUNT; i++) {
    const fromRight = TAROT_MANA_SLOT_COUNT - 1 - i
    const cx = integratedCenterX - fromRight * stepX
    const integrated = cx === integratedCenterX
    slots.push({
      index: i,
      cx,
      cy: y,
      r: integrated ? integratedRadius : freeRadius,
      integrated,
    })
  }
  return slots
}

export function buildTarotStageRects(): TarotStageRects {
  const g = TAROT_GEOMETRY
  return {
    nameBar: { ...g.nameText },
    art: { ...g.artBox },
    typeLine: { ...g.typeText },
    rulesText: { ...g.rulesText },
    flavorText: { ...g.flavorText },
    metadataStrip: { ...g.collectorPrimary },
    lowerRight: { ...g.ptText },
    expansionSymbol: { ...g.expansionMedallion },
    hologram: { ...g.hologram },
    outerFrame: { ...g.outerFrame },
    namePlate: { ...g.namePlate },
    typePlate: { ...g.typeLine },
    textBoxPanel: { ...g.textBoxPanel },
    ptArea: { ...g.ptArea },
  }
}

export function getTarotPtBoxGeometryStage(): {
  outer: TarotStageRect
  text: TarotStageRect
  cornerRadius: number
} {
  return {
    outer: { ...TAROT_GEOMETRY.ptArea },
    text: { ...TAROT_GEOMETRY.ptText },
    cornerRadius: 18,
  }
}

export function getTarotBorderGeometry(): {
  inner: TarotStageRect & { cornerRadius: number }
} {
  return {
    inner: {
      ...TAROT_GEOMETRY.trim,
      cornerRadius: 48,
    },
  }
}
