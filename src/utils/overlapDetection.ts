import type { Sponsor } from '../types/sponsor';
import { WORLD_PER_CM } from '../components/3d/decals/scale';

export type PanelType = 
  | 'hood' 
  | 'roof' 
  | 'rear_decklid' 
  | 'door_left' 
  | 'door_right' 
  | 'rear_bumper' 
  | 'front_bumper' 
  | 'other';

export interface Point2D {
  x: number;
  y: number;
}

export type Polygon = Point2D[];

export interface OverlapItem {
  sponsorId: string;
  brandName: string;
  overlapAreaCm2: number;
  overlapPercentage: number; // Percentage of the draft logo covered
  localTexturePolygon: Polygon; // Polygon in 0..1024 texture canvas space
}

export interface OverlapDetectionResult {
  hasOverlap: boolean;
  totalOverlappedAreaCm2: number;
  effectiveAreaCm2: number;
  overlapPercentage: number;
  overlappingSponsors: OverlapItem[];
  occupiedMasks: Polygon[]; // Local texture polygons of occupied cells to clip
  message: string;
}

/**
 * Three.js world units per centimeter. Shared with the 3D decal system so that
 * collision cells, pricing and what the user sees on the car stay in sync.
 */
const SCALE_FACTOR = WORLD_PER_CM;

/**
 * Determines which geometric body panel a sponsor decal is placed on.
 */
export function getPanelType(sponsor: Partial<Sponsor>): PanelType {
  const pos = sponsor.position3D || [0, 0.96, 1.2];
  const tier = sponsor.tier;
  const zoneName = (sponsor.zoneName || '').toLowerCase();

  // Tier-based overrides
  if (tier === 'rear_decklid' || tier === 'vip_wing') return 'rear_decklid';
  if (tier === 'hood_central') return 'hood';

  // Zone name clues
  if (zoneName.includes('cofre') || zoneName.includes('frunk')) return 'hood';
  if (zoneName.includes('techo') || zoneName.includes('roof')) return 'roof';
  if (zoneName.includes('tapa') || zoneName.includes('alerón') || zoneName.includes('motor')) return 'rear_decklid';
  if (zoneName.includes('izquierda') || zoneName.includes('izq')) return 'door_left';
  if (zoneName.includes('derecha') || zoneName.includes('der')) return 'door_right';
  if (zoneName.includes('defensa trasera') || zoneName.includes('fascia trasera')) return 'rear_bumper';
  if (zoneName.includes('defensa delantera') || zoneName.includes('fascia delantera')) return 'front_bumper';

  // Coordinate classification
  const [x, y, z] = pos;
  if (x < -0.35) return 'door_left';
  if (x > 0.35) return 'door_right';
  if (y > 1.15 && Math.abs(x) < 0.60 && z >= -0.80 && z <= 0.50) return 'roof';
  if (z > 0.60 && y > 0.55 && Math.abs(x) < 0.65) return 'hood';
  if (z < -0.95 && y > 0.65) return 'rear_decklid';
  if (z < -1.35 && y <= 0.65) return 'rear_bumper';
  if (z > 1.35 && y <= 0.55) return 'front_bumper';

  return 'other';
}

/**
 * Maps 3D coordinates and rotation into 2D panel space (in centimeters).
 */
