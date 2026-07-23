import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Image, Layer, Rect } from 'react-konva'
import Konva from 'konva'
import { shallow } from 'zustand/shallow'
import {
  getStandardLayoutGeometry,
} from '../../../authority/geometryAuthority'
import {
  getInnerBorderCornerRadius,
  getInnerBorderStageRect,
  isBorderlessArtTreatmentLayout,
} from '../../../authority/layoutTaxonomy'
import { getActiveLayoutCapabilitiesFromState } from '../../../authority/layoutRegistry'
import { landFullArtManaCircleKeyToBracketToken } from '../../../authority/landFullArtManaCircle'
import {
  IDENTITY_SWIRL_RASTER_PX,
  getIdentitySwirlPatternCanvas,
  getSwirlStopsFromResolvedIdentity,
} from '../../../authority/identitySwirlAuthority'
import { getOuterBorderFill, resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'
import { isOuterBorderTexture, outerBorderPngUrl } from '../../../data/outerBorderOptions'
import { shouldDefaultWhiteInnerBorder as computeShouldDefaultWhiteInnerBorder } from '../../../authority/textBackgroundContrastAuthority'

/** Module 2.2 — cardstock-like surface variation (restrained). */
const TEXTURE_NOISE_AMOUNT = 0.08

function linearGradientBoxPoints(
  dir: 'vertical' | 'horizontal' | 'diagonal',
  x: number,
  y: number,
  w: number,
  h: number,
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  if (dir === 'horizontal') return { start: { x, y }, end: { x: x + w, y } }
  if (dir === 'vertical') return { start: { x, y }, end: { x, y: y + h } }
  return { start: { x, y }, end: { x: x + w, y: y + h } }
}

/**
 * Texture / Border (base stack).
 * Bleed rect matches the trim (outer border) fill for Module 4.2 bleed continuity.
 * Renders: bleed rect, trim (outer border), inner border, inside-border texture.
 * Placed under ArtLayer so the inner mat does not cover the artwork.
 */
function TextureBorderLayer() {
  const layout = getStandardLayoutGeometry()
  const {
    bleedX,
    bleedY,
    bleedW,
    bleedH,
    trimX,
    trimY,
    trimW,
    trimH,
    innerX: canonicalInnerX,
    innerY: canonicalInnerY,
    innerW: canonicalInnerW,
    innerH: canonicalInnerH,
  } = layout

  const {
    cardTypeLine,
    colorIdentity,
    cardName,
    manaCost,
    autoColorEnabled,
    manualColorKey,
    manualColorHex1,
    manualColorHex2,
    manualColorHex3,
    manualColorHex4,
    manualColorHex5,
    manualColorCount,
    colorBlendDirection,
    outerBorderColor,
    selectedTexture,
    textureOpacity,
    activeLayout,
    landFullArtManaCircleKey,
    innerBorderEnabled,
    innerBorderOpacity,
    innerBorderBackground,
    innerBorderBackgroundPreview,
    outerBorderFrameTexture,
    outerBorderFrameTextureOpacity,
    outerBorderColorPreview,
  } = useCardStore(
    (s) => ({
      cardTypeLine: s.cardData.typeLine,
      colorIdentity: s.cardData.colorIdentity,
      cardName: s.cardData.name,
      manaCost: s.cardData.manaCost,
      autoColorEnabled: s.autoColorEnabled,
      manualColorKey: s.manualColorKey,
      manualColorHex1: s.manualColorHex1,
      manualColorHex2: s.manualColorHex2,
      manualColorHex3: s.manualColorHex3,
      manualColorHex4: s.manualColorHex4,
      manualColorHex5: s.manualColorHex5,
      manualColorCount: s.manualColorCount,
      colorBlendDirection: s.colorBlendDirection,
      outerBorderColor: s.cardData.outerBorderColor ?? 'black',
      selectedTexture: s.cardData.selectedTexture,
      textureOpacity: s.cardData.textureOpacity,
      activeLayout: s.cardData.layout,
      landFullArtManaCircleKey: s.cardData.landFullArtManaCircleKey,
      innerBorderEnabled: s.cardData.innerBorderEnabled,
      innerBorderOpacity: s.cardData.innerBorderOpacity,
      innerBorderBackground: s.cardData.innerBorderBackground ?? 'identity',
      innerBorderBackgroundPreview: s.innerBorderBackgroundPreview,
      outerBorderFrameTexture: s.cardData.outerBorderFrameTexture,
      outerBorderFrameTextureOpacity: s.cardData.outerBorderFrameTextureOpacity,
      outerBorderColorPreview: s.outerBorderColorPreview,
    }),
    shallow,
  )

  // Hover-preview override (Outer Border picker). Falls back to the committed color.
  const effectiveOuterBorderColor = outerBorderColorPreview ?? outerBorderColor
  const borderlessLike = isBorderlessArtTreatmentLayout(activeLayout)
  const { useLandFullArtManaCircle } = getActiveLayoutCapabilitiesFromState({
    cardData: { layout: activeLayout },
  })
  const { innerX, innerY, innerW, innerH } = useMemo(
    () =>
      getInnerBorderStageRect(activeLayout, {
        trimY,
        trimH,
        innerX: canonicalInnerX,
        innerY: canonicalInnerY,
        innerW: canonicalInnerW,
        innerH: canonicalInnerH,
      }),
    [activeLayout, trimY, trimH, canonicalInnerX, canonicalInnerY, canonicalInnerW, canonicalInnerH],
  )
  const identityManaCost = useLandFullArtManaCircle
    ? landFullArtManaCircleKeyToBracketToken(landFullArtManaCircleKey)
    : (manaCost ?? '')
  const identityPips = useLandFullArtManaCircle ? [] : colorIdentity
  const identityAutoColorEnabled = useLandFullArtManaCircle ? true : autoColorEnabled

  const resolvedIdentity = useMemo(
    () =>
      resolveProceduralIdentity(
        cardTypeLine,
        identityPips,
        cardName,
        identityManaCost,
        identityAutoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      ),
    [
      useLandFullArtManaCircle,
      landFullArtManaCircleKey,
      cardTypeLine,
      identityPips,
      cardName,
      identityManaCost,
      identityAutoColorEnabled,
      manualColorKey,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorCount,
    ],
  )

  const shouldDefaultWhiteInnerBorder = useMemo(
    () =>
      computeShouldDefaultWhiteInnerBorder({
        autoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      }),
    [
      autoColorEnabled,
      manualColorKey,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorCount,
    ],
  )

  const outerBorderPng = outerBorderPngUrl(effectiveOuterBorderColor)
  const [outerBorderImg, setOuterBorderImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!outerBorderPng) {
      setOuterBorderImg(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setOuterBorderImg(img)
    img.onerror = () => setOuterBorderImg(null)
    img.src = outerBorderPng
  }, [outerBorderPng])

  // Inner Border background source: 'identity' (Color Identity fill) or a picker value.
  const effectiveInnerBackground = innerBorderBackgroundPreview ?? innerBorderBackground ?? 'identity'
  const innerBgIsIdentity = effectiveInnerBackground === 'identity'
  const innerBgPng = innerBgIsIdentity ? null : outerBorderPngUrl(effectiveInnerBackground)
  const [innerBgImg, setInnerBgImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!innerBgPng) {
      setInnerBgImg(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setInnerBgImg(img)
    img.onerror = () => setInnerBgImg(null)
    img.src = innerBgPng
  }, [innerBgPng])
  // Card Frame Texture is disabled when the inner border uses a picked image/texture.
  const cardFrameTextureAllowed = innerBgPng == null

  // OBF (Outer Border Frame) Texture — applies over anything in the SOLID/DUAL groups,
  // including M15 Solid PNGs; only the Textures group itself is excluded.
  const outerBorderFrameTextureActive =
    !isOuterBorderTexture(effectiveOuterBorderColor) && !!outerBorderFrameTexture
  const [obfTextureImg, setObfTextureImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!outerBorderFrameTextureActive) {
      setObfTextureImg(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setObfTextureImg(img)
    img.onerror = () => setObfTextureImg(null)
    img.src = `/assets/textures/${encodeURIComponent(outerBorderFrameTexture)}`
  }, [outerBorderFrameTextureActive, outerBorderFrameTexture])

  const [textureImg, setTextureImg] = useState<HTMLImageElement | null>(null)
  const textureGroupRef = useRef<Konva.Rect>(null)
  useEffect(() => {
    if (!selectedTexture) {
      setTextureImg(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setTextureImg(img)
    img.onerror = () => setTextureImg(null)
    img.src = `/assets/textures/${encodeURIComponent(selectedTexture)}`
  }, [selectedTexture])
  useEffect(() => {
    if (textureImg) textureGroupRef.current?.cache()
  }, [textureImg, textureOpacity])

  const trimFillProps = useMemo(() => {
    const outerFill = getOuterBorderFill(effectiveOuterBorderColor)
    if (outerFill.type !== 'gradient') return { fill: outerFill.hex }
    const trimLinearDir = colorBlendDirection === 'swirl' ? 'vertical' : colorBlendDirection
    const { start, end } = linearGradientBoxPoints(trimLinearDir, trimX, trimY, trimW, trimH)
    return {
      fillLinearGradientStartPoint: start,
      fillLinearGradientEndPoint: end,
      fillLinearGradientColorStops: [0, outerFill.hex1, 1, outerFill.hex2],
    }
  }, [colorBlendDirection, effectiveOuterBorderColor, trimH, trimW, trimX, trimY])

  /** Bleed always matches the Outer Border (absolute gradient points = seamless join). */
  const bleedFillProps = trimFillProps

  const innerLinearDir = colorBlendDirection === 'swirl' ? 'vertical' : colorBlendDirection
  const innerGradientEnds = useMemo(
    () => linearGradientBoxPoints(innerLinearDir, innerX, innerY, innerW, innerH),
    [innerLinearDir, innerX, innerY, innerW, innerH],
  )

  const isSwirlIdentity = colorBlendDirection === 'swirl'
  const swirlStops = useMemo(
    () => getSwirlStopsFromResolvedIdentity(resolvedIdentity),
    [resolvedIdentity],
  )
  const swirlPatternCanvas = useMemo(() => {
    if (!isSwirlIdentity || shouldDefaultWhiteInnerBorder) return null
    return getIdentitySwirlPatternCanvas(IDENTITY_SWIRL_RASTER_PX, IDENTITY_SWIRL_RASTER_PX, swirlStops)
  }, [isSwirlIdentity, shouldDefaultWhiteInnerBorder, swirlStops])

  const innerBorderProps = shouldDefaultWhiteInnerBorder
    ? { fill: '#ffffff' }
    : isSwirlIdentity && swirlPatternCanvas
      ? {
          // Konva accepts CanvasPattern sources; react-konva types prefer HTMLImageElement.
          fillPatternImage: swirlPatternCanvas as unknown as HTMLImageElement,
          fillPatternRepeat: 'no-repeat',
          fillPatternX: 0,
          fillPatternY: 0,
          fillPatternScaleX: innerW / IDENTITY_SWIRL_RASTER_PX,
          fillPatternScaleY: innerH / IDENTITY_SWIRL_RASTER_PX,
        }
      : resolvedIdentity.kind === 'multi'
        ? {
            fillLinearGradientStartPoint: innerGradientEnds.start,
            fillLinearGradientEndPoint: innerGradientEnds.end,
            fillLinearGradientColorStops: resolvedIdentity.stops.flatMap((c, i, arr) => [
              arr.length <= 1 ? 0 : i / (arr.length - 1),
              c,
            ]),
          }
        : resolvedIdentity.kind === 'gradient'
          ? {
              fillLinearGradientStartPoint: innerGradientEnds.start,
              fillLinearGradientEndPoint: innerGradientEnds.end,
              fillLinearGradientColorStops: [0, resolvedIdentity.top, 1, resolvedIdentity.bottom],
            }
          : { fill: resolvedIdentity.fill }

  /** Inner border fill: identity (above) OR a picked background (image / solid / dual). */
  const effectiveInnerBorderProps = useMemo(() => {
    if (innerBgIsIdentity) return innerBorderProps
    if (innerBgImg) {
      return {
        fillPatternImage: innerBgImg,
        fillPatternRepeat: 'no-repeat',
        fillPatternX: 0,
        fillPatternY: 0,
        fillPatternScaleX: innerW / (innerBgImg.naturalWidth || 1),
        fillPatternScaleY: innerH / (innerBgImg.naturalHeight || 1),
      }
    }
    const fill = getOuterBorderFill(effectiveInnerBackground)
    if (fill.type !== 'gradient') return { fill: fill.hex }
    return {
      fillLinearGradientStartPoint: innerGradientEnds.start,
      fillLinearGradientEndPoint: innerGradientEnds.end,
      fillLinearGradientColorStops: [0, fill.hex1, 1, fill.hex2],
    }
  }, [innerBgIsIdentity, innerBorderProps, innerBgImg, effectiveInnerBackground, innerGradientEnds, innerW, innerH])

  const innerCornerRadius = useMemo(
    () => getInnerBorderCornerRadius(activeLayout),
    [activeLayout],
  )

  return (
    <Layer listening={false}>
      {/* Bleed — matches outer border for trim continuity (Module 4.2). */}
      <Rect
        listening={false}
        x={bleedX}
        y={bleedY}
        width={bleedW}
        height={bleedH}
        {...bleedFillProps}
      />

      {/* Trim / Outer Border */}
      <Rect listening={false} x={trimX} y={trimY} width={trimW} height={trimH} {...trimFillProps} />

      {/* Outer Border PNG (M15 Solid / M15 Texture) — stretched to fill the whole card;
          inner border + boxes draw on top, leaving the textured/solid outer band visible. */}
      {outerBorderImg && (
        <Image
          listening={false}
          image={outerBorderImg}
          x={bleedX}
          y={bleedY}
          width={bleedW}
          height={bleedH}
        />
      )}

      {/* OBF Texture — grain stretched over the Outer Border band (solid/dual colors only). */}
      {obfTextureImg && (
        <Image
          listening={false}
          image={obfTextureImg}
          x={trimX}
          y={trimY}
          width={trimW}
          height={trimH}
          opacity={Math.max(0, Math.min(1, outerBorderFrameTextureOpacity ?? 1))}
        />
      )}

      {/* Inner Border */}
      {!borderlessLike && innerBorderEnabled && (
        <Rect
          listening={false}
          x={innerX}
          y={innerY}
          width={innerW}
          height={innerH}
          opacity={Math.max(0, Math.min(1, innerBorderOpacity ?? 1))}
          {...effectiveInnerBorderProps}
          cornerRadius={innerCornerRadius as number | number[]}
        />
      )}

      {/* Card Frame Texture — stretched to exactly the Inner Border rect (same rounded
          corners), drawn just over the inner border and under everything else
          (disabled when inner uses a picked image). */}
      {textureImg && cardFrameTextureAllowed && (
        <Rect
          ref={textureGroupRef}
          listening={false}
          x={innerX}
          y={innerY}
          width={innerW}
          height={innerH}
          cornerRadius={innerCornerRadius as number | number[]}
          fillPatternImage={textureImg}
          fillPatternRepeat="no-repeat"
          fillPatternX={0}
          fillPatternY={0}
          fillPatternScaleX={innerW / (textureImg.naturalWidth || 1)}
          fillPatternScaleY={innerH / (textureImg.naturalHeight || 1)}
          opacity={Math.max(0, Math.min(1, textureOpacity ?? 1))}
          filters={[Konva.Filters.Noise]}
          noise={TEXTURE_NOISE_AMOUNT}
        />
      )}
    </Layer>
  )
}

export default memo(TextureBorderLayer)
