import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadRealPorscheModel } from './RealPorscheLoader';
import { createPorscheCarGroup } from './PorscheCarMesh';
import {
  CarSurface,
  DecalLayer,
  cmToWorld,
  orientationToEuler,
  sponsorToDecalItem,
  type AnchorKey,
  type SurfaceHit,
} from './decals';
import type { Sponsor, SponsorTier } from '../../types/sponsor';
import {
  detectSponsorOverlap,
  findNearestFreePosition,
  type OverlapDetectionResult,
} from '../../utils/overlapDetection';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Hand,
  Loader2,
  Minus,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export type StudioView =
  | 'general'
  | 'hood'
  | 'roof'
  | 'wing'
  | 'rear'
  | 'front'
  | 'leftDoor'
  | 'rightDoor';

/** Studio shortcut -> panel the sticker is moved onto. `general` only frames the car. */
const VIEW_ANCHORS: Record<StudioView, AnchorKey | null> = {
  general: null,
  hood: 'hood',
  roof: 'roof',
  wing: 'decklid',
  rear: 'rear_bumper',
  front: 'front_bumper',
  leftDoor: 'door_left',
  rightDoor: 'door_right',
};

const DEFAULT_TARGET = new THREE.Vector3(0, 0.55, 0);
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(3.6, 1.9, 3.8);

interface Studio3DCanvasProps {
  draftSponsor: Partial<Sponsor>;
  onUpdateDraftPosition: (update: {
    position3D: [number, number, number];
    rotation3D: [number, number, number];
    tier: SponsorTier;
    zoneName: string;
    pricePerCm2: number;
  }) => void;
  onUpdateDimensions?: (widthCm: number, heightCm: number) => void;
  rotationAngle?: number;
  onUpdateRotationAngle?: (angle: number) => void;
  existingSponsors: Sponsor[];
  /** Panel shortcut requested from outside the canvas. */
  cameraViewTrigger?: string;
  /** Bump to replay the same shortcut twice in a row. */
  zoneRequestSeq?: number;
  interactMode?: 'moveLogo' | 'orbitCamera';
  onToggleInteractMode?: (mode: 'moveLogo' | 'orbitCamera') => void;
}

