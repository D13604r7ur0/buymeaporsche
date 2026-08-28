import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useSponsors } from '../../context/SponsorContext';
import type { CameraPresetName } from '../../context/SponsorContext';
import { loadRealPorscheModel } from './RealPorscheLoader';
import { createPorscheCarGroup } from './PorscheCarMesh';
import { createSponsorTexture } from './SponsorDecalTexture';
import type { Sponsor } from '../../types/sponsor';
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
  const carGroupRef = useRef<THREE.Group | null>(null);
  const paintMeshesRef = useRef<THREE.Mesh[]>([]);
  const wheelMeshesRef = useRef<THREE.Mesh[]>([]);
  const decalsGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const draftDecalMeshRef = useRef<THREE.Mesh | null>(null);

  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(4.2, 1.7, 4.2));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.55, 0));
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.55, 0));

  // Orbit control state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 6.0, theta: 0.8, phi: 1.2 });

  // Camera presets
  const getCameraTargets = useCallback((preset: CameraPresetName): { pos: THREE.Vector3; lookAt: THREE.Vector3 } => {
    switch (preset) {
      case 'hood':
        return { pos: new THREE.Vector3(0, 1.6, 2.8), lookAt: new THREE.Vector3(0, 0.6, 0.8) };
      case 'wing':
        return { pos: new THREE.Vector3(0, 1.6, -3.2), lookAt: new THREE.Vector3(0, 0.7, -1.2) };
      case 'door_right':
        return { pos: new THREE.Vector3(3.6, 0.95, 0), lookAt: new THREE.Vector3(0, 0.55, 0) };
      case 'door_left':
        return { pos: new THREE.Vector3(-3.6, 0.95, 0), lookAt: new THREE.Vector3(0, 0.55, 0) };
      case 'front':
        return { pos: new THREE.Vector3(0, 0.85, 3.8), lookAt: new THREE.Vector3(0, 0.45, 0.6) };
      case 'top':
        return { pos: new THREE.Vector3(0.01, 6.8, 0), lookAt: new THREE.Vector3(0, 0.35, 0) };
      case 'overview':
      default:
        return { pos: new THREE.Vector3(4.2, 1.7, 4.2), lookAt: new THREE.Vector3(0, 0.55, 0) };
    }
  }, []);

  useEffect(() => {
    const { pos, lookAt } = getCameraTargets(cameraPreset);
    targetCameraPosRef.current.copy(pos);
    targetLookAtRef.current.copy(lookAt);
  }, [cameraPreset, getCameraTargets]);

  // Main Scene Setup
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8f9fa');
    scene.fog = new THREE.FogExp2('#f8f9fa', 0.025);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.2, 1.7, 4.2);
    cameraRef.current = camera;

    // 3. Renderer with ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Photorealistic Studio Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(envScene, 0.04).texture;

    // 5. Studio Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.3);
    scene.add(ambientLight);

    const mainSoftbox = new THREE.DirectionalLight('#ffffff', 2.4);
    mainSoftbox.position.set(3, 9, 3);
    mainSoftbox.castShadow = true;
    mainSoftbox.shadow.mapSize.width = 2048;
    mainSoftbox.shadow.mapSize.height = 2048;
    mainSoftbox.shadow.bias = -0.0001;
    scene.add(mainSoftbox);

    const studioFillLeft = new THREE.DirectionalLight('#f8fafc', 1.4);
    studioFillLeft.position.set(-6, 4, 3);
    scene.add(studioFillLeft);

    const studioFillRight = new THREE.DirectionalLight('#ffffff', 1.4);
    studioFillRight.position.set(6, 4, -3);
    scene.add(studioFillRight);

    // 6. Seamless Pure White Gallery Floor
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.2,
      metalness: 0.05,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.002;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Decals container group
    const decalsGroup = new THREE.Group();
    decalsGroup.name = 'sponsors_decals_group';
    scene.add(decalsGroup);
    decalsGroupRef.current = decalsGroup;

    // Hotspot Pins container group
    const pinsGroup = new THREE.Group();
    pinsGroup.name = 'sponsors_pins_group';
    scene.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    // Load Real Porsche 911 (992)
    setIsLoadingModel(true);
    loadRealPorscheModel('/models/porsche-911.glb', carConfig)
      .then(({ group, paintMeshes, wheelMeshes }) => {
        if (carGroupRef.current) scene.remove(carGroupRef.current);
        scene.add(group);
        carGroupRef.current = group;
        paintMeshesRef.current = paintMeshes;
        wheelMeshesRef.current = wheelMeshes;
        setIsLoadingModel(false);
      })
      .catch((err) => {
        console.warn('Loading fallback procedural Porsche model', err);
        const fallbackGroup = createPorscheCarGroup(carConfig);
        scene.add(fallbackGroup);
        carGroupRef.current = fallbackGroup;
        setIsLoadingModel(false);
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

      // Draft Decal Pulse
      if (draftDecalMeshRef.current) {
        const pulse = 1 + Math.sin(time * 4) * 0.03;
        draftDecalMeshRef.current.scale.set(
          (draftSponsor?.scale3D?.[0] || 1) * pulse,
          (draftSponsor?.scale3D?.[1] || 1) * pulse,
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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      pmremGenerator.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [getCameraTargets]);



  // Render Sponsor Decals & 3D Interactive Hotspot Pins
  useEffect(() => {
    if (!decalsGroupRef.current || !pinsGroupRef.current) return;
    const decalsGroup = decalsGroupRef.current;
    const pinsGroup = pinsGroupRef.current;

    while (decalsGroup.children.length > 0) {
      const child = decalsGroup.children[0];
      decalsGroup.remove(child);
    }

    while (pinsGroup.children.length > 0) {
      const child = pinsGroup.children[0];
      pinsGroup.remove(child);
    }

    sponsors.forEach((sponsor) => {
      const isHovered = hoveredSponsor?.id === sponsor.id;
      const isFocused = focusedSponsorId === sponsor.id || selectedSponsor?.id === sponsor.id;

      const texture = createSponsorTexture(sponsor, isHovered, isFocused);
      
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: 0.25,
        metalness: 0.1,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });

      const planeGeo = new THREE.PlaneGeometry(1, 1);
      const decalMesh = new THREE.Mesh(planeGeo, material);
      
      const baseEuler = new THREE.Euler(...sponsor.rotation3D, 'YXZ');
      const baseMatrix = new THREE.Matrix4().makeRotationFromEuler(baseEuler);

      if (sponsor.rotationAngle) {
        const normal = new THREE.Vector3(0, 0, 1).applyMatrix4(baseMatrix).normalize();
        const rotAngleRad = THREE.MathUtils.degToRad(sponsor.rotationAngle);
        const rotMatrix = new THREE.Matrix4().makeRotationAxis(normal, rotAngleRad);
        baseMatrix.premultiply(rotMatrix);
      }

      const finalEuler = new THREE.Euler().setFromRotationMatrix(baseMatrix, 'YXZ');

      decalMesh.position.set(...sponsor.position3D);
      decalMesh.rotation.copy(finalEuler);
      decalMesh.scale.set(sponsor.scale3D[0], sponsor.scale3D[1], sponsor.scale3D[2]);
      decalMesh.userData = { sponsorId: sponsor.id, sponsorData: sponsor };

      decalsGroup.add(decalMesh);

      // Interactive Glowing Hotspot Pin
      const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: isFocused ? 0x00e5ff : isHovered ? 0xffffff : 0xd5001c,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(
        sponsor.position3D[0],
        sponsor.position3D[1] + 0.05,
        sponsor.position3D[2]
      );
      pinMesh.userData = { sponsorId: sponsor.id, sponsorData: sponsor };
      pinsGroup.add(pinMesh);
    });

    if (draftSponsor && draftSponsor.position3D) {
      const draftTexture = createSponsorTexture(draftSponsor, true, true);
      const draftMaterial = new THREE.MeshStandardMaterial({
        map: draftTexture,
        transparent: true,
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color('#d5001c'),
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
      });

      const draftGeo = new THREE.PlaneGeometry(1, 0.5);
      const draftMesh = new THREE.Mesh(draftGeo, draftMaterial);
      draftMesh.position.set(...draftSponsor.position3D);
      draftMesh.rotation.set(...(draftSponsor.rotation3D || [-1.22, 0, 0]));
      draftMesh.scale.set(
        draftSponsor.scale3D?.[0] || 0.8,
        draftSponsor.scale3D?.[1] || 0.4,
        1
      );
      draftMesh.userData = { isDraft: true };
      draftDecalMeshRef.current = draftMesh;
      decalsGroup.add(draftMesh);
    } else {
      draftDecalMeshRef.current = null;
    }
  }, [sponsors, hoveredSponsor, focusedSponsorId, selectedSponsor, draftSponsor]);

  // Pointer Handlers
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

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const hitTargets: THREE.Object3D[] = [];
    if (decalsGroupRef.current) hitTargets.push(...decalsGroupRef.current.children);
    if (pinsGroupRef.current) hitTargets.push(...pinsGroupRef.current.children);

    if (hitTargets.length > 0) {
      const intersects = raycaster.intersectObjects(hitTargets, true);
      
      if (intersects.length > 0) {
        let hitObject: THREE.Object3D | null = intersects[0].object;
        while (hitObject && !hitObject.userData?.sponsorData && hitObject.parent) {
          hitObject = hitObject.parent;
        }

        if (hitObject?.userData?.sponsorData) {
          const sponsor: Sponsor = hitObject.userData.sponsorData;
          setHoveredSponsor(sponsor);
          setActiveTooltip({
            sponsor,
            screenX: e.clientX - rect.left,
            screenY: e.clientY - rect.top,
          });
          containerRef.current.style.cursor = 'pointer';
          return;
        }
      }
    }

    setHoveredSponsor(null);
    setActiveTooltip(null);
    containerRef.current.style.cursor = isPlacementMode ? 'crosshair' : 'grab';
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const hitTargets: THREE.Object3D[] = [];
    if (decalsGroupRef.current) hitTargets.push(...decalsGroupRef.current.children);
    if (pinsGroupRef.current) hitTargets.push(...pinsGroupRef.current.children);

    if (hitTargets.length > 0) {
      const intersects = raycaster.intersectObjects(hitTargets, true);
      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !hitObj.userData?.sponsorData && hitObj.parent) {
          hitObj = hitObj.parent;
        }

        if (hitObj?.userData?.sponsorData) {
          const sponsor: Sponsor = hitObj.userData.sponsorData;
          setSelectedSponsor(sponsor);
          recordClick(sponsor.id);
          return;
        }
      }
    }

    if (isPlacementMode && carGroupRef.current) {
      const intersects = raycaster.intersectObjects(carGroupRef.current.children, true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const point = hit.point;

        let tier = 'body_standard';
        let zoneName = 'Carrocería & Salpicadera';
        let rot: [number, number, number] = [-1.22, 0, 0];

        if (point.z < -1.2 && point.y > 0.7) {
          tier = 'rear_decklid';
          zoneName = 'Tapa de Motor & Fascia Trasera (VIP)';
          rot = [-1.67, 0, 0];
        } else if (point.z > 0.6 && point.y > 0.5) {
          tier = 'hood_central';
          zoneName = 'Cofre Aerodinámico Central';
          rot = [-1.22, 0, 0];
        } else if (Math.abs(point.x) > 0.6) {
          tier = 'premium_door';
          zoneName = point.x > 0 ? 'Puerta Lateral Derecha' : 'Puerta Lateral Izquierda';
          rot = [0, point.x > 0 ? 1.57 : -1.57, 0];
        }

        setDraftSponsor((prev) => ({
          ...prev,
          position3D: [Number(point.x.toFixed(2)), Number(point.y.toFixed(2)), Number(point.z.toFixed(2))],
          rotation3D: rot,
          scale3D: prev?.scale3D || [0.8, 0.4, 1],
          zoneName,
          tier: tier as any,
        }));

        setIsPlacementMode(false);
        setIsBuyModalOpen(true);
      }
    }
  };

  const handleZoom = (inOut: 'in' | 'out') => {
    const factor = inOut === 'in' ? 0.85 : 1.15;
    cameraSphericalRef.current.radius = Math.max(2.8, Math.min(9.5, cameraSphericalRef.current.radius * factor));
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
    <div className="relative w-full h-full select-none overflow-hidden bg-[#f8f9fa]">
      
      {/* 3D Viewport */}
      <div
        ref={containerRef}
        className="w-full h-full touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      />

      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-30 bg-[#f8f9fa]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-neutral-900 animate-spin" />
          <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
            Cargando Porsche 911 (992)...
          </span>
        </div>
      )}

      {/* Placement Crosshair Mode Indicator */}
      {isPlacementMode && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 bg-neutral-900 text-white px-4 py-2 rounded-full shadow-xl border border-white/20 text-xs font-mono flex items-center gap-2 animate-bounce">
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
          <div className="bg-white/95 backdrop-blur-xl rounded-xl px-4 py-3 shadow-xl border border-black/10 text-neutral-900 min-w-[200px]">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-500">
                {activeTooltip.sponsor.zoneName}
              </span>
              <span className="text-[9px] font-mono text-emerald-600 font-semibold">
                2 Años
              </span>
            </div>

            <div className="font-sans font-semibold text-xs text-neutral-900">
              {activeTooltip.sponsor.brandName}
            </div>

            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-black/5 text-[10px] font-mono">
              <span className="text-neutral-500">{activeTooltip.sponsor.areaCm2} cm²</span>
              <span className="text-neutral-900 font-semibold">${activeTooltip.sponsor.totalPriceMxn.toLocaleString()} MXN</span>
            </div>
          </div>
        </div>
      )}

      {/* Unified Bottom Floating Dock (No Overlaps, Mobile-Optimized) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-2.5 max-w-[96vw] w-full sm:w-auto">
        
        {/* Row 1: Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlacementMode(true)}
            className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-neutral-800 px-3.5 py-2 rounded-full text-xs font-medium border border-black/10 shadow-sm transition cursor-pointer"
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Colocar en 3D</span>
            <span className="sm:hidden">Colocar</span>
          </button>

          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Patrocinar ($1 MXN/cm²)</span>
          </button>
        </div>

        {/* Row 2: Camera Presets & 360 View */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xl px-2 py-1.5 rounded-full border border-black/10 shadow-md max-w-full overflow-x-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer shrink-0 ${
              autoRotate ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>360°</span>
          </button>

          <div className="h-3 w-px bg-black/10 mx-1 shrink-0" />

          <button
            onClick={() => setCameraPreset('overview')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer shrink-0 ${
              cameraPreset === 'overview' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            General
          </button>

          <button
            onClick={() => setCameraPreset('hood')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer shrink-0 ${
              cameraPreset === 'hood' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Cofre
          </button>

          <button
            onClick={() => setCameraPreset('door_right')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer shrink-0 ${
              cameraPreset === 'door_right' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Lateral
          </button>

          <button
            onClick={() => setCameraPreset('wing')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer shrink-0 ${
              cameraPreset === 'wing' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Trasera
          </button>

          <div className="h-3 w-px bg-black/10 mx-1 shrink-0" />

          <button
            onClick={() => handleZoom('in')}
            className="p-1 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer shrink-0"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleZoom('out')}
            className="p-1 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer shrink-0"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
