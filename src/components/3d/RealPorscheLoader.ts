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
        const targetScale = 4.4 / (maxDim || 1);
        carRoot.scale.setScalar(targetScale);

        // Center on ground
        carRoot.position.x = -center.x * targetScale;
        carRoot.position.y = -box.min.y * targetScale;
        carRoot.position.z = -center.z * targetScale;

        // Traverse & apply phantom crystal materials
        carRoot.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = false;
            mesh.receiveShadow = false;

            const name = mesh.name.toLowerCase();
            const matName = (Array.isArray(mesh.material) ? mesh.material[0]?.name : mesh.material?.name)?.toLowerCase() || '';

            if (
              name.includes('glass') ||
              name.includes('window') ||
              name.includes('windshield') ||
              name.includes('windscreen') ||
              name.includes('cristal') ||
              name.includes('vidrio') ||
              name.includes('light') ||
              name.includes('headlight') ||
              name.includes('taillight') ||
              name.includes('lamp') ||
              name.includes('faro') ||
              name.includes('calavera') ||
              name.includes('lens') ||
              name.includes('reflector') ||
              name.includes('signal') ||
              name.includes('turn') ||
              name.includes('indicator') ||
              name.includes('led') ||
              name.includes('fog') ||
              name.includes('stop') ||
              name.includes('drl') ||
              name.includes('optic') ||
              matName.includes('glass') ||
              matName.includes('window') ||
              matName.includes('windshield') ||
              matName.includes('lights') ||
              matName.includes('light') ||
              matName.includes('lamp') ||
              matName.includes('lens')
            ) {
              mesh.material = silhouetteGlassMaterial;
            } else if (
              name.includes('wheel') ||
              name.includes('rim') ||
              name.includes('tire') ||
              name.includes('tyre') ||
              name.includes('brake') ||
              name.includes('caliper') ||
              name.includes('disc') ||
              name.includes('rotor') ||
              name.includes('hub') ||
              name.includes('rueda') ||
              name.includes('llanta') ||
              name.includes('rin') ||
              matName.includes('wheel') ||
              matName.includes('rim') ||
              matName.includes('tire') ||
              matName.includes('tyre') ||
              matName.includes('brake')
            ) {
              mesh.material = silhouetteWheelMaterial;
              wheelMeshes.push(mesh);
            } else if (
              name.includes('carbon') ||
              name.includes('trim') ||
              name.includes('splitter') ||
              name.includes('mirror') ||
              name.includes('interior') ||
              name.includes('seat') ||
              name.includes('steering') ||
              name.includes('chassis') ||
              name.includes('engine')
            ) {
              mesh.material = silhouetteTrimMaterial;
            } else {
              // Body Panels ONLY (Cofre, Puertas, Salpicaderas, Techo, Fascias)
              mesh.material = silhouetteBodyMaterial;
              paintMeshes.push(mesh);
            }
          }
        });

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
