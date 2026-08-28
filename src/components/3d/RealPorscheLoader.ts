import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { CarCustomization } from '../../context/SponsorContext';

export interface LoadedCarResult {
  group: THREE.Group;
  paintMeshes: THREE.Mesh[];
  wheelMeshes: THREE.Mesh[];
}

export const loadRealPorscheModel = (
  url: string,
  carConfig: CarCustomization,
  onProgress?: (progress: number) => void
): Promise<LoadedCarResult> => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      url,
      (gltf) => {
        const carRoot = gltf.scene;
        carRoot.name = 'real_porsche_911';

        const paintMeshes: THREE.Mesh[] = [];
        const wheelMeshes: THREE.Mesh[] = [];

        // High-End Automotive Clearcoat Paint
        const paintMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(carConfig.bodyColor),
          metalness: 0.85,
          roughness: 0.12,
          clearcoat: 1.0,
          clearcoatRoughness: 0.03,
          reflectivity: 0.95,
          envMapIntensity: 1.5,
        });

        // Ultra-Clear Automotive Glass
        const glassMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#0a0c10'),
          metalness: 0.1,
          roughness: 0.05,
          transmission: 0.92,
          transparent: true,
          opacity: 0.85,
          envMapIntensity: 2.0,
        });

        // Matte Carbon Trim
        const carbonMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#16171a'),
          metalness: 0.5,
          roughness: 0.35,
          envMapIntensity: 1.0,
        });

        // Satin Wheel Finish
        const rimMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(carConfig.wheelColor),
          metalness: 0.9,
          roughness: 0.18,
          envMapIntensity: 1.8,
        });

        // Compute Bounding Box & Normalize Scale
        const box = new THREE.Box3().setFromObject(carRoot);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 4.4 / (maxDim || 1);
        carRoot.scale.setScalar(targetScale);

        // Center on ground
        carRoot.position.x = -center.x * targetScale;
        carRoot.position.y = -box.min.y * targetScale;
        carRoot.position.z = -center.z * targetScale;

        // Traverse & apply materials
        carRoot.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const name = mesh.name.toLowerCase();
            const matName = (Array.isArray(mesh.material) ? mesh.material[0]?.name : mesh.material?.name)?.toLowerCase() || '';

            if (
              name.includes('body') ||
              name.includes('paint') ||
              name.includes('hood') ||
              name.includes('door') ||
              name.includes('bumper') ||
              name.includes('fender') ||
              name.includes('carro') ||
              matName.includes('body') ||
              matName.includes('paint') ||
              matName.includes('red') ||
              matName.includes('primary')
            ) {
              mesh.material = paintMaterial;
              paintMeshes.push(mesh);
            } else if (
              name.includes('glass') ||
              name.includes('window') ||
              name.includes('windshield') ||
              matName.includes('glass')
            ) {
              mesh.material = glassMaterial;
            } else if (
              name.includes('wheel') ||
              name.includes('rim') ||
              matName.includes('wheel') ||
              matName.includes('rim')
            ) {
              mesh.material = rimMaterial;
              wheelMeshes.push(mesh);
            } else if (
              name.includes('carbon') ||
              name.includes('trim') ||
              name.includes('splitter') ||
              name.includes('mirror')
            ) {
              mesh.material = carbonMaterial;
            }
          }
        });

        // Soft Realistic Contact Shadow on White Studio Floor
        const shadowGeo = new THREE.PlaneGeometry(6.2, 6.2);
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const ctx = shadowCanvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 128);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.40)');
          grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.15)');
          grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.03)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 256, 256);
        }
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        });
        const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.y = 0.005;
        carRoot.add(shadowMesh);

        resolve({ group: carRoot, paintMeshes, wheelMeshes });
      },
      (xhr) => {
        if (xhr.total > 0 && onProgress) {
          onProgress(xhr.loaded / xhr.total);
        }
      },
      (error) => {
        console.error('Error loading real Porsche 911 model', error);
        reject(error);
      }
    );
  });
};
