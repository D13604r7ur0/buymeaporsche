import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useSponsors } from '../../context/SponsorContext';
import type { CameraPresetName } from '../../context/SponsorContext';
import { loadRealPorscheModel } from './RealPorscheLoader';
import { createPorscheCarGroup } from './PorscheCarMesh';
import {
  CarSurface,
  DecalLayer,
  orientationToEuler,
  sponsorToDecalItem,
} from './decals';
import type { Sponsor } from '../../types/sponsor';
import { detectSponsorOverlap } from '../../utils/overlapDetection';
import { RotateCw, ZoomIn, ZoomOut, Loader2, MousePointerClick, Plus } from 'lucide-react';



export const PorscheScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    carConfig,
    sponsors,
    hoveredSponsor,
    setHoveredSponsor,
    selectedSponsor,
    setSelectedSponsor,
    focusedSponsorId,
    cameraPreset,
    setCameraPreset,
    isPlacementMode,
    setIsPlacementMode,
    draftSponsor,
    setDraftSponsor,
    setIsBuyModalOpen,
    recordClick,
  } = useSponsors();

  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<{
    sponsor: Sponsor;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupRef = useRef<THREE.Object3D | null>(null);
  const surfaceRef = useRef<CarSurface | null>(null);
  const sponsorLayerRef = useRef<DecalLayer | null>(null);
  const draftLayerRef = useRef<DecalLayer | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const [isSurfaceReady, setIsSurfaceReady] = useState<boolean>(false);

  // Camera Orbit Controls State
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 6.2,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(4.2, 2.2, 4.2));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.45, 0));
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.45, 0));

  // Camera Preset Targets
  const getCameraTargets = useCallback((preset: CameraPresetName) => {
    switch (preset) {
      case 'hood':
        return { pos: new THREE.Vector3(0, 2.3, 3.8), lookAt: new THREE.Vector3(0, 0.65, 1.1) };
      case 'wing':
        return { pos: new THREE.Vector3(0, 2.2, -3.9), lookAt: new THREE.Vector3(0, 0.75, -1.3) };
      case 'door_right':
        return { pos: new THREE.Vector3(4.4, 1.4, 0), lookAt: new THREE.Vector3(0, 0.55, 0) };
      case 'door_left':
        return { pos: new THREE.Vector3(-4.4, 1.4, 0), lookAt: new THREE.Vector3(0, 0.55, 0) };
      case 'front':
        return { pos: new THREE.Vector3(0, 1.2, 4.5), lookAt: new THREE.Vector3(0, 0.5, 0) };
      case 'top':
        return { pos: new THREE.Vector3(0, 6.2, 0.05), lookAt: new THREE.Vector3(0, 0.5, 0) };
      case 'overview':
      default:
        return { pos: new THREE.Vector3(4.2, 2.2, 4.2), lookAt: new THREE.Vector3(0, 0.45, 0) };
    }
  }, []);

  // Update target camera position when preset changes
  useEffect(() => {
    const { pos, lookAt } = getCameraTargets(cameraPreset);
    targetCameraPosRef.current.copy(pos);
    targetLookAtRef.current.copy(lookAt);

    // Update spherical coordinates
    const offset = new THREE.Vector3().subVectors(pos, lookAt);
    const radius = offset.length();
    const phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));
    const theta = Math.atan2(offset.x, offset.z);

    cameraSphericalRef.current = { radius, theta, phi };
  }, [cameraPreset, getCameraTargets]);

  // Main Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. High-Contrast Luxury Automotive Studio Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d14);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.2, 2.2, 4.2);
    cameraRef.current = camera;

    // 3. High-Quality WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. HDR Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    // 5. High-Impact Automotive Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Main Overhead Softbox (Highlights Hood & Rooflines)
    const mainSoftbox = new THREE.DirectionalLight('#ffffff', 3.4);
    mainSoftbox.position.set(6, 12, 8);
    mainSoftbox.castShadow = true;
    mainSoftbox.shadow.mapSize.width = 2048;
    mainSoftbox.shadow.mapSize.height = 2048;
    mainSoftbox.shadow.bias = -0.0001;
    scene.add(mainSoftbox);

    // Rim Backlight (Traces iconic 911 flyline and wide rear hips)
    const rimLight = new THREE.DirectionalLight('#93c5fd', 2.8);
    rimLight.position.set(-8, 9, -7);
    scene.add(rimLight);

    // Side Fill Light (Illuminates Door Panels and Decals)
    const sideFill = new THREE.DirectionalLight('#f8fafc', 1.8);
    sideFill.position.set(7, 5, -4);
    scene.add(sideFill);

    // Front Nose Accent Light
    const frontAccent = new THREE.DirectionalLight('#ffffff', 1.6);
    frontAccent.position.set(0, 3, 7);
    scene.add(frontAccent);

    // 6. Realistic Ambient Occlusion Ground Contact Shadow under Porsche
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const ctx = shadowCanvas.getContext('2d')!;
    const radGrad = ctx.createRadialGradient(256, 256, 30, 256, 256, 240);
    radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    radGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.70)');
    radGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(6.0, 3.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.90,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.005;
    scene.add(shadowMesh);

    // 7. Polished Studio Floor with Soft Gloss Reflections
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0e131d,
      roughness: 0.28,
      metalness: 0.35,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.002;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Subtle Studio Pedestal Perimeter Ring
    const ringGeo = new THREE.RingGeometry(3.6, 3.63, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.004;
    scene.add(ringMesh);

    // Sponsor decals already sold, and the sticker being placed right now.
    const sponsorLayer = new DecalLayer('sponsors_decals_group');
    const draftLayer = new DecalLayer('draft_decal_group');
    scene.add(sponsorLayer.group);
    scene.add(draftLayer.group);
    sponsorLayerRef.current = sponsorLayer;
    draftLayerRef.current = draftLayer;

    // Hotspot Pins container group
    const pinsGroup = new THREE.Group();
    pinsGroup.name = 'sponsors_pins_group';
    pinsGroup.renderOrder = 110;
    scene.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    const attachCar = (group: THREE.Object3D) => {
      if (carGroupRef.current) scene.remove(carGroupRef.current);
      scene.add(group);
      carGroupRef.current = group;

      const surface = CarSurface.fromObject(group);
      surfaceRef.current = surface;
      sponsorLayer.setSurface(surface);
      draftLayer.setSurface(surface);

      setIsLoadingModel(false);
      setIsSurfaceReady(true);
    };

    // Load Real Porsche 911 (992)
    setIsLoadingModel(true);
    loadRealPorscheModel('/models/porsche-911.glb', carConfig)
      .then(({ group }) => attachCar(group))
      .catch((err) => {
        console.warn('Loading fallback procedural Porsche model', err);
        attachCar(createPorscheCarGroup(carConfig));
      });

    // 7. Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (!isDraggingRef.current) {
        if (autoRotate) {
          cameraSphericalRef.current.theta += delta * 0.35;
          const r = cameraSphericalRef.current.radius;
          const theta = cameraSphericalRef.current.theta;
          const phi = cameraSphericalRef.current.phi;

          camera.position.x = r * Math.sin(phi) * Math.sin(theta);
          camera.position.y = r * Math.cos(phi);
          camera.position.z = r * Math.sin(phi) * Math.cos(theta);
          camera.lookAt(targetLookAtRef.current);
        } else {
          camera.position.lerp(targetCameraPosRef.current, 0.06);
          currentLookAtRef.current.lerp(targetLookAtRef.current, 0.06);
          camera.lookAt(currentLookAtRef.current);
        }
      } else {
        camera.lookAt(currentLookAtRef.current);
      }

      // Pulse Hotspot Pins
      if (pinsGroupRef.current) {
        pinsGroupRef.current.children.forEach((pin) => {
          const s = 1 + Math.sin(time * 3.5) * 0.12;
          pin.scale.set(s, s, s);
        });
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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      pmremGenerator.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [getCameraTargets]);

  // Sponsor decals + their hotspot pins. The decal layer snaps every sticker onto
  // the real sheet metal, so stored positions only need to be close to the panel.
  useEffect(() => {
    const sponsorLayer = sponsorLayerRef.current;
    const pinsGroup = pinsGroupRef.current;
    if (!sponsorLayer || !pinsGroup || !isSurfaceReady) return;

    sponsorLayer.sync(
      sponsors.map((sponsor) =>
        sponsorToDecalItem(sponsor, {
          state:
            focusedSponsorId === sponsor.id || selectedSponsor?.id === sponsor.id
              ? 'selected'
              : hoveredSponsor?.id === sponsor.id
                ? 'hover'
                : 'normal',
        })
      )
    );

    while (pinsGroup.children.length > 0) {
      const pin = pinsGroup.children[0] as THREE.Mesh;
      pinsGroup.remove(pin);
      pin.geometry?.dispose();
      (pin.material as THREE.Material)?.dispose();
    }

    sponsors.forEach((sponsor) => {
      const placement = sponsorLayer.getPlacement(sponsor.id);
      if (!placement) return;

      const isFocused = focusedSponsorId === sponsor.id || selectedSponsor?.id === sponsor.id;
      const isHovered = hoveredSponsor?.id === sponsor.id;

      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 16, 16),
        new THREE.MeshBasicMaterial({
          color: isFocused ? 0x00e5ff : isHovered ? 0xffffff : 0x10b981,
          toneMapped: false,
        })
      );
      pin.position.copy(placement.point).addScaledVector(placement.normal, 0.02);
      pin.userData = { sponsorId: sponsor.id, sponsorData: sponsor };
      pinsGroup.add(pin);
    });
  }, [sponsors, hoveredSponsor, focusedSponsorId, selectedSponsor, isSurfaceReady]);

  // Sticker preview while the user is choosing a spot on the car.
  useEffect(() => {
    const draftLayer = draftLayerRef.current;
    if (!draftLayer || !isSurfaceReady) return;

    if (!isPlacementMode || !draftSponsor || !draftSponsor.position3D) {
      draftLayer.sync([]);
      return;
    }

    const overlap = detectSponsorOverlap(draftSponsor, sponsors);
    draftLayer.sync([
      sponsorToDecalItem(draftSponsor, {
        id: 'draft',
        state: overlap.hasOverlap ? 'blocked' : 'draft',
        cutouts: overlap.occupiedMasks,
      }),
    ]);
  }, [draftSponsor, isPlacementMode, sponsors, isSurfaceReady]);

  // Pointer Handlers
  /** Front-most sponsor under the pointer: its decal first, then its hotspot pin. */
  const pickSponsorAt = (ndcX: number, ndcY: number): Sponsor | null => {
    const camera = cameraRef.current;
    if (!camera) return null;

    const ndc = new THREE.Vector2(ndcX, ndcY);

    const decalHit = sponsorLayerRef.current?.pick(ndc, camera);
    if (decalHit?.payload) return decalHit.payload as Sponsor;

    const pinsGroup = pinsGroupRef.current;
    if (pinsGroup) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(pinsGroup.children, false);
      const sponsor = hits[0]?.object.userData?.sponsorData as Sponsor | undefined;
      if (sponsor) return sponsor;
    }

    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraSphericalRef.current.theta -= deltaX * 0.006;
      cameraSphericalRef.current.phi = Math.max(
        0.2,
        Math.min(Math.PI / 2 - 0.05, cameraSphericalRef.current.phi - deltaY * 0.006)
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
      return;
    }

    const sponsor = pickSponsorAt(mouseX, mouseY);

    if (sponsor) {
      setHoveredSponsor(sponsor);
      setActiveTooltip({
        sponsor,
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
      });
      containerRef.current.style.cursor = 'pointer';
      return;
    }

    setHoveredSponsor(null);
    setActiveTooltip(null);
    containerRef.current.style.cursor = isPlacementMode ? 'crosshair' : 'grab';
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Opening an existing sponsor
    if (!isPlacementMode) {
      const sponsor = pickSponsorAt(mouseX, mouseY);
      if (sponsor) {
        setSelectedSponsor(sponsor);
        recordClick(sponsor.id);
      }
      return;
    }

    // Placement mode: drop the sticker exactly where the body was clicked.
    const surface = surfaceRef.current;
    if (!surface) return;

    const hit = surface.raycast(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
    if (!hit) return;

    const widthCm = draftSponsor?.widthCm || 35;
    const heightCm = draftSponsor?.heightCm || 20;
    const zone = surface.zonesUnder(hit, draftSponsor?.rotationAngle || 0, widthCm, heightCm);

    setDraftSponsor((prev) => ({
      ...prev,
      position3D: [
        Number(hit.point.x.toFixed(4)),
        Number(hit.point.y.toFixed(4)),
        Number(hit.point.z.toFixed(4)),
      ],
      rotation3D: orientationToEuler(hit.normal, 0, surface.readsFromRear(hit.point)),
      widthCm,
      heightCm,
      tier: zone.tier,
      zoneName: zone.name,
      pricePerCm2: zone.pricePerCm2,
    }));

    setIsPlacementMode(false);
    setIsBuyModalOpen(true);
  };

  return (
    <div className="relative w-full h-[65vh] sm:h-[75vh] md:h-[82vh] bg-[#0a0d14] flex items-center justify-center overflow-hidden select-none">
      
      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0a0d14]/90 backdrop-blur-md">
          <div className="relative mb-4">
            <Loader2 className="w-10 h-10 animate-spin text-sky-400" />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono text-white">
              911
            </div>
          </div>
          <span className="text-xs font-mono font-medium text-neutral-300 tracking-wider">
            Cargando Porsche 911 (992)...
          </span>
        </div>
      )}

      {/* Placement Mode Top Instruction Banner */}
      {isPlacementMode && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 bg-neutral-900/95 text-white px-4 py-2 rounded-full shadow-2xl border border-sky-400/40 text-xs font-mono flex items-center gap-2 animate-bounce backdrop-blur-md">
          <MousePointerClick className="w-4 h-4 text-emerald-400" />
          <span>Haz clic en la carrocería del Porsche para fijar tu sticker</span>
        </div>
      )}

      {/* Minimalist Floating Tooltip */}
      {activeTooltip && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-150 ease-out"
          style={{ left: activeTooltip.screenX, top: activeTooltip.screenY - 14 }}
        >
          <div className="bg-neutral-900/95 backdrop-blur-xl rounded-xl px-4 py-3 shadow-2xl border border-white/15 text-white min-w-[200px]">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-sky-400">
                {activeTooltip.sponsor.zoneName}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                2 Años
              </span>
            </div>

            <div className="font-sans font-bold text-xs text-white">
              {activeTooltip.sponsor.brandName}
            </div>

            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-white/10 text-[10px] font-mono">
              <span className="text-neutral-400">{activeTooltip.sponsor.areaCm2} cm²</span>
              <span className="text-white font-semibold">${activeTooltip.sponsor.totalPriceMxn.toLocaleString()} MXN</span>
            </div>

            {activeTooltip.sponsor.targetUrl && (
              <div className="pt-1.5 mt-1 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-sky-400 font-semibold">
                <span className="truncate max-w-[130px]">{activeTooltip.sponsor.targetUrl.replace(/^https?:\/\//, '')}</span>
                <span className="text-neutral-400">Clic para abrir ↗</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unified Bottom Floating Dock */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-2.5 max-w-[96vw] w-full sm:w-auto">
        
        {/* Row 1: Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPlacementMode(true)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full text-xs font-mono font-medium border border-white/15 backdrop-blur-xl shadow-xl transition cursor-pointer"
          >
            <MousePointerClick className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Colocar en 3D</span>
            <span className="sm:hidden">Colocar</span>
          </button>

          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#D5001C] hover:bg-[#b00017] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl shadow-red-950/40 transition cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Comprar Espacio · Personalizar Logo</span>
          </button>
        </div>

        {/* Row 2: Camera Presets & 360 View */}
        <div className="flex items-center gap-1.5 bg-[#0c0e15]/95 backdrop-blur-2xl px-2.5 py-1.5 rounded-full border border-white/15 shadow-2xl max-w-full overflow-x-auto text-white">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono transition cursor-pointer shrink-0 ${
              autoRotate ? 'bg-[#D5001C] text-white font-bold' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>360°</span>
          </button>

          <div className="h-3 w-px bg-white/15 mx-1 shrink-0" />

          <button
            onClick={() => setCameraPreset('overview')}
            className={`px-3 py-1 rounded-full text-[11px] font-mono transition cursor-pointer shrink-0 ${
              cameraPreset === 'overview' ? 'bg-white text-neutral-950 font-bold shadow-sm' : 'text-neutral-300 hover:text-white'
            }`}
          >
            General
          </button>

          <button
            onClick={() => setCameraPreset('hood')}
            className={`px-3 py-1 rounded-full text-[11px] font-mono transition cursor-pointer shrink-0 ${
              cameraPreset === 'hood' ? 'bg-white text-neutral-950 font-bold shadow-sm' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Cofre
          </button>

          <button
            onClick={() => setCameraPreset('door_right')}
            className={`px-3 py-1 rounded-full text-[11px] font-mono transition cursor-pointer shrink-0 ${
              cameraPreset === 'door_right' ? 'bg-white text-neutral-950 font-bold shadow-sm' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Lateral
          </button>

          <button
            onClick={() => setCameraPreset('wing')}
            className={`px-3 py-1 rounded-full text-[11px] font-mono transition cursor-pointer shrink-0 ${
              cameraPreset === 'wing' ? 'bg-white text-neutral-950 font-bold shadow-sm' : 'text-neutral-300 hover:text-white'
            }`}
          >
            Trasera
          </button>

          <div className="h-3 w-px bg-white/15 mx-1 shrink-0" />

          {/* Quick Zoom Buttons */}
          <button
            onClick={() => {
              if (cameraRef.current) {
                cameraSphericalRef.current.radius = Math.max(3.2, cameraSphericalRef.current.radius - 0.7);
                const { radius, theta, phi } = cameraSphericalRef.current;
                targetCameraPosRef.current.set(
                  radius * Math.sin(phi) * Math.sin(theta),
                  radius * Math.cos(phi),
                  radius * Math.sin(phi) * Math.cos(theta)
                );
              }
            }}
            className="p-1 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Zoom +"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (cameraRef.current) {
                cameraSphericalRef.current.radius = Math.min(10.0, cameraSphericalRef.current.radius + 0.7);
                const { radius, theta, phi } = cameraSphericalRef.current;
                targetCameraPosRef.current.set(
                  radius * Math.sin(phi) * Math.sin(theta),
                  radius * Math.cos(phi),
                  radius * Math.sin(phi) * Math.cos(theta)
                );
              }
            }}
            className="p-1 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Zoom -"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
