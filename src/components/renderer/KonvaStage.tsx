import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Stage } from 'react-konva'
import type Konva from 'konva'
import {
  BLEED_PX,
  DIMENSIONS,
  STAGE_EXPORT_HEIGHT,
  STAGE_EXPORT_WIDTH,
} from '../../authority/geometryAuthority'
import {
  BATTLE_STUDIO_PRESENTATION_ROTATION_DEG,
  battleStudioPresentationActive,
  getBattleStageSize,
} from '../../authority/battleLayoutAuthority'
import { getOuterBorderFill } from '../../authority/colorAuthority'
import { UI_PREVIEW_SURFACE } from '../../authority/panelSurfaceAuthority'
import { shouldRenderNameplateCrown } from '../../authority/crownLayoutAuthority'
import { getActiveLayoutCapabilitiesFromState } from '../../authority/layoutRegistry'
import type { LayoutId } from '../../authority/layoutTaxonomy'
import { useCardStore } from '../../store/useCardStore'

import ArtLayer from './layers/ArtLayer'
import TextureBorderLayer from './layers/TextureBorderLayer'
import PkmnFrameLayer from './layers/PkmnFrameLayer'
import SpaceGothicFrameLayer from './layers/SpaceGothicFrameLayer'
import FrameLayer from './layers/FrameLayer'
import CrownLayer from './layers/CrownLayer'
import NamePlateLayer from './layers/NamePlateLayer'
import LandFullArtManaCircleLayer from './layers/LandFullArtManaCircleLayer'
import RulesTextBoxTextureLayer from './layers/RulesTextBoxTextureLayer'
import WatermarkLayer from './layers/WatermarkLayer'
import LandSecondaryArtLayer from './layers/LandSecondaryArtLayer'
import SpellTextBoxLayer from './layers/SpellTextBoxLayer'
import PreModernRulesTextBoxLayer from './layers/PreModernRulesTextBoxLayer'
import SagaClassChromeLayer from './layers/SagaClassChromeLayer'
import PreparedChromeLayer from './layers/PreparedChromeLayer'
import BattleChromeLayer from './layers/BattleChromeLayer'
import TextIconsLayer from './layers/TextIconsLayer'
import PlaneswalkerAbilitiesLayer from './layers/PlaneswalkerAbilitiesLayer'
import SetSymbolLayer from './layers/SetSymbolLayer'
import PowerToughnessOverlayLayer from './layers/PowerToughnessOverlayLayer'
import StartingLoyaltyOverlayLayer from './layers/StartingLoyaltyOverlayLayer'
import SecondaryNameLayer from './layers/SecondaryNameLayer'
import DebugOverlayLayer from './layers/DebugOverlayLayer'
import ReferenceLayer from './layers/ReferenceLayer'
import ClonedCardLayer from './layers/ClonedCardLayer'

export type KonvaStageProps = {
  /**
   * When false, this instance does not register as the app PNG exporter (e.g. Phase 12.1 modal duplicate).
   */
  registerExporter?: boolean
  /** When false, omits preview hover/lift surface class (modal / embedded clones). */
  previewSurfaceChrome?: boolean
}

type Size = { width: number; height: number }

