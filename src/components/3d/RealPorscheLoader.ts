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
  _carConfig: CarCustomization,
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
        carRoot.name = 'real_porsche_911_silhouette';

        const paintMeshes: THREE.Mesh[] = [];
        const wheelMeshes: THREE.Mesh[] = [];

        // Ultra-Clean Translucent Crystal Frosted Silhouette Material
        const silhouetteBodyMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#ffffff'),
          metalness: 0.1,
          roughness: 0.15,
          transmission: 0.92, // Glass-like translucency
          transparent: true,
          opacity: 0.38, // Translucent silhouette so car shape is clear
          ior: 1.48,
          thickness: 0.6,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          reflectivity: 0.9,
          envMapIntensity: 2.2,
          side: THREE.FrontSide,
        });

        // Translucent Clear Glass
        const silhouetteGlassMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#ffffff'),
          metalness: 0.05,
          roughness: 0.05,
          transmission: 0.96,
          transparent: true,
          opacity: 0.22,
          ior: 1.5,
          envMapIntensity: 2.5,
          side: THREE.FrontSide,
        });

        // Frosted Smoked Wheels & Trim
        const silhouetteWheelMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#cbd5e1'),
          metalness: 0.3,
          roughness: 0.25,
          transmission: 0.85,
          transparent: true,
          opacity: 0.45,
          clearcoat: 0.5,
          envMapIntensity: 1.8,
          side: THREE.FrontSide,
        });

        const silhouetteTrimMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#94a3b8'),
          metalness: 0.2,
          roughness: 0.3,
          transmission: 0.80,
          transparent: true,
          opacity: 0.35,
          envMapIntensity: 1.5,
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

        // Traverse & apply transparent silhouette materials
        carRoot.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = false; // No heavy shadow to maintain pure crystal look
            mesh.receiveShadow = false;

            const name = mesh.name.toLowerCase();
            const matName = (Array.isArray(mesh.material) ? mesh.material[0]?.name : mesh.material?.name)?.toLowerCase() || '';

            if (
              name.includes('glass') ||
              name.includes('window') ||
              name.includes('windshield') ||
              matName.includes('glass')
            ) {
              mesh.material = silhouetteGlassMaterial;
            } else if (
              name.includes('wheel') ||
              name.includes('rim') ||
              name.includes('tire') ||
              matName.includes('wheel') ||
              matName.includes('rim') ||
              matName.includes('tire')
            ) {
              mesh.material = silhouetteWheelMaterial;
              wheelMeshes.push(mesh);
            } else if (
              name.includes('carbon') ||
              name.includes('trim') ||
              name.includes('splitter') ||
              name.includes('mirror') ||
              name.includes('interior')
            ) {
              mesh.material = silhouetteTrimMaterial;
            } else {
              // Body Panels (Cofre, Puertas, Salpicaderas, Techo, Alerón)
              mesh.material = silhouetteBodyMaterial;
              paintMeshes.push(mesh);
            }
          }
        });

        // Subtle Refined Ground Glow Reflection
        const shadowGeo = new THREE.PlaneGeometry(6.4, 6.4);
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const ctx = shadowCanvas.getContext('2d');
        if (ctx) {
          const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 128);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.20)');
          grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.08)');
          grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.01)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 256, 256);
        }
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          opacity: 0.6,
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
