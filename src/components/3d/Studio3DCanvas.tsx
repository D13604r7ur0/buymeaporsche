import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadRealPorscheModel } from './RealPorscheLoader';
import { createPorscheCarGroup } from './PorscheCarMesh';
import { createSponsorTexture } from './SponsorDecalTexture';
import { calculateSurfaceOrientation, isMeshForbidden, getNearbyPaintMeshes } from './decalHelpers';
import type { Sponsor, SponsorTier } from '../../types/sponsor';
import { ZONES } from '../../utils/sampleData';
import { Loader2, RotateCw, ZoomIn, ZoomOut, Compass, Plus, Minus, RefreshCw, Play, Pause } from 'lucide-react';



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
  cameraViewTrigger?: string;
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
  interactMode: externalInteractMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeZoneName, setActiveZoneName] = useState<string>(draftSponsor.zoneName || 'Cofre Central Frontal');
  const [internalMode] = useState<'moveLogo' | 'orbitCamera'>('moveLogo');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);

  const interactMode = externalInteractMode || internalMode;

  // Ref to avoid stale closures during high-frequency drag events
  const draftSponsorRef = useRef<Partial<Sponsor>>({ ...draftSponsor, rotationAngle });
  draftSponsorRef.current = { ...draftSponsor, rotationAngle };

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const paintMeshesRef = useRef<THREE.Mesh[]>([]);
  const draftDecalGroupRef = useRef<THREE.Group | null>(null);
  const existingDecalsGroupRef = useRef<THREE.Group | null>(null);

  // Interaction State
  const isPointerDownRef = useRef<boolean>(false);

  // Smooth camera position interpolator
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(3.8, 2.2, 4.0));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.45, 0));
  const isTransitioningRef = useRef<boolean>(false);

  // Camera presets
  const setStudioCamera = useCallback((view: 'general' | 'hood' | 'wing' | 'leftDoor' | 'rightDoor' | 'roof' | 'rear') => {
    isTransitioningRef.current = true;
    switch (view) {
      case 'hood':
        targetCamPosRef.current.set(0, 2.2, 3.4);
        targetLookAtRef.current.set(0, 0.65, 1.1);
        break;
      case 'wing':
        targetCamPosRef.current.set(0, 2.0, -3.6);
        targetLookAtRef.current.set(0, 0.85, -1.4);
        break;
      case 'leftDoor':
        targetCamPosRef.current.set(-4.0, 1.3, 0);
        targetLookAtRef.current.set(0, 0.55, 0);
        break;
      case 'rightDoor':
        targetCamPosRef.current.set(4.0, 1.3, 0);
        targetLookAtRef.current.set(0, 0.55, 0);
        break;
      case 'roof':
        targetCamPosRef.current.set(0, 4.8, 0.05);
        targetLookAtRef.current.set(0, 0.5, 0);
        break;
      case 'rear':
        targetCamPosRef.current.set(0, 1.4, -4.0);
        targetLookAtRef.current.set(0, 0.45, -1.2);
        break;
      case 'general':
      default:
        targetCamPosRef.current.set(3.8, 2.2, 4.0);
        targetLookAtRef.current.set(0, 0.45, 0);
        break;
    }
  }, []);

  // Respond to cameraViewTrigger prop changes
  useEffect(() => {
    if (cameraViewTrigger) {
      setStudioCamera(cameraViewTrigger as any);
    }
  }, [cameraViewTrigger, setStudioCamera]);

  // Sync controls with interactMode
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (interactMode === 'orbitCamera') {
      controls.enabled = true;
      controls.enableRotate = true;
      controls.enableZoom = true;
      controls.enablePan = true;
    } else {
      // In moveLogo mode, disable OrbitControls pointer capture completely
      // so dragging the mouse strictly moves the logo across the car without moving the camera/car!
      controls.enabled = false;
    }
  }, [interactMode]);

  // Toggle Auto-Rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [isAutoRotating]);

  // Project DecalGeometry exclusively onto paint body meshes
  const projectDecal = useCallback((
    pos: [number, number, number],
    rot: [number, number, number],
    widthCm: number,
    heightCm: number,
    angleDeg: number,
    targetMesh?: THREE.Mesh
  ) => {
    const draftGroup = draftDecalGroupRef.current;
    if (!draftGroup) return;

    while (draftGroup.children.length > 0) {
      draftGroup.remove(draftGroup.children[0]);
    }

    const position = new THREE.Vector3(...pos);
    const nearby = getNearbyPaintMeshes(paintMeshesRef.current, position, 0.45);
    const meshesToProject = targetMesh 
      ? [targetMesh, ...nearby.filter((m) => m !== targetMesh)]
      : nearby;

    if (meshesToProject.length === 0) return;

    const texture = createSponsorTexture(draftSponsorRef.current, true, true, () => {
      projectDecal(pos, rot, widthCm, heightCm, angleDeg, targetMesh);
    });
    const decalMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    });

    // Construct orientation matrix from base euler + rotation angle around normal
    const baseEuler = new THREE.Euler(...rot, 'YXZ');
    const baseMatrix = new THREE.Matrix4().makeRotationFromEuler(baseEuler);
    const normal = new THREE.Vector3(0, 0, 1).applyMatrix4(baseMatrix).normalize();

    if (angleDeg !== 0) {
      const rotAngleRad = THREE.MathUtils.degToRad(angleDeg);
      const rotMatrix = new THREE.Matrix4().makeRotationAxis(normal, rotAngleRad);
      baseMatrix.premultiply(rotMatrix);
    }

    const finalEuler = new THREE.Euler().setFromRotationMatrix(baseMatrix, 'YXZ');

    const scaleFactor = 0.028;
    const w = (widthCm || 35) * scaleFactor;
    const h = (heightCm || 20) * scaleFactor;
    const d = 0.22;

    const size = new THREE.Vector3(w, h, d);

    // Create DecalGeometry exclusively on valid nearby paint body meshes
    meshesToProject.forEach((mesh) => {
      if (isMeshForbidden(mesh)) return;

      try {
        const decalGeo = new DecalGeometry(mesh, position, finalEuler, size);
        if (decalGeo.attributes.position && decalGeo.attributes.position.count > 0) {
          const decalMesh = new THREE.Mesh(decalGeo, decalMat);
          decalMesh.renderOrder = 100;
          draftGroup.add(decalMesh);
        }
      } catch (err) {
        console.warn('Decal projection error on mesh', err);
      }
    });

    // Fallback plane if DecalGeometry produced empty geometry
    if (draftGroup.children.length === 0) {
      const fallbackGeo = new THREE.PlaneGeometry(w, h);
      const fallbackMesh = new THREE.Mesh(fallbackGeo, decalMat);
      fallbackMesh.position.copy(position);
      fallbackMesh.rotation.copy(finalEuler);
      fallbackMesh.renderOrder = 100;
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

    // Raycast ONLY against exterior paint body meshes
    const validMeshes = paintMeshesRef.current.filter((m) => !isMeshForbidden(m));

    const intersects = raycaster.intersectObjects(validMeshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const point = hit.point;
      const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

      if (hit.object) {
        normal.transformDirection(hit.object.matrixWorld);
      }
      normal.normalize();

      // Directly place onto contact surface point
      const offsetPoint = point.clone().add(normal.clone().multiplyScalar(0.003));

      // Calculate stable, upright coordinate basis for decal surface
      const { right, up, euler } = calculateSurfaceOrientation(normal);
      const rot3D: [number, number, number] = [euler.x, euler.y, euler.z];

      const curW = draftSponsorRef.current?.widthCm || 35;
      const curH = draftSponsorRef.current?.heightCm || 20;
      const curAngle = draftSponsorRef.current?.rotationAngle || rotationAngle || 0;

      const pos3D: [number, number, number] = [
        Number(offsetPoint.x.toFixed(3)),
        Number(offsetPoint.y.toFixed(3)),
        Number(offsetPoint.z.toFixed(3))
      ];

      // Multi-zone proportional calculation: if the sticker spans across 2 or more panels,
      // calculate the exact proportional blended rate of each part touched!
      const scale = 0.010;
      const halfW = (curW * scale) / 2;
      const halfH = (curH * scale) / 2;

      const rotRad = THREE.MathUtils.degToRad(curAngle);
      const rotCos = Math.cos(rotRad);
      const rotSin = Math.sin(rotRad);

      const localRight = right.clone().multiplyScalar(rotCos).add(up.clone().multiplyScalar(rotSin));
      const localUp = up.clone().multiplyScalar(rotCos).sub(right.clone().multiplyScalar(rotSin));

      const center = new THREE.Vector3(...pos3D);
      const samplePoints: { pt: THREE.Vector3; w: number }[] = [
        { pt: center.clone(), w: 0.36 },
        { pt: center.clone().add(localRight.clone().multiplyScalar(halfW * 0.75)), w: 0.16 },
        { pt: center.clone().sub(localRight.clone().multiplyScalar(halfW * 0.75)), w: 0.16 },
        { pt: center.clone().add(localUp.clone().multiplyScalar(halfH * 0.75)), w: 0.16 },
        { pt: center.clone().sub(localUp.clone().multiplyScalar(halfH * 0.75)), w: 0.16 },
      ];

      const classify = (p: THREE.Vector3) => {
        if (p.z < -1.02 && p.y > 0.72) return { name: 'Tapa de Motor Trasera', price: 50, tier: 'rear_decklid' as SponsorTier };
        if (p.z > 0.65 && p.y > 0.60 && Math.abs(p.x) < 0.62) return { name: 'Cofre Central Frontal', price: 45, tier: 'hood_central' as SponsorTier };
        if (p.x < -0.55 && p.y < 1.18 && p.z >= -1.02 && p.z <= 0.65) return { name: 'Puerta Izquierda', price: 35, tier: 'premium_door' as SponsorTier };
        if (p.x > 0.55 && p.y < 1.18 && p.z >= -1.02 && p.z <= 0.65) return { name: 'Puerta Derecha', price: 35, tier: 'premium_door' as SponsorTier };
        if (p.y > 1.20 && Math.abs(p.x) < 0.55 && p.z >= -0.75 && p.z <= 0.45) return { name: 'Techo Panorámico', price: 30, tier: 'body_standard' as SponsorTier };
        if (p.z < -1.40 && p.y <= 0.72) return { name: 'Defensa Trasera', price: 25, tier: 'body_standard' as SponsorTier };
        if (p.z > 1.40 && p.y <= 0.60) return { name: 'Defensa Delantera', price: 25, tier: 'body_standard' as SponsorTier };
        return { name: 'Salpicaderas & Costados', price: 25, tier: 'body_standard' as SponsorTier };
      };

      const zoneWeights: Record<string, { w: number; price: number; name: string; tier: SponsorTier }> = {};
      samplePoints.forEach(({ pt, w }) => {
        const c = classify(pt);
        if (!zoneWeights[c.name]) {
          zoneWeights[c.name] = { w: 0, price: c.price, name: c.name, tier: c.tier };
        }
        zoneWeights[c.name].w += w;
      });

      const totalW = Object.values(zoneWeights).reduce((sum, z) => sum + z.w, 0);
      let blendedPrice = 0;
      const covered: { name: string; pct: number; price: number }[] = [];
      let primaryTier: SponsorTier = 'hood_central';
      let maxWeight = -1;

      for (const [, data] of Object.entries(zoneWeights)) {
        const pct = Math.round((data.w / totalW) * 100);
        blendedPrice += data.price * (data.w / totalW);
        covered.push({ name: data.name, pct, price: data.price });
        if (data.w > maxWeight) {
          maxWeight = data.w;
          primaryTier = data.tier;
        }
      }

      covered.sort((a, b) => b.pct - a.pct);

      let finalZoneName = covered[0]?.name || 'Cofre Central Frontal';
      if (covered.length > 1 && covered[1].pct >= 15) {
        finalZoneName = covered.filter((z) => z.pct >= 15).map((z) => `${z.name} (${z.pct}%)`).join(' + ');
      }

      const finalPricePerCm2 = Math.round(blendedPrice * 100) / 100;

      setActiveZoneName(finalZoneName);

      onUpdateDraftPosition({
        position3D: pos3D,
        rotation3D: rot3D,
        tier: primaryTier,
        zoneName: finalZoneName,
        pricePerCm2: finalPricePerCm2,
      });

      projectDecal(pos3D, rot3D, curW, curH, curAngle, hit.object as THREE.Mesh);
    }
  }, [onUpdateDraftPosition, projectDecal, rotationAngle]);

  // Initialize Three.js Scene with OrbitControls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0c10');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(3.8, 2.2, 4.0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Three.js OrbitControls for Full Freedom Navigation (360 Orbit, Pan, Zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.6;
    controls.maxDistance = 12.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // allow looking slightly up from ground level
    controls.minPolarAngle = 0.02; // top-down bird's eye
    controls.target.set(0, 0.45, 0);
    controlsRef.current = controls;

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

        paintMeshesRef.current = (loaded.paintMeshes || []).filter((m) => !isMeshForbidden(m));
        if (paintMeshesRef.current.length === 0) {
          const meshes: THREE.Mesh[] = [];
          loaded.group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh && !isMeshForbidden(c as THREE.Mesh)) {
              meshes.push(c as THREE.Mesh);
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
          if ((c as THREE.Mesh).isMesh && !isMeshForbidden(c as THREE.Mesh)) {
            meshes.push(c as THREE.Mesh);
          }
        });
        paintMeshesRef.current = meshes;
        setIsLoading(false);
      });

    // Render Animation Loop
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth camera transition when user clicks preset angles
      if (isTransitioningRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.08);
        controls.target.lerp(targetLookAtRef.current, 0.08);

        if (camera.position.distanceTo(targetCamPosRef.current) < 0.05) {
          isTransitioningRef.current = false;
        }
      }

      controls.update();
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
      controls.dispose();
      renderer.dispose();
      pmremGenerator.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Re-project Decal immediately whenever props change
  useEffect(() => {
    if (isLoading || paintMeshesRef.current.length === 0) return;

    const pos = draftSponsor.position3D || [0, 0.96, 1.2];
    const rot = draftSponsor.rotation3D || [-1.25, 0, 0];
    const width = draftSponsor.widthCm || 35;
    const height = draftSponsor.heightCm || 20;
    const angle = rotationAngle || draftSponsor.rotationAngle || 0;

    projectDecal(pos, rot, width, height, angle);
  }, [
    isLoading,
    draftSponsor.position3D,
    draftSponsor.rotation3D,
    draftSponsor.widthCm,
    draftSponsor.heightCm,
    draftSponsor.logoUrl,
    draftSponsor.tier,
    draftSponsor.flipX,
    draftSponsor.flipY,
    draftSponsor.filterStyle,
    draftSponsor.opacity,
    rotationAngle,
    draftSponsor.rotationAngle,
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
      const tex = createSponsorTexture(sponsor, false, false, () => {
        if (tex) tex.needsUpdate = true;
      });
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
        side: THREE.DoubleSide,
      });

      const pos = new THREE.Vector3(...sponsor.position3D);
      const baseEuler = new THREE.Euler(...sponsor.rotation3D, 'YXZ');
      const baseMatrix = new THREE.Matrix4().makeRotationFromEuler(baseEuler);

      if (sponsor.rotationAngle) {
        const normal = new THREE.Vector3(0, 0, 1).applyMatrix4(baseMatrix).normalize();
        const rotAngleRad = THREE.MathUtils.degToRad(sponsor.rotationAngle);
        const rotMatrix = new THREE.Matrix4().makeRotationAxis(normal, rotAngleRad);
        baseMatrix.premultiply(rotMatrix);
      }

      // Extract the exact outward normal of the decal plane
      const outwardNormal = new THREE.Vector3(0, 0, 1).applyMatrix4(baseMatrix).normalize();
      // Push the projection point 10mm outwards to guarantee it is NEVER buried inside the car mesh geometry!
      const offsetPos = pos.clone().add(outwardNormal.multiplyScalar(0.01));

      const finalEuler = new THREE.Euler().setFromRotationMatrix(baseMatrix, 'YXZ');
      const scaleFactor = 0.028;
      const w = (sponsor.widthCm || 35) * scaleFactor;
      const h = (sponsor.heightCm || 20) * scaleFactor;
      const size = new THREE.Vector3(w, h, 0.40);

      const beforeExistingCount = existingGroup.children.length;
      const nearbyMeshes = getNearbyPaintMeshes(paintMeshesRef.current, offsetPos, 0.50);

      nearbyMeshes.forEach((mesh) => {
        if (isMeshForbidden(mesh)) return;

        try {
          const decalGeo = new DecalGeometry(mesh, offsetPos, finalEuler, size);
          if (decalGeo.attributes.position && decalGeo.attributes.position.count > 0) {
            const decalMesh = new THREE.Mesh(decalGeo, mat);
            decalMesh.renderOrder = 100;
            existingGroup.add(decalMesh);
          }
        } catch (err) {
          console.warn('Error placing existing sponsor decal', err);
        }
      });

      if (existingGroup.children.length === beforeExistingCount) {
        const planeGeo = new THREE.PlaneGeometry(w, h);
        const planeMesh = new THREE.Mesh(planeGeo, mat);
        planeMesh.position.copy(offsetPos);
        planeMesh.rotation.copy(finalEuler);
        planeMesh.renderOrder = 100;
        existingGroup.add(planeMesh);
      }
    });
  }, [existingSponsors, isLoading]);

  // Pointer Event Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isTransitioningRef.current = false;
    isPointerDownRef.current = true;

    // Left click in moveLogo mode places/drags logo
    if (e.button === 0 && interactMode === 'moveLogo') {
      placeLogoAtScreenCoord(e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || !containerRef.current) return;

    if (e.buttons === 1 && interactMode === 'moveLogo') {
      placeLogoAtScreenCoord(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
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

  // Direct angle adjustment helper
  const handleQuickRotate = (deltaDeg: number) => {
    if (!onUpdateRotationAngle) return;
    const newAngle = ((rotationAngle + deltaDeg) % 360 + 360) % 360;
    onUpdateRotationAngle(newAngle);
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

      {/* Floating Top Controls: Zone Badge & Auto-Rotate Toggle */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Live Detected Zone Badge */}
        <div className="pointer-events-auto">
          {activeZoneName && (
            <div className="bg-neutral-900/90 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>{activeZoneName}</span>
            </div>
          )}
        </div>

        {/* Auto-Rotate Toggle */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-3 py-2 rounded-2xl text-xs font-mono border transition cursor-pointer flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
              isAutoRotating
                ? 'bg-sky-500 text-white border-sky-400 font-bold'
                : 'bg-neutral-900/90 text-neutral-300 border-white/10 hover:text-white'
            }`}
            title="Auto-Girar Vista 360°"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Auto-Giro 360°</span>
          </button>
        </div>
      </div>

      {/* Camera View Angle Selector Pills */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-1.5 max-w-[60%]">
        <button
          type="button"
          onClick={() => setStudioCamera('general')}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          Vista 360°
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
            const zone = ZONES.find((z) => z.id === 'rear_decklid') || ZONES[0];
            if (zone) {
              onUpdateDraftPosition({
                position3D: [0, 0.98, -1.35],
                rotation3D: [0.15, 0, 0],
                tier: 'rear_decklid',
                zoneName: 'Tapa de Motor & Fascia Trasera',
                pricePerCm2: zone.pricePerCm2,
              });
              setActiveZoneName('Tapa de Motor & Fascia Trasera');
            }
          }}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          🏁 Tapa Trasera
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
              pricePerCm2: 35,
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
              pricePerCm2: 35,
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
              pricePerCm2: 30,
            });
            setActiveZoneName('Techo Panorámico');
          }}
          className="px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-mono transition cursor-pointer backdrop-blur-sm"
        >
          🔲 Techo
        </button>
      </div>

      {/* Floating Scale & Rotation Tools on Bottom-Right */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5">
        
        {/* Quick Rotate Button (+45°) */}
        <button
          type="button"
          onClick={() => handleQuickRotate(45)}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm flex items-center gap-1 text-[10px] font-mono"
          title="Rotar Logo +45°"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          <span>{rotationAngle}°</span>
        </button>

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
          onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.multiplyScalar(0.85);
            }
          }}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm"
          title="Zoom Acercar"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.multiplyScalar(1.15);
            }
          }}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm"
          title="Zoom Alejar"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setStudioCamera('general')}
          className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-white/10 transition cursor-pointer shadow-md backdrop-blur-sm"
          title="Reiniciar Vista 3D"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
