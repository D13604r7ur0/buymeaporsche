import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CAR_LENGTH_WORLD } from './decals/scale';
import { describeCarMesh } from './decals/carSurface';
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
        carRoot.name = 'real_porsche_911_phantom_silhouette';

        const paintMeshes: THREE.Mesh[] = [];
        const wheelMeshes: THREE.Mesh[] = [];

        // Ultra-Clean Translucent Frosted Crystal Silhouette ("Fantasmita")
        const silhouetteBodyMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#ffffff'),
          metalness: 0.08,
          roughness: 0.12,
          transmission: 0.90, // Translucent glass/crystal phantom look
          transparent: true,
          opacity: 0.42,
          ior: 1.48,
          thickness: 0.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
          reflectivity: 0.95,
          envMapIntensity: 2.4,
          side: THREE.FrontSide,
        });

        // Translucent Clear Windows & Windshield
        const silhouetteGlassMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#ffffff'),
          metalness: 0.05,
          roughness: 0.05,
          transmission: 0.96,
          transparent: true,
          opacity: 0.22,
          ior: 1.5,
          envMapIntensity: 2.6,
          side: THREE.FrontSide,
        });

        // Frosted Smoked Wheels, Rims & Calipers
        const silhouetteWheelMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#cbd5e1'),
          metalness: 0.35,
          roughness: 0.25,
          transmission: 0.82,
          transparent: true,
          opacity: 0.48,
          clearcoat: 0.6,
          envMapIntensity: 1.8,
          side: THREE.FrontSide,
        });

        // Frosted Interior & Trim
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
        const targetScale = CAR_LENGTH_WORLD / (maxDim || 1);
        carRoot.scale.setScalar(targetScale);

        // Center on ground
        carRoot.position.x = -center.x * targetScale;
        carRoot.position.y = -box.min.y * targetScale;
        carRoot.position.z = -center.z * targetScale;

        carRoot.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;

          mesh.castShadow = false;
          mesh.receiveShadow = false;

          // The GLB names every mesh `Object_N`; the descriptive information lives
          // in the material name, which is about to be replaced. Keep a copy so the
          // decal system can still tell a door from a windshield.
          const sourceMaterialName = Array.isArray(mesh.material)
            ? mesh.material[0]?.name || ''
            : mesh.material?.name || '';
          mesh.userData.sourceMaterialName = sourceMaterialName;

          // Decal projection needs vertex normals.
          if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();

          const { kind } = describeCarMesh(mesh);

          switch (kind) {
            case 'glass':
            case 'light':
              mesh.material = silhouetteGlassMaterial;
              break;
            case 'wheel':
              mesh.material = silhouetteWheelMaterial;
              wheelMeshes.push(mesh);
              break;
            case 'paint':
              mesh.material = silhouetteBodyMaterial;
              paintMeshes.push(mesh);
              break;
            default:
              mesh.material = silhouetteTrimMaterial;
              break;
          }
        });

        carRoot.updateWorldMatrix(true, true);

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