export function getSponsorPolygon2D(sponsor: Partial<Sponsor>): {
  panel: PanelType;
  polygon: Polygon;
  center: Point2D;
  widthCm: number;
  heightCm: number;
} {
  const panel = getPanelType(sponsor);
  const pos = sponsor.position3D || [0, 0.96, 1.2];
  const widthCm = Math.max(1, sponsor.widthCm || 35);
  const heightCm = Math.max(1, sponsor.heightCm || 20);
  const angleDeg = sponsor.rotationAngle || 0;

  // Convert 3D world units to Panel Centimeters
  let cx = 0;
  let cy = 0;

  switch (panel) {
    case 'hood':
    case 'roof':
    case 'rear_decklid':
      cx = pos[0] / SCALE_FACTOR; // Lateral X in cm
      cy = pos[2] / SCALE_FACTOR; // Longitudinal Z in cm
      break;
    case 'door_left':
      cx = pos[2] / SCALE_FACTOR; // Longitudinal Z in cm
      cy = pos[1] / SCALE_FACTOR; // Height Y in cm
      break;
    case 'door_right':
      cx = -pos[2] / SCALE_FACTOR; // Mirrored Z in cm
      cy = pos[1] / SCALE_FACTOR;
      break;
    case 'rear_bumper':
    case 'front_bumper':
    default:
      cx = pos[0] / SCALE_FACTOR;
      cy = pos[1] / SCALE_FACTOR;
      break;
  }

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const hw = widthCm / 2;
  const hh = heightCm / 2;

  // 4 corners of the rotated rectangle centered at (cx, cy)
  const localCorners: Point2D[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];

  const polygon: Polygon = localCorners.map((pt) => ({
    x: cx + (pt.x * cos - pt.y * sin),
    y: cy + (pt.x * sin + pt.y * cos),
  }));

  return {
    panel,
    polygon,
    center: { x: cx, y: cy },
    widthCm,
    heightCm,
  };
}

/**
 * Calculates the 2D area of a polygon using the Shoelace formula.
 */
export function polygonArea(polygon: Polygon): number {
  const n = polygon.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Clips a subject polygon against an infinite line passing through cp1 -> cp2 (keeping points on the left).
 */
function clipPolygonAgainstEdge(poly: Polygon, cp1: Point2D, cp2: Point2D): Polygon {
  const output: Polygon = [];
  if (poly.length === 0) return output;

  const isInside = (p: Point2D): boolean => {
    return (cp2.x - cp1.x) * (p.y - cp1.y) - (cp2.y - cp1.y) * (p.x - cp1.x) >= -1e-6;
  };

  const intersection = (p1: Point2D, p2: Point2D): Point2D => {
    const a1 = p2.y - p1.y;
    const b1 = p1.x - p2.x;
    const c1 = a1 * p1.x + b1 * p1.y;

    const a2 = cp2.y - cp1.y;
    const b2 = cp1.x - cp2.x;
    const c2 = a2 * cp1.x + b2 * cp1.y;

    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) < 1e-8) {
      return { x: p1.x, y: p1.y };
    }
    return {
      x: (b2 * c1 - b1 * c2) / det,
      y: (a1 * c2 - a2 * c1) / det,
    };
  };

  let s = poly[poly.length - 1];
  for (let i = 0; i < poly.length; i++) {
    const e = poly[i];
    if (isInside(e)) {
      if (!isInside(s)) {
        output.push(intersection(s, e));
      }
      output.push(e);
    } else if (isInside(s)) {
      output.push(intersection(s, e));
    }
    s = e;
  }

  return output;
}

/**
 * Sutherland-Hodgman Polygon Clipping algorithm to find the intersection of two convex polygons.
 */
export function clipPolygon(subject: Polygon, clipper: Polygon): Polygon {
  let output = [...subject];

  // Ensure consistent winding order for clipper
  let clip = [...clipper];
  let signedArea = 0;
  for (let i = 0; i < clip.length; i++) {
    const j = (i + 1) % clip.length;
    signedArea += clip[i].x * clip[j].y - clip[j].x * clip[i].y;
  }
  if (signedArea < 0) {
    clip.reverse();
  }

  for (let i = 0; i < clip.length; i++) {
    const cp1 = clip[i];
    const cp2 = clip[(i + 1) % clip.length];
    output = clipPolygonAgainstEdge(output, cp1, cp2);
    if (output.length === 0) break;
  }

  return output;
}

/**
 * Calculates intersection area between two rotated sponsor rectangles in cm².
 */
