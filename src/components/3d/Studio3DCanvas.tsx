import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadRealPorscheModel } from './RealPorscheLoader';
import { createPorscheCarGroup } from './PorscheCarMesh';
import { createSponsorTexture } from './SponsorDecalTexture';
import type { Sponsor, SponsorTier } from '../../types/sponsor';
import { ZONES } from '../../utils/sampleData';
import { Loader2, RotateCw, ZoomIn, ZoomOut, Compass, Sparkles } from 'lucide-react';

interface Studio3DCanvasProps {
  draftSponsor: Partial<Sponsor>;
  onUpdateDraftPosition: (update: {
    position3D: [number, number, number];
    rotation3D: [number, number, number];
    tier: SponsorTier;
    zoneName: string;
    pricePerCm2: number;
  }) => void;
  existingSponsors: Sponsor[];
}

export const Studio3DCanvas: React.FC<Studio3DCanvasProps> = ({
  draftSponsor,
  onUpdateDraftPosition,
  existingSponsors,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeZoneName, setActiveZoneName] = useState<string>(draftSponsor.zoneName || 'Cofre Central');

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const carMeshesRef = useRef<THREE.Mesh[]>([]);
  const draftDecalMeshRef = useRef<THREE.Mesh | null>(null);
  const decalsGroupRef = useRef<THREE.Group | null>(null);

  // Orbit control state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 6.8,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(4.5, 3.2, 5.0));
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.45, 0));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.45, 0));

  // Camera presets
  const setStudioCamera = useCallback((view: 'general' | 'hood' | 'wing' | 'leftDoor' | 'rightDoor' | 'roof') => {
    switch (view) {
      case 'hood':
        targetCameraPosRef.current.set(0, 2.6, 3.8);
        targetLookAtRef.current.set(0, 0.6, 1.2);
        cameraSphericalRef.current = { radius: 4.2, theta: 0, phi: 0.8 };
        break;
      case 'wing':
        targetCameraPosRef.current.set(0, 2.4, -4.2);
        targetLookAtRef.current.set(0, 0.9, -1.5);
        cameraSphericalRef.current = { radius: 4.5, theta: Math.PI, phi: 0.9 };
        break;
      case 'leftDoor':
        targetCameraPosRef.current.set(-4.8, 1.6, 0);
        targetLookAtRef.current.set(0, 0.6, 0);
        cameraSphericalRef.current = { radius: 4.8, theta: -Math.PI / 2, phi: 1.2 };
        break;
      case 'rightDoor':
        targetCameraPosRef.current.set(4.8, 1.6, 0);
        targetLookAtRef.current.set(0, 0.6, 0);
        cameraSphericalRef.current = { radius: 4.8, theta: Math.PI / 2, phi: 1.2 };
        break;
      case 'roof':
        targetCameraPosRef.current.set(0, 5.5, 0.2);
        targetLookAtRef.current.set(0, 0.5, 0);
        cameraSphericalRef.current = { radius: 5.5, theta: 0, phi: 0.1 };
        break;
      case 'general':
      default:
        targetCameraPosRef.current.set(4.5, 3.0, 4.8);
        targetLookAtRef.current.set(0, 0.5, 0);
        cameraSphericalRef.current = { radius: 6.8, theta: Math.PI / 4, phi: Math.PI / 3 };
        break;
    }
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0c10');
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.copy(targetCameraPosRef.current);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(6, 10, 8);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(-6, 8, -6);
    scene.add(fillLight);

    // Decals Group
    const decalsGroup = new THREE.Group();
    scene.add(decalsGroup);
    decalsGroupRef.current = decalsGroup;

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

        // Collect body meshes for raycasting
        const meshes: THREE.Mesh[] = [];
        loaded.group.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) {
            meshes.push(c as THREE.Mesh);
          }
        });
        carMeshesRef.current = meshes;
        setIsLoading(false);
      })
      .catch(() => {
        const fallbackGroup = createPorscheCarGroup(defaultCarConfig);
        scene.add(fallbackGroup);
        carGroupRef.current = fallbackGroup;
        const meshes: THREE.Mesh[] = [];
        fallbackGroup.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
        });
        carMeshesRef.current = meshes;
        setIsLoading(false);
      });

    // Render Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (!isDraggingRef.current) {
        camera.position.lerp(targetCameraPosRef.current, 0.08);
        currentLookAtRef.current.lerp(targetLookAtRef.current, 0.08);
        camera.lookAt(currentLookAtRef.current);
      } else {
        camera.lookAt(currentLookAtRef.current);
      }

      // Pulse Draft Decal
      if (draftDecalMeshRef.current && draftSponsor.scale3D) {
        const pulse = 1 + Math.sin(time * 5) * 0.02;
        draftDecalMeshRef.current.scale.set(
          (draftSponsor.scale3D[0] || 1) * pulse,
          (draftSponsor.scale3D[1] || 1) * pulse,
          1
        );
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
  }, [setStudioCamera]);

  // Render Existing Sponsors + Live Draft Decal
  useEffect(() => {
    const decalsGroup = decalsGroupRef.current;
    if (!decalsGroup) return;

    // Clear old decals
    while (decalsGroup.children.length > 0) {
      decalsGroup.remove(decalsGroup.children[0]);
    }

    // 1. Existing sponsors
    existingSponsors.forEach((sponsor) => {
      const tex = createSponsorTexture(sponsor, false, false);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });
      const geo = new THREE.PlaneGeometry(1, 0.5);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...sponsor.position3D);
      mesh.rotation.set(...sponsor.rotation3D);
      mesh.scale.set(...sponsor.scale3D);
      decalsGroup.add(mesh);
    });

    // 2. Draft Sponsor Decal with High-Visibility Glowing Studio Highlight
    if (draftSponsor.position3D) {
      const draftTex = createSponsorTexture(draftSponsor, true, true);
      const draftMat = new THREE.MeshStandardMaterial({
        map: draftTex,
        transparent: true,
        roughness: 0.15,
        metalness: 0.1,
        emissive: new THREE.Color('#38bdf8'),
        emissiveIntensity: 0.45,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
      });
      const draftGeo = new THREE.PlaneGeometry(1, 0.5);
      const draftMesh = new THREE.Mesh(draftGeo, draftMat);
      draftMesh.position.set(...draftSponsor.position3D);
      draftMesh.rotation.set(...(draftSponsor.rotation3D || [-1.22, 0, 0]));
      draftMesh.scale.set(
        draftSponsor.scale3D?.[0] || 0.8,
        draftSponsor.scale3D?.[1] || 0.4,
        1
      );
      draftDecalMeshRef.current = draftMesh;
      decalsGroup.add(draftMesh);
    } else {
      draftDecalMeshRef.current = null;
    }
  }, [existingSponsors, draftSponsor]);

  // Raycasting Click-to-Place anywhere on the Porsche body
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || carMeshesRef.current.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObjects(carMeshesRef.current, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const point = hit.point;
      const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

      if (hit.object) {
        normal.transformDirection(hit.object.matrixWorld);
      }

      // Slightly lift decal along surface normal to prevent z-fighting
      const offsetPoint = point.clone().add(normal.clone().multiplyScalar(0.018));

      // Calculate Euler rotation aligned to surface normal
      const dummy = new THREE.Object3D();
      dummy.position.copy(offsetPoint);
      dummy.lookAt(offsetPoint.clone().add(normal));
      // Orient upright
      dummy.rotateZ(Math.PI);

      const rot3D: [number, number, number] = [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];
      const pos3D: [number, number, number] = [offsetPoint.x, offsetPoint.y, offsetPoint.z];

      // Automatic Zone & Price Detection based on 3D coordinates on Porsche 911
      let detectedTier: SponsorTier = 'hood_central';
      let detectedZoneName = 'Cofre Central Frontal';
      let detectedPrice = 20;

      // Wing (Alerón Trasero)
      if (pos3D[2] < -1.05 && pos3D[1] > 0.78) {
        detectedTier = 'vip_wing';
        detectedZoneName = 'Alerón Trasero VIP';
        detectedPrice = 25;
      }
      // Hood (Cofre)
      else if (pos3D[2] > 0.75) {
        detectedTier = 'hood_central';
        detectedZoneName = 'Cofre Central Frontal';
        detectedPrice = 20;
      }
      // Right Door (Puerta Derecha)
      else if (pos3D[0] > 0.65) {
        detectedTier = 'premium_door';
        detectedZoneName = 'Puerta / Costado Derecho';
        detectedPrice = 15;
      }
      // Left Door (Puerta Izquierda)
      else if (pos3D[0] < -0.65) {
        detectedTier = 'premium_door';
        detectedZoneName = 'Puerta / Costado Izquierdo';
        detectedPrice = 15;
      }
      // Roof (Techo)
      else if (pos3D[1] > 1.25) {
        detectedTier = 'body_standard';
        detectedZoneName = 'Techo Panorámico';
        detectedPrice = 15;
      }
      // Standard Body
      else {
        detectedTier = 'body_standard';
        detectedZoneName = 'Carrocería Lateral Estándar';
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
    }
  };

  // Pointer Drag Handlers for Orbit Rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;

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
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
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

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-full bg-neutral-950 flex flex-col overflow-hidden select-none">
      
      {/* 3D Canvas Area */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-crosshair relative flex-1"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-sm text-white">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-2" />
          <span className="text-xs font-mono tracking-wider">Cargando Estudio 3D del Porsche 911...</span>
        </div>
      )}

      {/* Floating Top Help Badge */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-neutral-900/90 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-white text-[11px] font-mono flex items-center gap-2 shadow-lg pointer-events-auto">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Haz clic en cualquier parte del auto para mover tu logo</span>
        </div>

        {activeZoneName && (
          <div className="bg-sky-950/90 backdrop-blur-md border border-sky-500/30 text-sky-300 text-[10px] font-mono px-3 py-1.5 rounded-full shadow-lg hidden sm:flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-sky-400" />
            <span>Zona actual: <strong>{activeZoneName}</strong></span>
          </div>
        )}
      </div>

      {/* Camera View Angle Selector Pills */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-1.5 max-w-[80%]">
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
                position3D: zone.defaultPosition,
                rotation3D: zone.defaultRotation,
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
                position3D: zone.defaultPosition,
                rotation3D: zone.defaultRotation,
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
            const zone = ZONES.find((z) => z.id === 'premium_door');
            if (zone) {
              onUpdateDraftPosition({
                position3D: zone.defaultPosition,
                rotation3D: zone.defaultRotation,
                tier: 'premium_door',
                zoneName: zone.name,
                pricePerCm2: zone.pricePerCm2,
              });
              setActiveZoneName(zone.name);
            }
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

      {/* Floating Zoom & Rotate Tools on Bottom-Right */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5">
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