export const Studio3DCanvas: React.FC<Studio3DCanvasProps> = ({
  draftSponsor,
  onUpdateDraftPosition,
  onUpdateDimensions,
  rotationAngle = 0,
  onUpdateRotationAngle,
  existingSponsors,
  cameraViewTrigger,
  zoneRequestSeq = 0,
  interactMode: externalInteractMode,
  onToggleInteractMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSurfaceReady, setIsSurfaceReady] = useState<boolean>(false);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [internalMode, setInternalMode] = useState<'moveLogo' | 'orbitCamera'>('moveLogo');

  const interactMode = externalInteractMode ?? internalMode;
  const setInteractMode = onToggleInteractMode ?? setInternalMode;

  // Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const surfaceRef = useRef<CarSurface | null>(null);
  const draftLayerRef = useRef<DecalLayer | null>(null);
  const sponsorLayerRef = useRef<DecalLayer | null>(null);

  // Camera fly-to
  const targetCameraPositionRef = useRef(DEFAULT_CAMERA_POSITION.clone());
  const targetLookAtRef = useRef(DEFAULT_TARGET.clone());
  const isFlyingRef = useRef<boolean>(false);

  // Pointer interaction
  const isDraggingLogoRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // Latest props for the pointer handlers, which live outside React's render cycle.
  const draftRef = useRef<Partial<Sponsor>>(draftSponsor);
  const spinRef = useRef<number>(rotationAngle);
  const interactModeRef = useRef(interactMode);
  const onUpdateDraftPositionRef = useRef(onUpdateDraftPosition);

  useEffect(() => {
    draftRef.current = draftSponsor;
    spinRef.current = rotationAngle;
    interactModeRef.current = interactMode;
    onUpdateDraftPositionRef.current = onUpdateDraftPosition;
  });

  const widthCm = draftSponsor.widthCm ?? 35;
  const heightCm = draftSponsor.heightCm ?? 20;

  const overlapResult: OverlapDetectionResult = useMemo(
    () => detectSponsorOverlap({ ...draftSponsor, rotationAngle }, existingSponsors),
    [draftSponsor, existingSponsors, rotationAngle]
  );

  const [activeZoneName, setActiveZoneName] = useState<string>(
    draftSponsor.zoneName || 'Cofre Aerodinámico Central'
  );

  // The zone can also change from outside (a placement made in the hero scene).
  useEffect(() => {
    if (draftSponsor.zoneName) setActiveZoneName(draftSponsor.zoneName);
  }, [draftSponsor.zoneName]);

  /** Distance at which a sphere of `radius` fills the viewport, narrow side included. */
  const fitDistance = useCallback((radius: number): number => {
    const camera = cameraRef.current;
    if (!camera) return radius * 3;

    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    return radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2);
  }, []);

  /** Pulls back until the whole car is in frame. */
  const frameWholeCar = useCallback(() => {
    const surface = surfaceRef.current;
    if (!surface) {
      targetCameraPositionRef.current.copy(DEFAULT_CAMERA_POSITION);
      targetLookAtRef.current.copy(DEFAULT_TARGET);
      isFlyingRef.current = true;
      return;
    }

    const sphere = surface.box.getBoundingSphere(new THREE.Sphere());
    const direction = new THREE.Vector3(0.72, 0.42, 0.78).normalize();

    targetLookAtRef.current.copy(sphere.center);
    targetCameraPositionRef.current
      .copy(sphere.center)
      .addScaledVector(direction, fitDistance(sphere.radius * 0.92));
    isFlyingRef.current = true;
  }, [fitDistance]);

  /** Frames the camera in front of a spot on the body. */
  const focusOnHit = useCallback(
    (hit: SurfaceHit, sizeCm: number) => {
      const direction = hit.normal.clone().multiplyScalar(0.78);
      direction.add(new THREE.Vector3(0, 0.42, 0));

      // Horizontal panels read better from the nose or the tail than from straight above.
      if (Math.abs(hit.normal.y) > 0.7) {
        direction.add(new THREE.Vector3(0, 0, hit.point.z >= 0 ? 0.62 : -0.62));
      }
      direction.normalize();

      // Show the sticker plus a good chunk of the panel around it.
      const distance = Math.max(1.4, fitDistance(cmToWorld(sizeCm) * 1.7));

      targetCameraPositionRef.current.copy(hit.point).addScaledVector(direction, distance);
      targetLookAtRef.current.copy(hit.point);
      isFlyingRef.current = true;
    },
    [fitDistance]
  );

  /** Writes a placement back to the parent, priced by the panels it covers. */
  const commitPlacement = useCallback(
    (hit: SurfaceHit, options: { focus?: boolean } = {}) => {
      const surface = surfaceRef.current;
      if (!surface) return;

      const draft = draftRef.current;
      const spin = spinRef.current;
      const width = draft.widthCm ?? 35;
      const height = draft.heightCm ?? 20;

      const zone = surface.zonesUnder(hit, spin, width, height);
      setActiveZoneName(zone.name);

      onUpdateDraftPositionRef.current({
        position3D: [
          Number(hit.point.x.toFixed(4)),
          Number(hit.point.y.toFixed(4)),
          Number(hit.point.z.toFixed(4)),
        ],
        // Stored without the spin: `rotationAngle` carries that separately.
        rotation3D: orientationToEuler(hit.normal, 0, surface.readsFromRear(hit.point)),
        tier: zone.tier,
        zoneName: zone.name,
        pricePerCm2: zone.pricePerCm2,
      });

      if (options.focus) focusOnHit(hit, Math.max(width, height));
    },
    [focusOnHit]
  );

  /** Places the sticker where the pointer touches the body. */
  const placeAtPointer = useCallback(
    (clientX: number, clientY: number): boolean => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      const surface = surfaceRef.current;
      if (!container || !camera || !surface) return false;

      const rect = container.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );

      const hit = surface.raycast(ndc, camera);
      if (!hit) return false;

      commitPlacement(hit);
      return true;
    },
    [commitPlacement]
  );

  /** Moves the sticker onto a whole panel and looks at it. */
  const goToZone = useCallback(
    (view: StudioView) => {
      const surface = surfaceRef.current;
      const anchorKey = VIEW_ANCHORS[view];

      if (!surface || !anchorKey) {
        frameWholeCar();
        return;
      }

      const hit = surface.anchor(anchorKey);
      if (!hit) return;

      commitPlacement(hit, { focus: true });
    },
    [commitPlacement, frameWholeCar]
  );

  const handleAutoRelocate = useCallback(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const freePosition = findNearestFreePosition(
      { ...draftRef.current, rotationAngle: spinRef.current },
      existingSponsors
    );

    if (!freePosition) {
      window.alert(
        'No se encontró espacio libre en este panel para el tamaño actual. Reduce los cm o elige otra zona (techo, puertas o tapa trasera).'
      );
      return;
    }

    const hit = surface.snap(
      new THREE.Vector3(...freePosition),
      surface.outwardDirection(new THREE.Vector3(...freePosition))
    );
    if (hit) commitPlacement(hit);
  }, [commitPlacement, existingSponsors]);

  // ---------------------------------------------------------------- scene setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0c10');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 100);
    camera.position.copy(DEFAULT_CAMERA_POSITION);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.2;
    controls.maxDistance = 11;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.target.copy(DEFAULT_TARGET);
    controlsRef.current = controls;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;
    scene.environment = environment;

    scene.add(new THREE.AmbientLight(0xffffff, 1.3));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.6);
    fillLight.position.set(-6, 8, -6);
    scene.add(fillLight);

    if (import.meta.env.DEV) {
      // Handy when tuning placement math from the browser console.
      (window as unknown as Record<string, unknown>).__porscheStudio = {
        scene,
        camera,
        controls,
        surface: () => surfaceRef.current,
        draftLayer: () => draftLayerRef.current,
      };
    }

    const requestRepaint = () => {
      // The render loop is continuous; textures only need to be flagged.
    };

    const sponsorLayer = new DecalLayer('studio_sponsor_decals', requestRepaint);
    const draftLayer = new DecalLayer('studio_draft_decal', requestRepaint);
    scene.add(sponsorLayer.group);
    scene.add(draftLayer.group);
    sponsorLayerRef.current = sponsorLayer;
    draftLayerRef.current = draftLayer;

    let disposed = false;

    const attachCar = (group: THREE.Object3D) => {
      if (disposed) {
        return;
      }
      scene.add(group);

      const surface = CarSurface.fromObject(group);
      surfaceRef.current = surface;
      sponsorLayer.setSurface(surface);
      draftLayer.setSurface(surface);

      setIsLoading(false);
      setIsSurfaceReady(true);
      frameWholeCar();

      // A draft without a placement starts on the hood, on the metal, not floating.
      if (!draftRef.current.position3D) {
        const hoodHit = surface.anchor('hood');
        if (hoodHit) commitPlacement(hoodHit, { focus: true });
      }
    };

    setIsLoading(true);
    loadRealPorscheModel('/models/porsche-911.glb', {
      bodyColor: '#ffffff',
      bodyColorName: 'White',
      wheelColor: '#cbd5e1',
      wheelColorName: 'Silver',
      liveryStyle: 'clean',
      daytimeLights: true,
    })
      .then((loaded) => attachCar(loaded.group))
      .catch((error) => {
        console.warn('Usando el Porsche procedural de respaldo', error);
        attachCar(
          createPorscheCarGroup({
            bodyColor: '#ffffff',
            bodyColorName: 'White',
            wheelColor: '#cbd5e1',
            wheelColorName: 'Silver',
            liveryStyle: 'clean',
            daytimeLights: true,
          })
        );
      });

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (isFlyingRef.current) {
        camera.position.lerp(targetCameraPositionRef.current, 0.09);
        controls.target.lerp(targetLookAtRef.current, 0.09);
        if (camera.position.distanceTo(targetCameraPositionRef.current) < 0.04) {
          isFlyingRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      draftLayer.dispose();
      sponsorLayer.dispose();

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });

      environment.dispose();
      pmremGenerator.dispose();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      surfaceRef.current = null;
      draftLayerRef.current = null;
      sponsorLayerRef.current = null;
    };
  }, [commitPlacement, frameWholeCar]);

  // ------------------------------------------------------------- decal syncing
  useEffect(() => {
    const layer = draftLayerRef.current;
    if (!layer || !isSurfaceReady) return;

    layer.sync([
      sponsorToDecalItem(
        { ...draftSponsor, rotationAngle },
        {
          id: 'draft',
          state: overlapResult.hasOverlap ? 'blocked' : 'draft',
          cutouts: overlapResult.occupiedMasks,
        }
      ),
    ]);
  }, [draftSponsor, rotationAngle, overlapResult, isSurfaceReady]);

  useEffect(() => {
    const layer = sponsorLayerRef.current;
    if (!layer || !isSurfaceReady) return;

    layer.sync(existingSponsors.map((sponsor) => sponsorToDecalItem(sponsor)));
  }, [existingSponsors, isSurfaceReady]);

  // --------------------------------------------------------- external shortcuts
  useEffect(() => {
    if (!isSurfaceReady || !cameraViewTrigger) return;
    goToZone(cameraViewTrigger as StudioView);
    // `zoneRequestSeq` lets the parent replay the same shortcut.
  }, [cameraViewTrigger, zoneRequestSeq, isSurfaceReady, goToZone]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.autoRotate = isAutoRotating;
    controls.autoRotateSpeed = 1.8;
  }, [isAutoRotating]);

  // ---------------------------------------------------------- pointer handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isPrimaryDrag = (event: PointerEvent) =>
      event.button === 0 && event.pointerType !== 'touch' ? true : event.isPrimary;

    const handlePointerDown = (event: PointerEvent) => {
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      isFlyingRef.current = false;
      setIsAutoRotating(false);

      if (event.button !== 0 || !isPrimaryDrag(event)) return;
      if (interactModeRef.current !== 'moveLogo') return;

      const surface = surfaceRef.current;
      const camera = cameraRef.current;
      if (!surface || !camera) return;

      const rect = container.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      // Only hijack the drag when it starts on the car; dragging the background
      // still orbits the camera.
      if (!surface.raycast(ndc, camera)) return;

      isDraggingLogoRef.current = true;
      if (controlsRef.current) controlsRef.current.enabled = false;
      container.setPointerCapture?.(event.pointerId);
      placeAtPointer(event.clientX, event.clientY);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingLogoRef.current) return;
      placeAtPointer(event.clientX, event.clientY);
    };

    const endDrag = (event: PointerEvent) => {
      const start = pointerStartRef.current;
      const wasDraggingLogo = isDraggingLogoRef.current;

      isDraggingLogoRef.current = false;
      pointerStartRef.current = null;
      if (controlsRef.current) controlsRef.current.enabled = true;
      container.releasePointerCapture?.(event.pointerId);

      // A tap always places the sticker, even while in camera mode.
      if (!wasDraggingLogo && start && event.button === 0) {
        const travelled = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (travelled < 5) placeAtPointer(event.clientX, event.clientY);
      }
    };

    // Capture phase: decide before OrbitControls sees the event.
    container.addEventListener('pointerdown', handlePointerDown, { capture: true });
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', endDrag);
      container.removeEventListener('pointercancel', endDrag);
    };
  }, [placeAtPointer]);

  // -------------------------------------------------------------------- toolbar
  const handleScale = (deltaCm: number) => {
    if (!onUpdateDimensions) return;
    const aspect = widthCm / Math.max(1, heightCm);
    const nextWidth = THREE.MathUtils.clamp(widthCm + deltaCm, 5, 120);
    const nextHeight = THREE.MathUtils.clamp(Math.round(nextWidth / aspect), 3, 70);
    onUpdateDimensions(nextWidth, nextHeight);
  };

  const handleSpin = (deltaDeg: number) => {
    if (!onUpdateRotationAngle) return;
    onUpdateRotationAngle((((rotationAngle + deltaDeg) % 360) + 360) % 360);
  };

  const handleZoom = (factor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    isFlyingRef.current = false;
    const offset = camera.position.clone().sub(controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() * factor,
      controls.minDistance,
      controls.maxDistance
    );
    camera.position.copy(controls.target).addScaledVector(offset.normalize(), distance);
  };

  const zoneShortcuts: Array<{ view: StudioView; label: string }> = [
    { view: 'hood', label: '🔰 Cofre' },
    { view: 'roof', label: '🔲 Techo' },
    { view: 'wing', label: '🏁 Tapa Trasera' },
    { view: 'leftDoor', label: '🚪 Puerta Izq' },
    { view: 'rightDoor', label: '🚪 Puerta Der' },
    { view: 'rear', label: '🏎️ Defensa' },
  ];

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-full bg-neutral-950 overflow-hidden select-none">
      <div
        ref={containerRef}
        className={`w-full h-full ${
          interactMode === 'moveLogo' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/85 backdrop-blur-sm text-white">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-2" />
          <span className="text-xs font-mono tracking-wider">
            Cargando Estudio 3D del Porsche 911...
          </span>
        </div>
      )}

      {/* Top row: live zone, collision status, camera options */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-neutral-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2 max-w-[16rem]">
          <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">{activeZoneName}</span>
        </div>

        <div className="pointer-events-auto">
          {overlapResult.hasOverlap ? (
            <div className="flex items-center gap-2 bg-neutral-950/95 border-2 border-amber-500/80 text-amber-200 text-xs font-mono px-3.5 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-amber-100 text-[11px]">
                  {overlapResult.totalOverlappedAreaCm2} cm² ya vendidos ({overlapResult.overlapPercentage}%)
                </span>
                <span className="text-[9px] text-amber-300">
                  Tu logo se recorta ahí · Se te cobran{' '}
                  <strong>{overlapResult.effectiveAreaCm2} cm²</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoRelocate}
                className="ml-1 px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] uppercase transition cursor-pointer shadow-md flex items-center gap-1 shrink-0"
                title="Mover el logo al espacio libre más cercano"
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Reubicar</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono px-3 py-1.5 rounded-2xl shadow-md backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{widthCm * heightCm} cm² libres</span>
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <div className="bg-neutral-900/90 backdrop-blur-md border border-white/10 rounded-2xl flex items-center p-0.5 shadow-lg">
            <button
              type="button"
              onClick={() => setInteractMode('moveLogo')}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                interactMode === 'moveLogo'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'text-neutral-300 hover:text-white'
              }`}
              title="Arrastra sobre la carrocería para mover tu logo"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mover logo</span>
            </button>
            <button
              type="button"
              onClick={() => setInteractMode('orbitCamera')}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono transition cursor-pointer flex items-center gap-1 ${
                interactMode === 'orbitCamera'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'text-neutral-300 hover:text-white'
              }`}
              title="Arrastra para girar la cámara; un clic sigue colocando el logo"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Girar cámara</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoRotating((value) => !value)}
            className={`px-2.5 py-2 rounded-2xl text-[10px] font-mono border transition cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
              isAutoRotating
                ? 'bg-sky-500 text-white border-sky-400 font-bold'
                : 'bg-neutral-900/90 text-neutral-300 border-white/10 hover:text-white'
            }`}
            title="Auto-girar la vista 360°"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950/70 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm whitespace-nowrap">
          {interactMode === 'moveLogo'
            ? 'Arrastra tu logo sobre la carrocería · arrastra el fondo para girar'
            : 'Arrastra para girar · haz clic en la carrocería para colocar tu logo'}
        </span>
      </div>

      {/* Panel shortcuts */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-1.5 max-w-[62%]">
        <button
          type="button"
          onClick={() => goToZone('general')}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          Vista 360°
        </button>
        {zoneShortcuts.map(({ view, label }) => (
          <button
            key={view}
            type="button"
            onClick={() => goToZone(view)}
            className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sticker tools */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleSpin(45)}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm flex items-center gap-1 text-[10px] font-mono"
          title="Rotar el logo +45°"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          <span>{Math.round(rotationAngle)}°</span>
        </button>

        <div className="bg-neutral-900/80 backdrop-blur-sm border border-white/10 rounded-xl flex items-center p-0.5 text-white">
          <button
            type="button"
            onClick={() => handleScale(-5)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Reducir el logo"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono px-1.5 text-neutral-300">{widthCm}cm</span>
          <button
            type="button"
            onClick={() => handleScale(5)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Agrandar el logo"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleZoom(0.85)}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm"
          title="Acercar"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(1.18)}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm"
          title="Alejar"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => goToZone('general')}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm"
          title="Reiniciar la vista"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