export function calculateSponsorOverlapArea(
  sponsorA: Partial<Sponsor>,
  sponsorB: Partial<Sponsor>
): number {
  const panelA = getPanelType(sponsorA);
  const panelB = getPanelType(sponsorB);

  // Different panels cannot physically overlap
  if (panelA !== panelB) return 0;

  const dataA = getSponsorPolygon2D(sponsorA);
  const dataB = getSponsorPolygon2D(sponsorB);

  // Quick bounding box rejection check
  let minAx = Infinity, maxAx = -Infinity, minAy = Infinity, maxAy = -Infinity;
  dataA.polygon.forEach((p) => {
    if (p.x < minAx) minAx = p.x;
    if (p.x > maxAx) maxAx = p.x;
    if (p.y < minAy) minAy = p.y;
    if (p.y > maxAy) maxAy = p.y;
  });

  let minBx = Infinity, maxBx = -Infinity, minBy = Infinity, maxBy = -Infinity;
  dataB.polygon.forEach((p) => {
    if (p.x < minBx) minBx = p.x;
    if (p.x > maxBx) maxBx = p.x;
    if (p.y < minBy) minBy = p.y;
    if (p.y > maxBy) maxBy = p.y;
  });

  if (maxAx < minBx || minAx > maxBx || maxAy < minBy || minAy > maxBy) {
    return 0;
  }

  const clipped = clipPolygon(dataA.polygon, dataB.polygon);
  const area = polygonArea(clipped);

  // Filter out tiny precision margins (< 1 cm²)
  return area >= 1.0 ? Math.round(area * 10) / 10 : 0;
}

/**
 * Converts a polygon from 2D panel space (cm) to draft sponsor's local 1024x1024 canvas texture pixel space.
 */
export function mapPanelPolygonToTextureSpace(
  poly: Polygon,
  draftSponsor: Partial<Sponsor>
): Polygon {
  const data = getSponsorPolygon2D(draftSponsor);
  const cx = data.center.x;
  const cy = data.center.y;
  const widthCm = Math.max(1, data.widthCm);
  const heightCm = Math.max(1, data.heightCm);
  const angleDeg = draftSponsor.rotationAngle || 0;

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return poly.map((pt) => {
    // Relative to center
    const dx = pt.x - cx;
    const dy = pt.y - cy;

    // Inverse rotate to align with sticker axis
    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;

    // Map [-widthCm/2, widthCm/2] -> [0, 1024]
    const u = 512 + (localX / widthCm) * 1024;
    const v = 512 + (localY / heightCm) * 1024;

    return { x: Math.round(u * 10) / 10, y: Math.round(v * 10) / 10 };
  });
}

/**
 * Detects all collisions/overlaps between a draft sponsor and existing sponsors on the car.
 * Computes exact overlapped area, net effective car body area, and local texture clipping masks.
 */
