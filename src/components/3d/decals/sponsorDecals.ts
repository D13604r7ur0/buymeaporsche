import type { Sponsor } from '../../../types/sponsor';
import type { Polygon } from '../../../utils/overlapDetection';
import { eulerToNormal } from './orientation';
import type { DecalItem, DecalState } from './DecalLayer';

/**
 * Adapter between the stored sponsor record and what the decal layer needs.
 * Position and rotation on a sponsor are only *hints*: the layer re-snaps every
 * sticker onto the real sheet metal, so old records authored against a different
 * scale still land on the body.
 */
export const sponsorToDecalItem = (
  sponsor: Partial<Sponsor>,
  options: { id?: string; state?: DecalState; cutouts?: Polygon[] } = {}
): DecalItem => {
  const normal = eulerToNormal(sponsor.rotation3D);

  return {
    id: options.id ?? sponsor.id ?? 'draft',
    position: sponsor.position3D ?? [0, 0.8, 1.4],
    normalHint: normal ? [normal.x, normal.y, normal.z] : null,
    spinDeg: sponsor.rotationAngle ?? 0,
    widthCm: sponsor.widthCm ?? 35,
    heightCm: sponsor.heightCm ?? 20,
    logoUrl: sponsor.logoUrl,
    label: sponsor.sponsorName || sponsor.brandName || 'TU LOGO',
    flipX: sponsor.flipX,
    flipY: sponsor.flipY,
    filterStyle: sponsor.filterStyle,
    opacity: sponsor.opacity,
    cutouts: options.cutouts,
    state: options.state ?? 'normal',
    payload: sponsor,
  };
};
