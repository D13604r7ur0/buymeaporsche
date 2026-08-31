import * as THREE from 'three';
import type { SponsorTier } from '../../../types/sponsor';
import { decalAxes } from './orientation';
import { cmToWorld } from './scale';

/**
 * Everything that answers the question "where exactly on the car is this point,
 * and which way does the sheet metal face there?".
 *
 * The GLB ships with meaningless mesh names (`Object_0`, `Object_1`, ...) but very
 * descriptive material names following the pattern `LOD_A_<PART>_mm_<GROUP>_Mat`.
 * The part/group pair is the only reliable way to tell a door from a windshield,
 * so `RealPorscheLoader` stores it on `mesh.userData` before swapping materials and
 * every classification below reads it from there.
 */

export type SurfaceKind = 'paint' | 'glass' | 'light' | 'wheel' | 'interior' | 'trim';

export type PanelId =
  | 'hood'
  | 'roof'
  | 'decklid'
  | 'door'
  | 'front_bumper'
  | 'rear_bumper'
  | 'side'
  | 'other';

export interface CarMeshInfo {
  part: string;
  group: string;
  kind: SurfaceKind;
  panel: PanelId;
}

export interface SurfaceHit {
  /** Contact point on the outer skin, world space. */
  point: THREE.Vector3;
  /** Outward facing normal at the contact point, world space. */
  normal: THREE.Vector3;
  mesh: THREE.Mesh;
  panel: PanelId;
}

export interface ZoneInfo {
  tier: SponsorTier;
  name: string;
  pricePerCm2: number;
}

/** Exterior panels a sticker may be applied to. */
const PAINTABLE_PARTS = new Set([
  'BODY',
  'HOOD',
  'BOOT',
  'DOOR_LEFT',
  'DOOR_RIGHT',
  'FRONTBUMPER',
  'REARBUMPER',
]);

const MATERIAL_NAME_PATTERN = /^LOD_[A-Z]+_(.+)_mm_([A-Za-z]+)_Mat$/;

/** Keywords used when a model does not follow the `LOD_*` naming convention. */
const NON_PAINT_KEYWORDS = [
  'wheel', 'tire', 'tyre', 'rim', 'brake', 'caliper', 'rotor', 'disc', 'hub',
  'glass', 'window', 'windshield', 'windscreen', 'lens',
  'light', 'lamp', 'headlight', 'taillight', 'led', 'drl',
  'interior', 'seat', 'steering', 'dashboard', 'cab', 'pedal', 'carpet',
  'mirror', 'exhaust', 'chassis', 'engine', 'badge', 'emblem', 'grille',
];

const partToPanel = (part: string): PanelId => {
  if (part === 'HOOD') return 'hood';
  if (part === 'BOOT') return 'decklid';
  if (part.startsWith('DOOR')) return 'door';
  if (part === 'FRONTBUMPER') return 'front_bumper';
  if (part === 'REARBUMPER') return 'rear_bumper';
  if (part === 'BODY') return 'side'; // refined geometrically (roof vs flanks)
  return 'other';
};

const groupToKind = (part: string, group: string): SurfaceKind => {
  const g = group.toLowerCase();
  if (g === 'windows') return 'glass';
  if (g === 'lights') return 'light';
  if (g === 'wheel' || g === 'tyre' || g === 'rotor') return 'wheel';
  if (g === 'cab') return 'interior';
  if (g === 'chassis' || g === 'badges') return 'trim';
  if (g === 'ext') return PAINTABLE_PARTS.has(part) ? 'paint' : 'trim';
  return 'trim'; // `misc` covers inner shells, seals and hardware
};

/**
 * Best-effort classification for models outside the `LOD_*` convention, such as the
 * procedural fallback car. Group names count too: its wheels are unnamed meshes
 * inside a `wheel_front_left` group.
 */
const classifyByKeywords = (mesh: THREE.Mesh, materialName: string): SurfaceKind => {
  const names: string[] = [materialName];
  let node: THREE.Object3D | null = mesh;
  while (node) {
    names.push(node.name);
    node = node.parent;
  }

  const haystack = names.join(' ').toLowerCase();
  return NON_PAINT_KEYWORDS.some((word) => haystack.includes(word)) ? 'trim' : 'paint';
};

