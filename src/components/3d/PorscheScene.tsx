import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useSponsors } from '../../context/SponsorContext';
import type { CameraPresetName } from '../../context/SponsorContext';
import { loadRealPorscheModel } from './RealPorscheLoader';
import { createPorscheCarGroup } from './PorscheCarMesh';
import { createSponsorTexture } from './SponsorDecalTexture';
import type { Sponsor } from '../../types/sponsor';
import { RotateCw, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';


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
  const draftDecalMeshRef = useRef<THREE.Mesh | null>(null);
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(4.2, 1.7, 4.2));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.55, 0));
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.55, 0));

  // Orbit control state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 6.2, theta: 0.8, phi: 1.2 });

  // Camera presets
  const getCameraTargets = useCallback((preset: CameraPresetName): { pos: THREE.Vector3; lookAt: THREE.Vector3 } => {
    switch (preset) {
      case 'hood':
        return { pos: new THREE.Vector3(0, 1.7, 3.2), lookAt: new THREE.Vector3(0, 0.55, 1.0) };
      case 'wing':
        return { pos: new THREE.Vector3(0, 1.8, -3.4), lookAt: new THREE.Vector3(0, 1.1, -1.6) };
      case 'door_right':
        return { pos: new THREE.Vector3(3.9, 0.95, 0), lookAt: new THREE.Vector3(0, 0.55, 0) };
      case 'door_left':
        return { pos: new THREE.Vector3(-3.9, 0.95, 0), lookAt: new THREE.Vector3(0, 0.55, 0) };
      case 'front':
        return { pos: new THREE.Vector3(0, 0.85, 4.0), lookAt: new THREE.Vector3(0, 0.45, 0.8) };
      case 'top':
        return { pos: new THREE.Vector3(0.01, 7.0, 0), lookAt: new THREE.Vector3(0, 0.35, 0) };
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

    // 1. Scene in Crisp Gallery White
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8f9fa');
    scene.fog = new THREE.FogExp2('#f8f9fa', 0.028);
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
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Immaculate White Studio Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.1);
    scene.add(ambientLight);

    // Main Overhead Softbox
    const mainSoftbox = new THREE.DirectionalLight('#ffffff', 2.2);
    mainSoftbox.position.set(3, 9, 3);
    mainSoftbox.castShadow = true;
    mainSoftbox.shadow.mapSize.width = 2048;
    mainSoftbox.shadow.mapSize.height = 2048;
    mainSoftbox.shadow.bias = -0.0001;
    scene.add(mainSoftbox);

    // Soft Studio Fill Lights for crisp car reflections
    const studioFillLeft = new THREE.DirectionalLight('#f1f5f9', 1.2);
    studioFillLeft.position.set(-6, 4, 3);
    scene.add(studioFillLeft);

    const studioFillRight = new THREE.DirectionalLight('#ffffff', 1.2);
    studioFillRight.position.set(6, 4, -3);
    scene.add(studioFillRight);

    const studioFillBack = new THREE.DirectionalLight('#e2e8f0', 0.8);
    studioFillBack.position.set(0, 3, -6);
    scene.add(studioFillBack);

    // 5. Seamless Pure White Gallery Floor
    const floorGeo = new THREE.PlaneGeometry(45, 45);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.25,
      metalness: 0.1,
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

    // Load Real Porsche 911 GT3 RS
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

    // 6. Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

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
          camera.position.lerp(targetCameraPosRef.current, 0.05);
          currentLookAtRef.current.lerp(targetLookAtRef.current, 0.05);
          camera.lookAt(currentLookAtRef.current);
        }
      } else {
        camera.lookAt(currentLookAtRef.current);
      }

      if (draftDecalMeshRef.current) {
        const t = clock.getElapsedTime();
        const pulse = 1 + Math.sin(t * 4) * 0.03;
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [getCameraTargets]);

  // Update Body Paint & Wheel finishes
  useEffect(() => {
    const newPaintColor = new THREE.Color(carConfig.bodyColor);
    const newWheelColor = new THREE.Color(carConfig.wheelColor);

    paintMeshesRef.current.forEach((mesh) => {
      if (mesh.material && (mesh.material as THREE.MeshPhysicalMaterial).color) {
        (mesh.material as THREE.MeshPhysicalMaterial).color.copy(newPaintColor);
      }
    });

    wheelMeshesRef.current.forEach((mesh) => {
      if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).color) {
        (mesh.material as THREE.MeshStandardMaterial).color.copy(newWheelColor);
      }
    });
  }, [carConfig]);

  // Render Sponsor Decals
  useEffect(() => {
    if (!decalsGroupRef.current) return;
    const decalsGroup = decalsGroupRef.current;

    while (decalsGroup.children.length > 0) {
      const child = decalsGroup.children[0];
      decalsGroup.remove(child);
    }

    sponsors.forEach((sponsor) => {
      const isHovered = hoveredSponsor?.id === sponsor.id;
      const isFocused = focusedSponsorId === sponsor.id || selectedSponsor?.id === sponsor.id;

      const texture = createSponsorTexture(sponsor, isHovered, isFocused);
      
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: 0.3,
        metalness: 0.1,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });

      const planeGeo = new THREE.PlaneGeometry(1, 0.5);
      const decalMesh = new THREE.Mesh(planeGeo, material);
      
      decalMesh.position.set(...sponsor.position3D);
      decalMesh.rotation.set(...sponsor.rotation3D);
      decalMesh.scale.set(sponsor.scale3D[0], sponsor.scale3D[1], sponsor.scale3D[2]);
      decalMesh.userData = { sponsorId: sponsor.id, sponsorData: sponsor };

      decalsGroup.add(decalMesh);
    });

    if (draftSponsor && draftSponsor.position3D) {
      const draftTexture = createSponsorTexture(draftSponsor, true, true);
      const draftMaterial = new THREE.MeshStandardMaterial({
        map: draftTexture,
        transparent: true,
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color('#d11212'),
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
      });

      const draftGeo = new THREE.PlaneGeometry(1, 0.5);
      const draftMesh = new THREE.Mesh(draftGeo, draftMaterial);
      draftMesh.position.set(...draftSponsor.position3D);
      draftMesh.rotation.set(...(draftSponsor.rotation3D || [0, 0, 0]));
      draftMesh.scale.set(
        draftSponsor.scale3D?.[0] || 1,
        draftSponsor.scale3D?.[1] || 0.5,
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

    if (decalsGroupRef.current) {
      const intersects = raycaster.intersectObjects(decalsGroupRef.current.children, true);
      
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

    if (decalsGroupRef.current) {
      const intersects = raycaster.intersectObjects(decalsGroupRef.current.children, true);
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
        const normal = hit.face?.normal || new THREE.Vector3(0, 1, 0);

        let tier = 'body_standard';
        let zoneName = 'Carrocería Lateral';
        if (point.z < -1.4 && point.y > 1.0) {
          tier = 'vip_wing';
          zoneName = 'Alerón Trasero (VIP)';
        } else if (point.z > 0.8 && point.y > 0.5) {
          tier = 'hood_central';
          zoneName = 'Cofre Aerodinámico';
        } else if (Math.abs(point.x) > 0.6) {
          tier = 'premium_door';
          zoneName = point.x > 0 ? 'Puerta Lateral Derecha' : 'Puerta Lateral Izquierda';
        }

        setDraftSponsor((prev) => ({
          ...prev,
          position3D: [Number(point.x.toFixed(2)), Number(point.y.toFixed(2)), Number(point.z.toFixed(2))],
          rotation3D: [
            normal.z < -0.5 ? -0.1 : 0,
            normal.x > 0.5 ? 1.57 : normal.x < -0.5 ? -1.57 : 0,
            0,
          ],
          scale3D: prev?.scale3D || [0.9, 0.45, 1],
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
    cameraSphericalRef.current.radius = Math.max(2.8, Math.min(10.0, cameraSphericalRef.current.radius * factor));
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
                5 Años
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

      {/* Minimalist White 3D Controls Bar */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1 bg-white/85 backdrop-blur-xl px-2 py-1.5 rounded-full border border-black/10 shadow-lg max-w-[95vw] overflow-x-auto">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
            autoRotate
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <RotateCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
          <span>360°</span>
        </button>

        <div className="h-3 w-px bg-black/10 mx-1" />

        <button
          onClick={() => setCameraPreset('overview')}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
            cameraPreset === 'overview' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          General
        </button>

        <button
          onClick={() => setCameraPreset('wing')}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
            cameraPreset === 'wing' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Alerón
        </button>

        <button
          onClick={() => setCameraPreset('hood')}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
            cameraPreset === 'hood' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Cofre
        </button>

        <button
          onClick={() => setCameraPreset('door_right')}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
            cameraPreset === 'door_right' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Lateral
        </button>

        <button
          onClick={() => setCameraPreset('front')}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
            cameraPreset === 'front' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Frontal
        </button>

        <div className="h-3 w-px bg-black/10 mx-1" />

        <button
          onClick={() => handleZoom('in')}
          className="p-1 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleZoom('out')}
          className="p-1 rounded-full text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