export function detectSponsorOverlap(
  draftSponsor: Partial<Sponsor>,
  existingSponsors: Sponsor[]
): OverlapDetectionResult {
  const totalAreaCm2 = (draftSponsor.widthCm || 35) * (draftSponsor.heightCm || 20);
  const overlappingSponsors: OverlapItem[] = [];
  const occupiedMasks: Polygon[] = [];

  let totalOverlappedAreaCm2 = 0;

  const dataA = getSponsorPolygon2D(draftSponsor);

  existingSponsors.forEach((sponsor) => {
    // Skip self if comparing against an existing record with matching ID
    if (draftSponsor.id && sponsor.id === draftSponsor.id) return;

    const panelA = dataA.panel;
    const panelB = getPanelType(sponsor);
    if (panelA !== panelB) return;

    const dataB = getSponsorPolygon2D(sponsor);
    const clipped = clipPolygon(dataA.polygon, dataB.polygon);
    const area = polygonArea(clipped);

    if (area >= 1.0) {
      const roundedArea = Math.round(area * 10) / 10;
      const percentage = Math.min(100, Math.round((roundedArea / totalAreaCm2) * 100));
      const localTexPoly = mapPanelPolygonToTextureSpace(clipped, draftSponsor);

      overlappingSponsors.push({
        sponsorId: sponsor.id,
        brandName: sponsor.brandName || sponsor.sponsorName || 'Patrocinador Existente',
        overlapAreaCm2: roundedArea,
        overlapPercentage: percentage,
        localTexturePolygon: localTexPoly,
      });

      occupiedMasks.push(localTexPoly);
      totalOverlappedAreaCm2 += roundedArea;
    }
  });

  // Cap overlapped area to total draft area
  totalOverlappedAreaCm2 = Math.min(totalAreaCm2, Math.round(totalOverlappedAreaCm2 * 10) / 10);
  const effectiveAreaCm2 = Math.max(0, Math.round(totalAreaCm2 - totalOverlappedAreaCm2));
  const overlapPercentage = totalAreaCm2 > 0 
    ? Math.min(100, Math.round((totalOverlappedAreaCm2 / totalAreaCm2) * 100)) 
    : 0;

  const hasOverlap = overlappingSponsors.length > 0 && totalOverlappedAreaCm2 >= 1.0;

  let message = '';
  if (hasOverlap) {
    const names = overlappingSponsors.map((o) => `"${o.brandName}" (${o.overlapAreaCm2} cm²)`).join(', ');
    message = `Se detectaron ${totalOverlappedAreaCm2} cm² en celdas ocupadas por ${names}. Esas celdas están protegidas y tu logo se recortará en ellas. Solo se te cobrarán las ${effectiveAreaCm2} cm² de celdas libres.`;
  }

  return {
    hasOverlap,
    totalOverlappedAreaCm2,
    effectiveAreaCm2,
    overlapPercentage,
    overlappingSponsors,
    occupiedMasks,
    message,
  };
}

/**
 * Searches for the nearest clear 3D position on the same panel where the draft logo does not overlap.
 */
export function findNearestFreePosition(
  draftSponsor: Partial<Sponsor>,
  existingSponsors: Sponsor[]
): [number, number, number] | null {
  const originalPos = draftSponsor.position3D || [0, 0.96, 1.2];
  const panel = getPanelType(draftSponsor);

  const stepCm = 6; // search step size in cm
  const maxSearchRadiusCm = 60;

  // Generate radial concentric search grid
  for (let r = stepCm; r <= maxSearchRadiusCm; r += stepCm) {
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      const dx = (Math.cos(angle) * r) * SCALE_FACTOR;
      const dy = (Math.sin(angle) * r) * SCALE_FACTOR;

      let candidatePos: [number, number, number] = [...originalPos];

      switch (panel) {
        case 'hood':
          candidatePos = [
            Math.max(-0.55, Math.min(0.55, originalPos[0] + dx)),
            originalPos[1],
            Math.max(0.68, Math.min(1.55, originalPos[2] + dy)),
          ];
          break;
        case 'roof':
          candidatePos = [
            Math.max(-0.45, Math.min(0.45, originalPos[0] + dx)),
            originalPos[1],
            Math.max(-0.70, Math.min(0.40, originalPos[2] + dy)),
          ];
          break;
        case 'rear_decklid':
          candidatePos = [
            Math.max(-0.55, Math.min(0.55, originalPos[0] + dx)),
            originalPos[1],
            Math.max(-1.75, Math.min(-1.05, originalPos[2] + dy)),
          ];
          break;
        case 'door_left':
        case 'door_right':
          candidatePos = [
            originalPos[0],
            Math.max(0.45, Math.min(0.95, originalPos[1] + dy)),
            Math.max(-1.20, Math.min(0.80, originalPos[2] + dx)),
          ];
          break;
        default:
          candidatePos = [originalPos[0] + dx, originalPos[1] + dy, originalPos[2]];
          break;
      }

      const testSponsor: Partial<Sponsor> = {
        ...draftSponsor,
        position3D: candidatePos,
      };

      const result = detectSponsorOverlap(testSponsor, existingSponsors);
      if (!result.hasOverlap) {
        return candidatePos;
      }
    }
  }

  return null;
}