export const describeCarMesh = (mesh: THREE.Mesh): CarMeshInfo => {
  const cached = mesh.userData.carMeshInfo as CarMeshInfo | undefined;
  if (cached) return cached;

  const materialName =
    (mesh.userData.sourceMaterialName as string | undefined) ||
    (Array.isArray(mesh.material) ? mesh.material[0]?.name : mesh.material?.name) ||
    '';

  const match = MATERIAL_NAME_PATTERN.exec(materialName);
  const info: CarMeshInfo = match
    ? {
        part: match[1].toUpperCase(),
        group: match[2].toLowerCase(),
        kind: groupToKind(match[1].toUpperCase(), match[2]),
        panel: partToPanel(match[1].toUpperCase()),
      }
    : {
        part: 'UNKNOWN',
        group: 'unknown',
        kind: classifyByKeywords(mesh, materialName),
        panel: 'other',
      };

  mesh.userData.carMeshInfo = info;
  return info;
};

/** Price per cm² per zone, mirrors `ZONES` in `sampleData`. */
export const ZONE_PRICING: Record<string, ZoneInfo> = {
  decklid: { tier: 'rear_decklid', name: 'Tapa de Motor & Fascia Trasera', pricePerCm2: 50 },
  hood: { tier: 'hood_central', name: 'Cofre Aerodinámico Central', pricePerCm2: 45 },
  door_right: { tier: 'premium_door', name: 'Puerta Derecha', pricePerCm2: 35 },
  door_left: { tier: 'premium_door', name: 'Puerta Izquierda', pricePerCm2: 35 },
  roof: { tier: 'body_standard', name: 'Techo Panorámico', pricePerCm2: 30 },
  rear_bumper: { tier: 'body_standard', name: 'Defensa Trasera', pricePerCm2: 25 },
  front_bumper: { tier: 'body_standard', name: 'Defensa Delantera', pricePerCm2: 25 },
  side: { tier: 'body_standard', name: 'Salpicaderas & Costados', pricePerCm2: 25 },
};

export type AnchorKey =
  | 'hood'
  | 'roof'
  | 'decklid'
  | 'door_right'
  | 'door_left'
  | 'front_bumper'
  | 'rear_bumper';

/**
 * Wraps a loaded car model and exposes the surface queries the decal system needs.
 * All coordinates are world space.
 */
export class CarSurface {
  readonly root: THREE.Object3D;
  readonly paintMeshes: THREE.Mesh[];
  readonly box: THREE.Box3;
  readonly size: THREE.Vector3;
  readonly center: THREE.Vector3;

  private readonly meshBoxes = new Map<THREE.Mesh, THREE.Box3>();
  private readonly raycaster = new THREE.Raycaster();

  private constructor(root: THREE.Object3D, paintMeshes: THREE.Mesh[]) {
    this.root = root;
    this.paintMeshes = paintMeshes;
    this.box = new THREE.Box3().setFromObject(root);
    this.size = this.box.getSize(new THREE.Vector3());
    this.center = this.box.getCenter(new THREE.Vector3());

    paintMeshes.forEach((mesh) => {
      this.meshBoxes.set(mesh, new THREE.Box3().setFromObject(mesh));
    });
  }

