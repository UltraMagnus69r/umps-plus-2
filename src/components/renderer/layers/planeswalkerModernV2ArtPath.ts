import {
  PW_MODERN_V2_ART_BOW_DEPTH_PX,
  PW_MODERN_V2_ART_FRAME_CORNER_RADIUS_PX,
} from '../../../authority/planeswalkerModernV2LayoutAuthority'
import { addFrameBoxBowedAllSidesPath } from './frameBoxPath'

/** Inner art window clip — convex bows on all four sides (matches FrameLayer recessed fill). */
export function addPlaneswalkerModernV2ArtInnerClipPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  addFrameBoxBowedAllSidesPath(
    ctx,
    x,
    y,
    w,
    h,
    PW_MODERN_V2_ART_FRAME_CORNER_RADIUS_PX,
    PW_MODERN_V2_ART_BOW_DEPTH_PX,
    false,
  )
}
