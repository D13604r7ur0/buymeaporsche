import * as THREE from 'three';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { CarSurface, type SurfaceHit } from './carSurface';
import { decalOrientation } from './orientation';
import { LogoTexture, type LogoFilterStyle } from './logoTexture';
import { cmToWorld } from './scale';
import type { Polygon } from '../../../utils/overlapDetection';

/**
 * Renders sticker decals onto the car body and keeps them there.
 *
 * The layer owns every GPU resource it creates and diffs incoming items against
 * what is already on screen: a decal is only re-projected when its placement or
 * size changed, and only repainted when its artwork changed.
 */

export type DecalState = 'normal' | 'hover' | 'selected' | 'draft' | 'blocked';

export interface DecalItem {
  id: string;
  /** Authored anchor. It is snapped onto the real sheet metal before projecting. */
  position: [number, number, number];
  /** Preferred outward direction, used to disambiguate which panel to snap to. */
  normalHint?: [number, number, number] | null;
  /** Rotation of the sticker around the surface normal, in degrees. */
  spinDeg?: number;
  widthCm: number;
  heightCm: number;
  logoUrl?: string;
  label?: string;
  flipX?: boolean;
  flipY?: boolean;
  filterStyle?: LogoFilterStyle;
  opacity?: number;
  cutouts?: Polygon[];
  state?: DecalState;
  /** Anything the caller wants back from `pick()`. */
  payload?: unknown;
}

export interface DecalPlacement {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

const OUTLINE_COLORS: Partial<Record<DecalState, number>> = {
  draft: 0x38bdf8,
  blocked: 0xef4444,
  selected: 0x00e5ff,
  hover: 0xffffff,
};

/** Lifts the decal off the paint to avoid z-fighting (~1.5 mm at car scale). */
const SURFACE_LIFT = 0.0015;

interface DecalEntry {
  item: DecalItem;
  texture: LogoTexture;
  material: THREE.MeshBasicMaterial;
  meshes: THREE.Mesh[];
  outline: THREE.LineLoop | null;
  placement: DecalPlacement | null;
  transformKey: string;
}

const transformKeyOf = (item: DecalItem): string =>
  [
    item.position.map((v) => v.toFixed(4)).join(','),
    (item.normalHint || []).map((v) => v.toFixed(3)).join(','),
    item.spinDeg ?? 0,
    item.widthCm,
    item.heightCm,
    item.state ?? 'normal',
  ].join('|');

export class DecalLayer {
  readonly group: THREE.Group;

  private surface: CarSurface | null = null;
  private surfaceVersion = 0;
  private entries = new Map<string, DecalEntry>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly onNeedsRepaint?: () => void;

  constructor(name: string, onNeedsRepaint?: () => void) {
    this.group = new THREE.Group();
    this.group.name = name;
    this.group.renderOrder = 20;
    this.onNeedsRepaint = onNeedsRepaint;
  }

  /** Swaps the car the decals live on and forces a full re-projection. */
  setSurface(surface: CarSurface | null): void {
    this.surface = surface;
    this.surfaceVersion += 1;
    this.entries.forEach((entry) => {
      entry.transformKey = '';
    });
  }

  hasSurface(): boolean {
    return this.surface !== null;
  }

  /** Applies `items` as the complete contents of this layer. */
  sync(items: DecalItem[]): void {
    const incoming = new Set(items.map((item) => item.id));

    this.entries.forEach((entry, id) => {
      if (!incoming.has(id)) {
        this.disposeEntry(entry);
        this.entries.delete(id);
      }
    });

    items.forEach((item) => this.syncItem(item));
  }

  /** Where a decal actually ended up on the body, after snapping. */
  getPlacement(id: string): DecalPlacement | null {
    return this.entries.get(id)?.placement ?? null;
  }

  /** Returns the payload of the front-most decal under the pointer. */
  pick(ndc: THREE.Vector2, camera: THREE.Camera): DecalItem | null {
    this.raycaster.setFromCamera(ndc, camera);
    const hits = this.raycaster.intersectObjects(this.group.children, false);

    for (const hit of hits) {
      const id = hit.object.userData.decalId as string | undefined;
      const entry = id ? this.entries.get(id) : undefined;
      if (entry) return entry.item;
    }
    return null;
  }

  dispose(): void {
    this.entries.forEach((entry) => this.disposeEntry(entry));
    this.entries.clear();
    this.group.removeFromParent();
  }