  static fromObject(root: THREE.Object3D): CarSurface {
    root.updateWorldMatrix(true, true);

    const paint: THREE.Mesh[] = [];
    const anyMesh: THREE.Mesh[] = [];

    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      anyMesh.push(mesh);
      if (describeCarMesh(mesh).kind === 'paint') paint.push(mesh);
    });

    // A model we cannot classify is still better than an empty surface.
    return new CarSurface(root, paint.length > 0 ? paint : anyMesh);
  }

  /** Paint meshes whose world bounds intersect `box` — the projection candidates. */
  meshesIntersecting(box: THREE.Box3): THREE.Mesh[] {
    return this.paintMeshes.filter((mesh) => {
      const meshBox = this.meshBoxes.get(mesh);
      return meshBox ? meshBox.intersectsBox(box) : true;
    });
  }

  /** Raycast from normalized device coordinates onto the paintable body. */
  raycast(ndc: THREE.Vector2, camera: THREE.Camera): SurfaceHit | null {
    this.raycaster.setFromCamera(ndc, camera);
    const hits = this.raycaster.intersectObjects(this.paintMeshes, false);
    if (hits.length === 0) return null;
    return this.toSurfaceHit(hits[0], this.raycaster.ray.direction.clone().negate());
  }

  /**
   * Pulls a (possibly floating or buried) point back onto the outer skin.
   * `hintNormal` — when known — keeps the point on the panel it was authored for
   * instead of snapping to whatever surface happens to be closest.
   */
  snap(point: THREE.Vector3, hintNormal?: THREE.Vector3 | null): SurfaceHit | null {
    const directions: THREE.Vector3[] = [];
    if (hintNormal && hintNormal.lengthSq() > 0.0001) {
      directions.push(hintNormal.clone().normalize());
    }
    directions.push(this.outwardDirection(point));

    for (const dir of directions) {
      const hit = this.castThrough(point, dir);
      if (hit) return hit;
    }
    return null;
  }

  /** A guaranteed on-surface placement for each sellable zone. */
  anchor(key: AnchorKey): SurfaceHit | null {
    const { min, max } = this.box;
    const height = this.size.y;
    const midY = min.y + height * 0.5;
    const lengthAt = (t: number) => THREE.MathUtils.lerp(min.z, max.z, t);

    const probes: Record<AnchorKey, { from: THREE.Vector3; to: THREE.Vector3 }> = {
      // Front is +Z on this model: hood spans roughly the front third.
      hood: {
        from: new THREE.Vector3(0, max.y + 2, lengthAt(0.78)),
        to: new THREE.Vector3(0, min.y, lengthAt(0.78)),
      },
      roof: {
        from: new THREE.Vector3(0, max.y + 2, lengthAt(0.47)),
        to: new THREE.Vector3(0, min.y, lengthAt(0.47)),
      },
      decklid: {
        from: new THREE.Vector3(0, max.y + 2, lengthAt(0.13)),
        to: new THREE.Vector3(0, min.y, lengthAt(0.13)),
      },
      door_right: {
        from: new THREE.Vector3(max.x + 2, min.y + height * 0.42, lengthAt(0.52)),
        to: new THREE.Vector3(0, min.y + height * 0.42, lengthAt(0.52)),
      },
      door_left: {
        from: new THREE.Vector3(min.x - 2, min.y + height * 0.42, lengthAt(0.52)),
        to: new THREE.Vector3(0, min.y + height * 0.42, lengthAt(0.52)),
      },
      front_bumper: {
        from: new THREE.Vector3(0, min.y + height * 0.28, max.z + 2),
        to: new THREE.Vector3(0, min.y + height * 0.28, midY),
      },
      rear_bumper: {
        from: new THREE.Vector3(0, min.y + height * 0.3, min.z - 2),
        to: new THREE.Vector3(0, min.y + height * 0.3, this.center.z),
      },
    };

    const probe = probes[key];
    const direction = probe.to.clone().sub(probe.from).normalize();

    this.raycaster.set(probe.from, direction);
    const hits = this.raycaster.intersectObjects(this.paintMeshes, false);
    if (hits.length === 0) return null;

    return this.toSurfaceHit(hits[0], direction.clone().negate());
  }

  /** Which sellable zone a surface point belongs to. */
  zoneAt(hit: SurfaceHit): ZoneInfo {
    const key = this.zoneKeyAt(hit);
    return ZONE_PRICING[key] ?? ZONE_PRICING.side;
  }

  zoneKeyAt(hit: SurfaceHit): string {
    const { min } = this.box;
    const heightRatio = (hit.point.y - min.y) / Math.max(0.0001, this.size.y);

    switch (hit.panel) {
      case 'hood':
        return 'hood';
      case 'decklid':
        return 'decklid';
      case 'door':
        return hit.point.x >= 0 ? 'door_right' : 'door_left';
      case 'front_bumper':
        return 'front_bumper';
      case 'rear_bumper':
        return 'rear_bumper';
      default:
        // The single `BODY` mesh carries roof, flanks and fenders at once.
        if (heightRatio > 0.84 && hit.normal.y > 0.45) return 'roof';
        return 'side';
    }
  }


  /**
   * Blended zone for a whole sticker: samples its center and four edge midpoints,
   * so a logo straddling two panels is named and priced proportionally.
   */
  zonesUnder(
    hit: SurfaceHit,
    spinDeg: number,
    widthCm: number,
    heightCm: number
  ): ZoneInfo & { coverage: Array<{ name: string; pct: number }> } {
    const { right, up } = decalAxes(hit.normal, spinDeg, this.readsFromRear(hit.point));
    const halfWidth = (cmToWorld(Math.max(1, widthCm)) / 2) * 0.8;
    const halfHeight = (cmToWorld(Math.max(1, heightCm)) / 2) * 0.8;

    const samples: Array<{ point: THREE.Vector3; weight: number }> = [
      { point: hit.point.clone(), weight: 0.36 },
      { point: hit.point.clone().addScaledVector(right, halfWidth), weight: 0.16 },
      { point: hit.point.clone().addScaledVector(right, -halfWidth), weight: 0.16 },
      { point: hit.point.clone().addScaledVector(up, halfHeight), weight: 0.16 },
      { point: hit.point.clone().addScaledVector(up, -halfHeight), weight: 0.16 },
    ];

    const weights = new Map<string, number>();
    samples.forEach(({ point, weight }) => {
      const sampleHit = this.snap(point, hit.normal) ?? hit;
      const key = this.zoneKeyAt(sampleHit);
      weights.set(key, (weights.get(key) ?? 0) + weight);
    });

    const total = Array.from(weights.values()).reduce((sum, w) => sum + w, 0) || 1;

    let blendedPrice = 0;
    let primaryKey = this.zoneKeyAt(hit);
    let primaryWeight = -1;
    const coverage: Array<{ name: string; pct: number }> = [];

    weights.forEach((weight, key) => {
      const zone = ZONE_PRICING[key] ?? ZONE_PRICING.side;
      const share = weight / total;
      blendedPrice += zone.pricePerCm2 * share;
      coverage.push({ name: zone.name, pct: Math.round(share * 100) });
      if (weight > primaryWeight) {
        primaryWeight = weight;
        primaryKey = key;
      }
    });

    coverage.sort((a, b) => b.pct - a.pct);

    const primary = ZONE_PRICING[primaryKey] ?? ZONE_PRICING.side;
    const shared = coverage.filter((zone) => zone.pct >= 15);
    const name =
      shared.length > 1
        ? shared.map((zone) => `${zone.name} (${zone.pct}%)`).join(' + ')
        : primary.name;

    return {
      tier: primary.tier,
      name,
      pricePerCm2: Math.round(blendedPrice * 100) / 100,
      coverage,
    };
  }

  /** True for the tail of the car, where graphics are meant to be read from behind. */
  readsFromRear(point: THREE.Vector3): boolean {
    return point.z < this.box.min.z + this.size.z * 0.28;
  }

  /**
   * Outward direction at a point, approximated with the gradient of the ellipsoid
   * that wraps the car. Good enough to aim an incoming ray from outside the body.
   */
  outwardDirection(point: THREE.Vector3): THREE.Vector3 {
    const ax = Math.max(0.001, this.size.x / 2);
    const ay = Math.max(0.001, this.size.y / 2);
    const az = Math.max(0.001, this.size.z / 2);

    const dir = new THREE.Vector3(
      (point.x - this.center.x) / (ax * ax),
      (point.y - this.center.y) / (ay * ay),
      (point.z - this.center.z) / (az * az)
    );

    if (dir.lengthSq() < 0.000001) dir.set(0, 1, 0);
    return dir.normalize();
  }

  /**
   * Fires a ray from well outside the body towards `point` and keeps the hit that
   * lands nearest to it, so the decal sticks to the panel the user aimed at.
   */
  private castThrough(point: THREE.Vector3, direction: THREE.Vector3): SurfaceHit | null {
    const reach = Math.max(this.size.x, this.size.y, this.size.z);
    const origin = point.clone().addScaledVector(direction, reach);

    this.raycaster.set(origin, direction.clone().negate());
    const hits = this.raycaster.intersectObjects(this.paintMeshes, false);
    if (hits.length === 0) return null;

    let best = hits[0];
    let bestDistance = best.point.distanceToSquared(point);
    for (let i = 1; i < hits.length; i++) {
      const distance = hits[i].point.distanceToSquared(point);
      if (distance < bestDistance) {
        best = hits[i];
        bestDistance = distance;
      }
    }

    return this.toSurfaceHit(best, direction);
  }

  private toSurfaceHit(
    intersection: THREE.Intersection,
    outwardReference: THREE.Vector3
  ): SurfaceHit {
    const mesh = intersection.object as THREE.Mesh;
    const normal = new THREE.Vector3(0, 1, 0);

    if (intersection.face) {
      normal
        .copy(intersection.face.normal)
        .applyMatrix3(new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld))
        .normalize();
    }

    // Body panels are single sided in this model; flip inward faces outward.
    if (normal.dot(outwardReference) < 0) normal.negate();

    const info = describeCarMesh(mesh);

    return {
      point: intersection.point.clone(),
      normal,
      mesh,
      panel: info.panel,
    };
  }
}