function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const cr = entry.contentRect
      setSize({ width: cr.width, height: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return { ref, size }
}

/**
 * Stage orchestrator — canonical layer stack (Module 5.2 adds watermark + set symbol).
 * 1. Texture / Border
 * 2. Art
 * 3. Frame (art / type / rules bevels; name plate is separate)
 * 3a. Crown (Showcase flourish — above art + inner border + art frame, below name plate)
 * 3b. Name plate
 * 3c. Rules Text Box Surface FX / bundled plate / parchment (base fill), below watermark
 * 4. Watermark — rules-area mark, above rules-box background, below text
 * 5. Text & Icons
 * 6. Set symbol — Scryfall CDN SVG in type-line slot (above type-line text on the right)
 * 7. P/T overlay — box body, values, pinline above all face chrome (below clone/debug/reference)
 * 8. Cloned card printable overlay (trim-fitted; included in export)
 * 9. Debug / Overlay
 * 10. Reference overlay (editor ghost, excluded from export)
 *
 * Bleed fill uses cardData.bleedFillColor (see TextureBorderLayer). Export backplate matches.
 */
function KonvaStage({
  registerExporter = true,
  previewSurfaceChrome = true,
}: KonvaStageProps) {
  const registerStageExporter = useCardStore((s) => s.registerStageExporter)
  const exportPngIncludeBleed = useCardStore((s) => s.exportPngIncludeBleed)
  const currentLayout = useCardStore((s) => s.currentLayout)
  const clonedCardImage = useCardStore((s) => s.cardData.clonedCardImage)
  const activeLayout = useCardStore((s) => s.cardData.layout as LayoutId)
  const crownAssetId = useCardStore((s) => s.cardData.crownAssetId)
  const layoutCaps = useMemo(
    () =>
      getActiveLayoutCapabilitiesFromState({
        currentLayout,
        cardData: { layout: activeLayout },
      }),
    [currentLayout, activeLayout],
  )
  const showCrown = shouldRenderNameplateCrown({
    layout: activeLayout,
    currentLayout,
    crownAssetId,
  })
  const showRulesTexture =
    layoutCaps.supportsPlaneswalkerModernV2Layout ||
    (layoutCaps.supportsRulesTextBoxTexture && !layoutCaps.supportsPreModernTextBoxFrame)
  const showBundledRulesPanel =
    layoutCaps.supportsPreModernTextBoxFrame || layoutCaps.supportsPlaneswalkerModernV2Layout
  const hiddenCloneChrome =
    currentLayout === 'Hidden' && String(clonedCardImage ?? '').trim().length > 0
  const stageRef = useRef<Konva.Stage | null>(null)

  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>()
  const landscapeStage = layoutCaps.usesLandscapeStage === true
  /**
   * Battle Studio presentation: rotate portrait side-column +90° (CW) so the
   * left name column becomes the top bar and name/rules read left-to-right.
   * Export/print stay native portrait (no rotation).
   */
  const battlePresentation = battleStudioPresentationActive(activeLayout)
  const battleSize = getBattleStageSize()
  const w = landscapeStage ? battleSize.width : DIMENSIONS.FULL_BLEED.width
  const h = landscapeStage ? battleSize.height : DIMENSIONS.FULL_BLEED.height
  const tw = landscapeStage ? battleSize.width - 2 * BLEED_PX : DIMENSIONS.TRIM.width
  const th = landscapeStage ? battleSize.height - 2 * BLEED_PX : DIMENSIONS.TRIM.height
  const exportW = landscapeStage ? battleSize.width : STAGE_EXPORT_WIDTH
  const exportH = landscapeStage ? battleSize.height : STAGE_EXPORT_HEIGHT

  const scale = useMemo(() => {
    const cw = size.width || 1
    const ch = size.height || 1
    // When presenting Battle rotated, the on-screen box swaps axes — fit to that.
    const fitW = battlePresentation ? (exportPngIncludeBleed ? h : th) : exportPngIncludeBleed ? w : tw
    const fitH = battlePresentation ? (exportPngIncludeBleed ? w : tw) : exportPngIncludeBleed ? h : th
    return Math.min(cw / fitW, ch / fitH)
  }, [
    size.width,
    size.height,
    w,
    h,
    tw,
    th,
    exportPngIncludeBleed,
    battlePresentation,
  ])

  const scaled = useMemo(
    () => ({ width: w * scale, height: h * scale }),
    [w, h, scale],
  )

  const previewW = Math.max(1, Math.round(scaled.width))
  const previewH = Math.max(1, Math.round(scaled.height))
  /** On-screen shell size after optional Battle presentation rotation. */
  const presentW = battlePresentation ? previewH : previewW
  const presentH = battlePresentation ? previewW : previewH
  const stageScaleX = previewW / w
  const stageScaleY = previewH / h
  /** Cap retina backing store for live typing; export path uses explicit full resolution. */
  const previewPixelRatio = useMemo(
    () => Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5),
    [],
  )

  const exportStage = useCallback(async () => {
    const stage = stageRef.current
    if (!stage) return document.createElement('canvas')

    const labelsLayer = stage.findOne('.layout-labels') as Konva.Layer | undefined
    const overlayLayer = stage.findOne('.debug-overlay') as Konva.Layer | undefined
    const referenceLayer = stage.findOne('.reference-overlay') as Konva.Layer | undefined
    const prevLabelsVisible = labelsLayer ? labelsLayer.visible() : undefined
    const prevOverlayVisible = overlayLayer ? overlayLayer.visible() : undefined
    const prevReferenceVisible = referenceLayer ? referenceLayer.visible() : undefined
    const prevWidth = stage.width()
    const prevHeight = stage.height()
    const prevScaleX = stage.scaleX()
    const prevScaleY = stage.scaleY()

    try {
      if (labelsLayer) labelsLayer.visible(false)
      if (overlayLayer) overlayLayer.visible(false)
      if (referenceLayer) referenceLayer.visible(false)
      stage.width(exportW)
      stage.height(exportH)
      stage.scale({ x: 1, y: 1 })
      stage.draw()

      const stageCanvas = stage.toCanvas({ pixelRatio: 1 })
      const TARGET_W = exportW
      const TARGET_H = exportH
      const out = document.createElement('canvas')
      out.width = TARGET_W
      out.height = TARGET_H
      const ctx = out.getContext('2d')
      if (!ctx) return out

      const state = useCardStore.getState()
      const bleedFill = state.cardData.bleedFillColor ?? 'auto'
      const outerKey = state.cardData.outerBorderColor ?? 'black'
      const outer = getOuterBorderFill(outerKey)
      if (typeof bleedFill === 'string' && /^#([0-9a-f]{6})$/i.test(bleedFill.trim())) {
        ctx.fillStyle = bleedFill.trim()
      } else if (outer.type === 'solid') {
        ctx.fillStyle = outer.hex
      } else {
        const g = ctx.createLinearGradient(0, 0, TARGET_W, 0)
        g.addColorStop(0, outer.hex1)
        g.addColorStop(1, outer.hex2)
        ctx.fillStyle = g
      }
      ctx.fillRect(0, 0, TARGET_W, TARGET_H)

      const sw = stageCanvas.width
      const sh = stageCanvas.height
      if (sw === TARGET_W && sh === TARGET_H) {
        ctx.drawImage(stageCanvas, 0, 0)
      } else {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(stageCanvas, 0, 0, sw, sh, 0, 0, TARGET_W, TARGET_H)
      }

      return out
    } finally {
      if (labelsLayer && typeof prevLabelsVisible === 'boolean')
        labelsLayer.visible(prevLabelsVisible)
      if (overlayLayer && typeof prevOverlayVisible === 'boolean')
        overlayLayer.visible(prevOverlayVisible)
      if (referenceLayer && typeof prevReferenceVisible === 'boolean')
        referenceLayer.visible(prevReferenceVisible)
      stage.width(prevWidth)
      stage.height(prevHeight)
      stage.scale({ x: prevScaleX, y: prevScaleY })
      stage.draw()
    }
  }, [exportW, exportH])

  useEffect(() => {
    if (!registerExporter) return
    registerStageExporter(exportStage)
    return () => registerStageExporter(null)
  }, [registerExporter, exportStage, registerStageExporter])

  const shellClass = [
    previewSurfaceChrome ? UI_PREVIEW_SURFACE : '',
    'h-full w-full overflow-hidden flex items-center justify-center',
  ]
    .filter(Boolean)
    .join(' ')

  const onStagePointerDownForPan = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const target = e.target
    const stage = target.getStage()
    if (!stage) return
    // Art placement owns drag when the art image (or its clip group) is hit.
    let node: Konva.Node | null = target
    while (node && node !== stage) {
      if (node.name() === 'art-placement') return
      node = node.getParent()
    }
    const evt = e.evt
    if (typeof evt.button === 'number' && evt.button !== 0) return
    window.dispatchEvent(
      new CustomEvent('umps-canvas-pan-start', {
        detail: {
          clientX: evt.clientX,
          clientY: evt.clientY,
          pointerId: evt.pointerId,
        },
      }),
    )
  }, [])

  const stageInner = (
    <Stage
      ref={stageRef}
      width={previewW}
      height={previewH}
      scaleX={stageScaleX}
      scaleY={stageScaleY}
      pixelRatio={previewPixelRatio}
      onPointerDown={onStagePointerDownForPan}
    >
        {/* Hidden + clone: printable proxy only (Module 4.1); editor overlays remain. */}
        {!hiddenCloneChrome && (
          <>
            {layoutCaps.supportsBattleChrome ? (
              <>
                {/* Center-column art; side-column chrome on top; set symbol at type head. */}
                <ArtLayer />
                <BattleChromeLayer />
                <SetSymbolLayer />
              </>
            ) : layoutCaps.printOnlyStaticFrame ? (
              /** PKMN basic lands — print-as-is frame PNG only (no art/text/chrome overlays). */
              <PkmnFrameLayer />
            ) : (
              <>
                <TextureBorderLayer />
                <ArtLayer />
                <PkmnFrameLayer />
                <SpaceGothicFrameLayer />
                <FrameLayer />
                {/* Over art (and empty art fill), under nameplate — all families including PKMN. */}
                <SecondaryNameLayer />
                {layoutCaps.supportsSagaClassChrome ? <SagaClassChromeLayer /> : null}
                {showCrown ? <CrownLayer /> : null}
                {layoutCaps.supportsNamePlateBox ? <NamePlateLayer /> : null}
                {showRulesTexture ? <RulesTextBoxTextureLayer /> : null}
                {layoutCaps.supportsSpellTextBoxPanel ? <SpellTextBoxLayer /> : null}
                {showBundledRulesPanel ? <PreModernRulesTextBoxLayer /> : null}
                {layoutCaps.supportsLandSecondaryArtInRulesRegion ? <LandSecondaryArtLayer /> : null}
                {/* Rules bg (texture / parchment / plate) → watermark → rules text */}
                <WatermarkLayer />
                {layoutCaps.supportsPreparedChrome ? <PreparedChromeLayer /> : null}
                {layoutCaps.useLandFullArtManaCircle ? <LandFullArtManaCircleLayer /> : null}
                <TextIconsLayer />
                {layoutCaps.supportsPlaneswalkerAbilities ? <PlaneswalkerAbilitiesLayer /> : null}
                <SetSymbolLayer />
                <PowerToughnessOverlayLayer />
                {layoutCaps.supportsStartingLoyaltyBox ? <StartingLoyaltyOverlayLayer /> : null}
              </>
            )}
          </>
        )}
        <ClonedCardLayer />
        <DebugOverlayLayer />
        <ReferenceLayer />
    </Stage>
  )

  const trimPreviewW = Math.max(1, Math.round(tw * stageScaleX))
  const trimPreviewH = Math.max(1, Math.round(th * stageScaleY))
  const trimPresentW = battlePresentation ? trimPreviewH : trimPreviewW
  const trimPresentH = battlePresentation ? trimPreviewW : trimPreviewH
  const presentationRotateStyle = battlePresentation
    ? {
        transform: `rotate(${BATTLE_STUDIO_PRESENTATION_ROTATION_DEG}deg)`,
        transformOrigin: 'center center',
      }
    : undefined

  return (
    <div ref={containerRef} className={shellClass}>
      {exportPngIncludeBleed ? (
        <div
          data-studio-card-face
          data-battle-presentation={battlePresentation ? 'rotated-90' : undefined}
          style={{
            width: presentW,
            height: presentH,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="relative"
          aria-label={
            battlePresentation
              ? 'Battle preview (rotated +90° for readability; export stays portrait)'
              : undefined
          }
        >
          <div
            className="relative shrink-0"
            style={{ width: previewW, height: previewH, ...presentationRotateStyle }}
          >
            {stageInner}
          </div>
        </div>
      ) : (
        <div
          data-studio-card-face
          data-battle-presentation={battlePresentation ? 'rotated-90' : undefined}
          style={{
            width: trimPresentW,
            height: trimPresentH,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="relative shrink-0 overflow-hidden"
          aria-label={
            battlePresentation
              ? 'Battle trim preview (rotated +90°; PNG export stays portrait)'
              : 'Trim preview (matches PNG export without bleed)'
          }
        >
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              width: trimPreviewW,
              height: trimPreviewH,
              ...presentationRotateStyle,
            }}
          >
            <div
              className="absolute"
              style={{
                left: -BLEED_PX * stageScaleX,
                top: -BLEED_PX * stageScaleY,
                width: previewW,
                height: previewH,
              }}
            >
              {stageInner}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(KonvaStage)
