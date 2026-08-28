import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { loadRealPorscheModel } from './RealPorscheLoader';
import { createPorscheCarGroup } from './PorscheCarMesh';
import { createSponsorTexture } from './SponsorDecalTexture';
import type { Sponsor, SponsorTier } from '../../types/sponsor';
import { ZONES } from '../../utils/sampleData';
import { Loader2, RotateCw, ZoomIn, ZoomOut, Compass, Move, Eye, Plus, Minus } from 'lucide-react';

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
  existingSponsors: Sponsor[];
  cameraViewTrigger?: string;
  interactMode?: 'moveLogo' | 'orbitCamera';
  onToggleInteractMode?: (mode: 'moveLogo' | 'orbitCamera') => void;
}

export const Studio3DCanvas: React.FC<Studio3DCanvasProps> = ({
  draftSponsor,
  onUpdateDraftPosition,
  onUpdateDimensions,
  existingSponsors,
  cameraViewTrigger,
  interactMode: externalInteractMode,
  onToggleInteractMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeZoneName, setActiveZoneName] = useState<string>(draftSponsor.zoneName || 'Cofre Central Frontal');
  const [internalMode, setInternalMode] = useState<'moveLogo' | 'orbitCamera'>('moveLogo');

  const interactMode = externalInteractMode || internalMode;
  const setInteractMode = (mode: 'moveLogo' | 'orbitCamera') => {
    setInternalMode(mode);
    if (onToggleInteractMode) {
      onToggleInteractMode(mode);
    }
  };

  // Ref to avoid stale closures during high-frequency drag events
  const draftSponsorRef = useRef<Partial<Sponsor>>(draftSponsor);
  draftSponsorRef.current = draftSponsor;

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const paintMeshesRef = useRef<THREE.Mesh[]>([]);
  const draftDecalGroupRef = useRef<THREE.Group | null>(null);
  const existingDecalsGroupRef = useRef<THREE.Group | null>(null);

  // Dragging & Interaction State
  const isPointerDownRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 6.2,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(4.2, 2.8, 4.5));
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.45, 0));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.45, 0));

  // Camera presets
  const setStudioCamera = useCallback((view: 'general' | 'hood' | 'wing' | 'leftDoor' | 'rightDoor' | 'roof' | 'rear') => {
    switch (view) {
      case 'hood':
        targetCameraPosRef.current.set(0, 2.4, 3.6);
        targetLookAtRef.current.set(0, 0.65, 1.1);
        cameraSphericalRef.current = { radius: 3.8, theta: 0, phi: 0.75 };
        break;
      case 'wing':
        targetCameraPosRef.current.set(0, 2.2, -3.8);
        targetLookAtRef.current.set(0, 0.85, -1.4);
        cameraSphericalRef.current = { radius: 4.0, theta: Math.PI, phi: 0.85 };
        break;
      case 'leftDoor':
        targetCameraPosRef.current.set(-4.2, 1.4, 0);
        targetLookAtRef.current.set(0, 0.55, 0);
        cameraSphericalRef.current = { radius: 4.2, theta: -Math.PI / 2, phi: 1.25 };
        break;
      case 'rightDoor':
        targetCameraPosRef.current.set(4.2, 1.4, 0);
        targetLookAtRef.current.set(0, 0.55, 0);
        cameraSphericalRef.current = { radius: 4.2, theta: Math.PI / 2, phi: 1.25 };
        break;
      case 'roof':
        targetCameraPosRef.current.set(0, 5.0, 0.1);
        targetLookAtRef.current.set(0, 0.5, 0);
        cameraSphericalRef.current = { radius: 5.0, theta: 0, phi: 0.06 };
        break;
      case 'rear':
        targetCameraPosRef.current.set(0, 1.5, -4.2);
        targetLookAtRef.current.set(0, 0.45, -1.2);
        cameraSphericalRef.current = { radius: 4.2, theta: Math.PI, phi: 1.2 };
        break;
      case 'general':
      default:
        targetCameraPosRef.current.set(4.2, 2.6, 4.4);
        targetLookAtRef.current.set(0, 0.45, 0);
        cameraSphericalRef.current = { radius: 6.2, theta: Math.PI / 4, phi: Math.PI / 3 };
        break;
    }
  }, []);

  // Respond to cameraViewTrigger prop changes
  useEffect(() => {
    if (cameraViewTrigger) {
      setStudioCamera(cameraViewTrigger as any);
    }
  }, [cameraViewTrigger, setStudioCamera]);

  // Project DecalGeometry exclusively onto paint body meshes (never glass)
  const projectDecal = useCallback((
    pos: [number, number, number],
    rot: [number, number, number],
    widthCm: number,
    heightCm: number,
    targetMesh?: THREE.Mesh
  ) => {
    const draftGroup = draftDecalGroupRef.current;
    if (!draftGroup) return;

    // Clear old draft decals
    while (draftGroup.children.length > 0) {
      draftGroup.remove(draftGroup.children[0]);
    }

    const meshesToProject = targetMesh ? [targetMesh] : paintMeshesRef.current;
    if (meshesToProject.length === 0) return;

    const texture = createSponsorTexture(draftSponsorRef.current, true, true);
    const decalMat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      roughness: 0.15,
      metalness: 0.05,
    });

    const position = new THREE.Vector3(...pos);
    const orientation = new THREE.Euler(...rot, 'YXZ');
    
    // Scale derived directly from centimeters
    const scaleFactor = 0.028;
    const w = Math.max(0.2, (widthCm || 35) * scaleFactor);
    const h = Math.max(0.15, (heightCm || 20) * scaleFactor);
    const d = 0.45; // Projection depth box

    const size = new THREE.Vector3(w, h, d);

    // Create DecalGeometry exclusively on paint meshes
    meshesToProject.forEach((mesh) => {
      // Ensure we NEVER project on glass or window meshes
      const name = mesh.name.toLowerCase();
      if (name.includes('glass') || name.includes('window') || name.includes('windshield')) return;

      try {
        const decalGeo = new DecalGeometry(mesh, position, orientation, size);
        const decalMesh = new THREE.Mesh(decalGeo, decalMat);
        draftGroup.add(decalMesh);
      } catch (err) {
        console.warn('Decal projection error on mesh', err);
      }
    });

    // Fallback plane if DecalGeometry produced empty geometry
    if (draftGroup.children.length === 0) {
      const fallbackGeo = new THREE.PlaneGeometry(w, h);
      const fallbackMesh = new THREE.Mesh(fallbackGeo, decalMat);
      fallbackMesh.position.copy(position);
      fallbackMesh.rotation.copy(orientation);
      draftGroup.add(fallbackMesh);
    }
  }, []);

  // Surface placement math helper (Raycasting onto body panels)
  const placeLogoAtScreenCoord = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !cameraRef.current || paintMeshesRef.current.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    // Raycast ONLY against exterior paint body meshes (excluding glass & windows)
    const validMeshes = paintMeshesRef.current.filter((m) => {
      const n = m.name.toLowerCase();
      return !n.includes('glass') && !n.includes('window') && !n.includes('windshield');
    });

    const intersects = raycaster.intersectObjects(validMeshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const point = hit.point;
      const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

      if (hit.object) {
        normal.transformDirection(hit.object.matrixWorld);
      }
      normal.normalize();

      // Lift decal slightly off the surface to eliminate z-fighting
      const offsetPoint = point.clone().add(normal.clone().multiplyScalar(0.012));

      // Calculate stable, upright coordinate basis for decal surface
      let right = new THREE.Vector3();
      let up = new THREE.Vector3();

      if (Math.abs(normal.y) > 0.65) {
        // Horizontal surface: Hood, Roof, Wing top
        const forward = new THREE.Vector3(0, 0, 1);
        right.crossVectors(forward, normal).normalize();
        up.crossVectors(normal, right).normalize();
      } else {
        // Vertical surface: Doors, Bumpers, Sides
        const worldUp = new THREE.Vector3(0, 1, 0);
        right.crossVectors(worldUp, normal).normalize();
        up.crossVectors(normal, right).normalize();
      }

      // Handle Left vs Right door so logo is never mirrored or inverted
      if (normal.x < -0.4) {
        right.negate();
      }

      const rotMatrix = new THREE.Matrix4().makeBasis(right, up, normal);
      const euler = new THREE.Euler().setFromRotationMatrix(rotMatrix, 'YXZ');

      const rot3D: [number, number, number] = [euler.x, euler.y, euler.z];
      const pos3D: [number, number, number] = [offsetPoint.x, offsetPoint.y, offsetPoint.z];

      // Automatic Zone & Price Detection based on 3D Coordinates
      let detectedTier: SponsorTier = 'hood_central';
      let detectedZoneName = 'Cofre Central Frontal';
      let detectedPrice = 20;

      // Wing (Alerón Trasero)
      if (pos3D[2] < -1.05 && pos3D[1] > 0.75) {
        detectedTier = 'vip_wing';
        detectedZoneName = 'Alerón Trasero VIP';
        detectedPrice = 25;
      }
      // Hood (Cofre)
      else if (pos3D[2] > 0.65) {
        detectedTier = 'hood_central';
        detectedZoneName = 'Cofre Central Frontal';
        detectedPrice = 20;
      }
      // Right Door (Puerta Derecha)
      else if (pos3D[0] > 0.55) {
        detectedTier = 'premium_door';
        detectedZoneName = 'Puerta / Costado Derecho';
        detectedPrice = 15;
      }
      // Left Door (Puerta Izquierda)
      else if (pos3D[0] < -0.55) {
        detectedTier = 'premium_door';
        detectedZoneName = 'Puerta / Costado Izquierdo';
        detectedPrice = 15;
      }
      // Roof (Techo)
      else if (pos3D[1] > 1.22) {
        detectedTier = 'body_standard';
        detectedZoneName = 'Techo Panorámico';
        detectedPrice = 15;
      }
      // Rear bumper
      else if (pos3D[2] < -1.4) {
        detectedTier = 'body_standard';
        detectedZoneName = 'Defensa Trasera';
        detectedPrice = 10;
      }
      // Standard Body / Bumpers
      else {
        detectedTier = 'body_standard';
        detectedZoneName = 'Carrocería Lateral';
        detectedPrice = 10;
      }

      setActiveZoneName(detectedZoneName);

      onUpdateDraftPosition({
        position3D: pos3D,
        rotation3D: rot3D,
        tier: detectedTier,
        zoneName: detectedZoneName,
        pricePerCm2: detectedPrice,
      });

      const curW = draftSponsorRef.current?.widthCm || 35;
      const curH = draftSponsorRef.current?.heightCm || 20;

      // Project Decal directly onto the car body mesh
      projectDecal(pos3D, rot3D, curW, curH, hit.object as THREE.Mesh);
    }
  }, [onUpdateDraftPosition, projectDecal]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0c10');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.copy(targetCameraPosRef.current);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.8);
    mainLight.position.set(6, 10, 8);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
    fillLight.position.set(-6, 8, -6);
    scene.add(fillLight);

    // Decals Groups
    const existingGroup = new THREE.Group();
    scene.add(existingGroup);
    existingDecalsGroupRef.current = existingGroup;

    const draftGroup = new THREE.Group();
    scene.add(draftGroup);
    draftDecalGroupRef.current = draftGroup;

    // Load Porsche 3D Model
    setIsLoading(true);
    const defaultCarConfig = {
      bodyColor: '#ffffff',
      bodyColorName: 'White',
      wheelColor: '#cbd5e1',
      wheelColorName: 'Silver',
      liveryStyle: 'clean' as const,
      daytimeLights: true,
    };

    loadRealPorscheModel('/models/porsche-911.glb', defaultCarConfig)
      .then((loaded) => {
        scene.add(loaded.group);
        carGroupRef.current = loaded.group;

        // Collect ONLY exterior paint body meshes for decals & raycasting (strictly no glass)
        paintMeshesRef.current = loaded.paintMeshes && loaded.paintMeshes.length > 0 ? loaded.paintMeshes : [];
        if (paintMeshesRef.current.length === 0) {
          const meshes: THREE.Mesh[] = [];
          loaded.group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) {
              const n = c.name.toLowerCase();
              if (!n.includes('glass') && !n.includes('window') && !n.includes('windshield') && !n.includes('wheel')) {
                meshes.push(c as THREE.Mesh);
              }
            }
          });
          paintMeshesRef.current = meshes;
        }

        setIsLoading(false);
      })
      .catch(() => {
        const fallbackGroup = createPorscheCarGroup(defaultCarConfig);
        scene.add(fallbackGroup);
        carGroupRef.current = fallbackGroup;
        const meshes: THREE.Mesh[] = [];
        fallbackGroup.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            const n = c.name.toLowerCase();
            if (!n.includes('glass') && !n.includes('window')) {
              meshes.push(c as THREE.Mesh);
            }
          }
        });
        paintMeshesRef.current = meshes;
        setIsLoading(false);
      });

    // Render Animation Loop
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isPointerDownRef.current && interactMode === 'orbitCamera') {
        // Direct snappy camera update on drag
        camera.position.copy(targetCameraPosRef.current);
        camera.lookAt(currentLookAtRef.current);
      } else {
        // Smooth lerp when moving between camera angles
        camera.position.lerp(targetCameraPosRef.current, 0.08);
        currentLookAtRef.current.lerp(targetLookAtRef.current, 0.08);
        camera.lookAt(currentLookAtRef.current);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      pmremGenerator.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [setStudioCamera, interactMode]);

  // Re-project Decal immediately whenever props change (dimensions, position, rotation, logo)
  useEffect(() => {
    if (isLoading || paintMeshesRef.current.length === 0) return;

    const pos = draftSponsor.position3D || [0, 0.96, 1.2];
    const rot = draftSponsor.rotation3D || [-1.25, 0, 0];
    const width = draftSponsor.widthCm || 35;
    const height = draftSponsor.heightCm || 20;

    projectDecal(pos, rot, width, height);
  }, [
    isLoading,
    draftSponsor.position3D,
    draftSponsor.rotation3D,
    draftSponsor.widthCm,
    draftSponsor.heightCm,
    draftSponsor.logoUrl,
    draftSponsor.tier,
    projectDecal,
  ]);

  // Render Existing Sponsors
  useEffect(() => {
    const existingGroup = existingDecalsGroupRef.current;
    if (!existingGroup || paintMeshesRef.current.length === 0) return;

    while (existingGroup.children.length > 0) {
      existingGroup.remove(existingGroup.children[0]);
    }

    existingSponsors.forEach((sponsor) => {
      const tex = createSponsorTexture(sponsor, false, false);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        roughness: 0.15,
        metalness: 0.05,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });

      const pos = new THREE.Vector3(...sponsor.position3D);
      const rot = new THREE.Euler(...sponsor.rotation3D, 'YXZ');
      const scaleFactor = 0.028;
      const size = new THREE.Vector3(
        (sponsor.widthCm || 35) * scaleFactor,
        (sponsor.heightCm || 20) * scaleFactor,
        0.45
      );

      paintMeshesRef.current.forEach((mesh) => {
        const name = mesh.name.toLowerCase();
        if (name.includes('glass') || name.includes('window') || name.includes('windshield')) return;

        try {
          const decalGeo = new DecalGeometry(mesh, pos, rot, size);
          const decalMesh = new THREE.Mesh(decalGeo, mat);
          existingGroup.add(decalMesh);
        } catch (err) {
          console.warn('Error placing existing sponsor decal', err);
        }
      });
    });
  }, [existingSponsors, isLoading]);

  // Pointer Event Handlers (Drag to Move Logo OR Orbit Camera)
  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (interactMode === 'moveLogo') {
      placeLogoAtScreenCoord(e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || !containerRef.current) return;

    if (interactMode === 'moveLogo') {
      // Smooth continuous 60fps decal dragging across the Porsche body
      placeLogoAtScreenCoord(e.clientX, e.clientY);
    } else {
      // Smooth 360 orbit camera rotation
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraSphericalRef.current.theta -= deltaX * 0.007;
      cameraSphericalRef.current.phi = Math.max(
        0.15,
        Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.007)
      );

      const r = cameraSphericalRef.current.radius;
      const theta = cameraSphericalRef.current.theta;
      const phi = cameraSphericalRef.current.phi;

      targetCameraPosRef.current.set(
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(theta)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 0.85 : 1.18;
    cameraSphericalRef.current.radius = Math.max(3.2, Math.min(10.0, cameraSphericalRef.current.radius * factor));
    const r = cameraSphericalRef.current.radius;
    const theta = cameraSphericalRef.current.theta;
    const phi = cameraSphericalRef.current.phi;
    targetCameraPosRef.current.set(
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.cos(theta)
    );
  };

  // Direct scale adjustment helpers
  const handleQuickScale = (delta: number) => {
    if (!onUpdateDimensions) return;
    const currentW = draftSponsorRef.current?.widthCm || 35;
    const currentH = draftSponsorRef.current?.heightCm || 20;
    const aspect = currentW / currentH;
    const newW = Math.max(8, Math.min(120, currentW + delta));
    const newH = Math.max(5, Math.min(60, Math.round(newW / aspect)));
    onUpdateDimensions(newW, newH);
  };

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-full bg-neutral-950 flex flex-col overflow-hidden select-none">
      
      {/* 3D Canvas Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full relative flex-1 ${
          interactMode === 'moveLogo'
            ? 'cursor-crosshair'
            : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-sm text-white">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-2" />
          <span className="text-xs font-mono tracking-wider">Cargando Estudio 3D del Porsche 911...</span>
        </div>
      )}

      {/* Floating Top Mode Selector: Orbit Camera vs Drag Logo */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Prominent Mode Switcher */}
        <div className="bg-neutral-900/95 backdrop-blur-md border border-white/15 p-1 rounded-2xl flex items-center gap-1 shadow-2xl pointer-events-auto">
          <button
            type="button"
            onClick={() => setInteractMode('orbitCamera')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-2 ${
              interactMode === 'orbitCamera'
                ? 'bg-white text-neutral-950 font-bold shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>👁️ Mover Vista 3D (Girar Auto)</span>
          </button>

          <button
            type="button"
            onClick={() => setInteractMode('moveLogo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-2 ${
              interactMode === 'moveLogo'
                ? 'bg-sky-500 text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Move className="w-4 h-4" />
            <span>✋ Mover Logo en el Porsche</span>
          </button>
        </div>

        {/* Live Detected Zone Badge */}
        {activeZoneName && (
          <div className="bg-neutral-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono px-3.5 py-2 rounded-2xl shadow-lg pointer-events-auto flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>{activeZoneName}</span>
          </div>
        )}
      </div>

      {/* Camera View Angle Selector Pills */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-1.5 max-w-[70%]">
        <button
          type="button"
          onClick={() => setStudioCamera('general')}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          Vista General
        </button>
        <button
          type="button"
          onClick={() => {
            setStudioCamera('hood');
            const zone = ZONES.find((z) => z.id === 'hood_central');
            if (zone) {
              onUpdateDraftPosition({
                position3D: [0, 0.96, 1.2],
                rotation3D: [-1.25, 0, 0],
                tier: 'hood_central',
                zoneName: zone.name,
                pricePerCm2: zone.pricePerCm2,
              });
              setActiveZoneName(zone.name);
            }
          }}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          🔰 Cofre
        </button>
        <button
          type="button"
          onClick={() => {
            setStudioCamera('wing');
            const zone = ZONES.find((z) => z.id === 'vip_wing');
            if (zone) {
              onUpdateDraftPosition({
                position3D: [0, 0.98, -1.35],
                rotation3D: [0.15, 0, 0],
                tier: 'vip_wing',
                zoneName: zone.name,
                pricePerCm2: zone.pricePerCm2,
              });
              setActiveZoneName(zone.name);
            }
          }}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          🏁 Alerón VIP
        </button>
        <button
          type="button"
          onClick={() => {
            setStudioCamera('leftDoor');
            onUpdateDraftPosition({
              position3D: [-1.02, 0.58, 0.15],
              rotation3D: [0, -Math.PI / 2, 0],
              tier: 'premium_door',
              zoneName: 'Puerta Izquierda',
              pricePerCm2: 15,
            });
            setActiveZoneName('Puerta Izquierda');
          }}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          🚪 Puerta Izq
        </button>
        <button
          type="button"
          onClick={() => {
            setStudioCamera('rightDoor');
            onUpdateDraftPosition({
              position3D: [1.02, 0.58, 0.15],
              rotation3D: [0, Math.PI / 2, 0],
              tier: 'premium_door',
              zoneName: 'Puerta Derecha',
              pricePerCm2: 15,
            });
            setActiveZoneName('Puerta Derecha');
          }}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          🚪 Puerta Der
        </button>
        <button
          type="button"
          onClick={() => {
            setStudioCamera('roof');
            onUpdateDraftPosition({
              position3D: [0, 1.34, -0.1],
              rotation3D: [-Math.PI / 2, 0, 0],
              tier: 'body_standard',
              zoneName: 'Techo Panorámico',
              pricePerCm2: 15,
            });
            setActiveZoneName('Techo Panorámico');
          }}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          🔲 Techo
        </button>
      </div>

      {/* Floating Zoom & Quick Resizer Controls on Bottom-Right */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5">
        
        {/* Quick Scale + / - */}
        <div className="bg-neutral-900/80 backdrop-blur-sm border border-white/10 rounded-xl flex items-center p-0.5 text-white">
          <button
            type="button"
            onClick={() => handleQuickScale(-5)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Reducir Tamaño del Logo"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono px-1.5 text-neutral-300">
            {draftSponsor.widthCm}cm
          </span>
          <button
            type="button"
            onClick={() => handleQuickScale(5)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Agrandar Tamaño del Logo"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleZoom('in')}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm"
          title="Zoom Acercar"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom('out')}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm"
          title="Zoom Alejar"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setStudioCamera('general')}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm"
          title="Reiniciar Vista"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
