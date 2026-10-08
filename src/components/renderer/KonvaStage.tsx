import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Stage } from 'react-konva'
import type Konva from 'konva'
import {
  BLEED_PX,
  DIMENSIONS,
  STAGE_EXPORT_HEIGHT,
  STAGE_EXPORT_WIDTH,
} from '../../authority/geometryAuthority'
import { getOuterBorderFill } from '../../authority/colorAuthority'
import { UI_PREVIEW_SURFACE } from '../../authority/panelSurfaceAuthority'
import { getActiveLayoutCapabilitiesFromState } from '../../authority/layoutRegistry'
import type { LayoutId } from '../../authority/layoutTaxonomy'
import { useCardStore } from '../../store/useCardStore'

import ArtLayer from './layers/ArtLayer'
import TextureBorderLayer from './layers/TextureBorderLayer'
import FrameLayer from './layers/FrameLayer'
import LandFullArtManaCircleLayer from './layers/LandFullArtManaCircleLayer'
import RulesTextBoxTextureLayer from './layers/RulesTextBoxTextureLayer'
import WatermarkLayer from './layers/WatermarkLayer'
import LandSecondaryArtLayer from './layers/LandSecondaryArtLayer'
import SpellTextBoxLayer from './layers/SpellTextBoxLayer'
import PreModernRulesTextBoxLayer from './layers/PreModernRulesTextBoxLayer'
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
 * 3. Frame (bevel boxes; rules recess transparent when Rules Text Box Surface FX applies)
 * 3b. Rules Text Box Surface FX (base color + texture), below watermark
 * 4. Watermark — rules-area mark, above frame fill, below text
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
  const layoutCaps = useMemo(
    () =>
      getActiveLayoutCapabilitiesFromState({
        currentLayout,
        cardData: { layout: activeLayout },
      }),
    [currentLayout, activeLayout],
  )
  const showRulesTexture =
    layoutCaps.supportsPlaneswalkerModernV2Layout ||
    (layoutCaps.supportsRulesTextBoxTexture && !layoutCaps.supportsPreModernTextBoxFrame)
  const showBundledRulesPanel =
    layoutCaps.supportsPreModernTextBoxFrame || layoutCaps.supportsPlaneswalkerModernV2Layout
  const hiddenCloneChrome =
    currentLayout === 'Hidden' && String(clonedCardImage ?? '').trim().length > 0
  const stageRef = useRef<Konva.Stage | null>(null)

  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>()
  const w = DIMENSIONS.FULL_BLEED.width
  const h = DIMENSIONS.FULL_BLEED.height
  const tw = DIMENSIONS.TRIM.width
  const th = DIMENSIONS.TRIM.height

  const scale = useMemo(() => {
    const cw = size.width || 1
    const ch = size.height || 1
    if (exportPngIncludeBleed) {
      return Math.min(cw / w, ch / h)
    }
    return Math.min(cw / tw, ch / th)
  }, [size.width, size.height, w, h, tw, th, exportPngIncludeBleed])

  const scaled = useMemo(
    () => ({ width: w * scale, height: h * scale }),
    [w, h, scale],
  )

  const previewW = Math.max(1, Math.round(scaled.width))
  const previewH = Math.max(1, Math.round(scaled.height))
  const stageScaleX = previewW / w
  const stageScaleY = previewH / h

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
      stage.width(STAGE_EXPORT_WIDTH)
      stage.height(STAGE_EXPORT_HEIGHT)
      stage.scale({ x: 1, y: 1 })
      stage.draw()

      const stageCanvas = stage.toCanvas({ pixelRatio: 1 })
      const TARGET_W = STAGE_EXPORT_WIDTH
      const TARGET_H = STAGE_EXPORT_HEIGHT
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
  }, [])

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

  const stageInner = (
    <Stage
      ref={stageRef}
      width={previewW}
      height={previewH}
      scaleX={stageScaleX}
      scaleY={stageScaleY}
    >
        {/* Hidden + clone: printable proxy only (Module 4.1); editor overlays remain. */}
        {!hiddenCloneChrome && (
          <>
            <TextureBorderLayer />
            <ArtLayer />
            <FrameLayer />
            {showRulesTexture ? <RulesTextBoxTextureLayer /> : null}
            <WatermarkLayer />
            {layoutCaps.supportsLandSecondaryArtInRulesRegion ? <LandSecondaryArtLayer /> : null}
            {layoutCaps.supportsSpellTextBoxPanel ? <SpellTextBoxLayer /> : null}
            {showBundledRulesPanel ? <PreModernRulesTextBoxLayer /> : null}
            {layoutCaps.useLandFullArtManaCircle ? <LandFullArtManaCircleLayer /> : null}
            <TextIconsLayer />
            {layoutCaps.supportsPlaneswalkerAbilities ? <PlaneswalkerAbilitiesLayer /> : null}
            <SetSymbolLayer />
            <PowerToughnessOverlayLayer />
            {layoutCaps.supportsStartingLoyaltyBox ? <StartingLoyaltyOverlayLayer /> : null}
            {layoutCaps.supportsPreModernFaceLayout ? <SecondaryNameLayer /> : null}
          </>
        )}
        <ClonedCardLayer />
        <DebugOverlayLayer />
        <ReferenceLayer />
    </Stage>
  )

  return (
    <div ref={containerRef} className={shellClass}>
      {exportPngIncludeBleed ? (
        <div style={{ width: previewW, height: previewH }} className="relative">
          {stageInner}
        </div>
      ) : (
        <div
          style={{
            width: Math.max(1, Math.round(tw * stageScaleX)),
            height: Math.max(1, Math.round(th * stageScaleY)),
          }}
          className="relative shrink-0 overflow-hidden"
          aria-label="Trim preview (matches PNG export without bleed)"
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
      )}
    </div>
  )
}

export default memo(KonvaStage)