  private syncItem(item: DecalItem): void {
    let entry = this.entries.get(item.id);

    if (!entry) {
      const texture = new LogoTexture(() => this.onNeedsRepaint?.());
      const material = new THREE.MeshBasicMaterial({
        map: texture.texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

      entry = {
        item,
        texture,
        material,
        meshes: [],
        outline: null,
        placement: null,
        transformKey: '',
      };
      this.entries.set(item.id, entry);
    }

    entry.item = item;

    entry.texture.apply({
      logoUrl: item.logoUrl,
      label: item.label,
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      flipX: item.flipX,
      flipY: item.flipY,
      filterStyle: item.filterStyle,
      opacity: item.opacity,
      cutouts: item.cutouts,
    });

    const key = `${transformKeyOf(item)}|${this.surfaceVersion}`;
    if (key !== entry.transformKey) {
      entry.transformKey = key;
      this.rebuildGeometry(entry);
    }
  }

  private rebuildGeometry(entry: DecalEntry): void {
    this.clearMeshes(entry);

    const item = entry.item;
    const anchor = new THREE.Vector3(...item.position);
    const hint = item.normalHint ? new THREE.Vector3(...item.normalHint).normalize() : null;

    const hit: SurfaceHit | null = this.surface ? this.surface.snap(anchor, hint) : null;

    const point = hit ? hit.point : anchor;
    const normal = hit ? hit.normal : hint ?? new THREE.Vector3(0, 1, 0);
    const readFromRear = this.surface ? this.surface.readsFromRear(point) : false;
    const quaternion = decalOrientation(normal, item.spinDeg ?? 0, readFromRear);

    entry.placement = { point: point.clone(), normal: normal.clone(), quaternion };

    const width = cmToWorld(Math.max(1, item.widthCm));
    const height = cmToWorld(Math.max(1, item.heightCm));
    // Depth of the projector box: deep enough to wrap panel curvature, shallow
    // enough that the sticker never punches through to the far side of the car.
    const depth = THREE.MathUtils.clamp(Math.max(width, height) * 0.6, 0.03, 0.14);

    const size = new THREE.Vector3(width, height, depth);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    const lift = normal.clone().multiplyScalar(SURFACE_LIFT);

    if (this.surface && hit) {
      const reach = Math.max(width, height) * 0.75 + depth;
      const bounds = new THREE.Box3().setFromCenterAndSize(
        point,
        new THREE.Vector3(reach * 2, reach * 2, reach * 2)
      );

      this.surface.meshesIntersecting(bounds).forEach((mesh) => {
        try {
          const geometry = new DecalGeometry(mesh, point, euler, size);
          if (!geometry.attributes.position || geometry.attributes.position.count === 0) {
            geometry.dispose();
            return;
          }

          const decalMesh = new THREE.Mesh(geometry, entry.material);
          decalMesh.position.copy(lift);
          decalMesh.renderOrder = 20;
          decalMesh.userData.decalId = item.id;
          entry.meshes.push(decalMesh);
          this.group.add(decalMesh);
        } catch (error) {
          console.warn('No se pudo proyectar la calcomanía sobre el panel', error);
        }
      });
    }

    // Nothing to project onto (model still loading, or anchor off the body):
    // show a flat sticker so the user always sees their logo.
    if (entry.meshes.length === 0) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), entry.material);
      plane.position.copy(point).add(lift);
      plane.quaternion.copy(quaternion);
      plane.renderOrder = 20;
      plane.userData.decalId = item.id;
      entry.meshes.push(plane);
      this.group.add(plane);
    }

    this.rebuildOutline(entry, point, quaternion, normal, width, height);
  }

  private rebuildOutline(
    entry: DecalEntry,
    point: THREE.Vector3,
    quaternion: THREE.Quaternion,
    normal: THREE.Vector3,
    width: number,
    height: number
  ): void {
    const color = OUTLINE_COLORS[entry.item.state ?? 'normal'];
    if (!color) return;

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfWidth, -halfHeight, 0),
      new THREE.Vector3(halfWidth, -halfHeight, 0),
      new THREE.Vector3(halfWidth, halfHeight, 0),
      new THREE.Vector3(-halfWidth, halfHeight, 0),
    ]);

    const outline = new THREE.LineLoop(
      geometry,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: entry.item.state === 'blocked' ? 0.95 : 0.75,
        depthTest: false,
        toneMapped: false,
      })
    );

    outline.position.copy(point).addScaledVector(normal, SURFACE_LIFT * 3);
    outline.quaternion.copy(quaternion);
    outline.renderOrder = 30;

    entry.outline = outline;
    this.group.add(outline);
  }

  private clearMeshes(entry: DecalEntry): void {
    entry.meshes.forEach((mesh) => {
      this.group.remove(mesh);
      mesh.geometry.dispose();
    });
    entry.meshes = [];

    if (entry.outline) {
      this.group.remove(entry.outline);
      entry.outline.geometry.dispose();
      (entry.outline.material as THREE.Material).dispose();
      entry.outline = null;
    }
  }

  private disposeEntry(entry: DecalEntry): void {
    this.clearMeshes(entry);
    entry.material.dispose();
    entry.texture.dispose();
  }
}
