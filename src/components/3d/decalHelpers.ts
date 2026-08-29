import * as THREE from 'three';

/**
 * Calculates a robust, upright, non-mirrored coordinate basis (right, up, normal)
 * for placing decals onto car body surfaces without distortion or upside-down text.
 */
export function calculateSurfaceOrientation(normal: THREE.Vector3): {
  right: THREE.Vector3;
  up: THREE.Vector3;
  normal: THREE.Vector3;
  euler: THREE.Euler;
} {
  const norm = normal.clone().normalize();
  let right = new THREE.Vector3();
  let up = new THREE.Vector3();

  if (norm.y > 0.55) {
    // Top surfaces: Hood, Roof, Spoiler/Wing top
    // +X is car's right, -Z is towards rear
    const rightRef = new THREE.Vector3(1, 0, 0);
    right = rightRef.clone().sub(norm.clone().multiplyScalar(rightRef.dot(norm))).normalize();
    up = new THREE.Vector3().crossVectors(norm, right).normalize();
  } else if (norm.y < -0.55) {
    // Underbody fallback
    const rightRef = new THREE.Vector3(1, 0, 0);
    right = rightRef.clone().sub(norm.clone().multiplyScalar(rightRef.dot(norm))).normalize();
    up = new THREE.Vector3().crossVectors(norm, right).normalize();
  } else if (Math.abs(norm.x) > Math.abs(norm.z)) {
    // Side surfaces (Doors, Fenders)
    const worldUp = new THREE.Vector3(0, 1, 0);
    up = worldUp.clone().sub(norm.clone().multiplyScalar(worldUp.dot(norm))).normalize();
    if (norm.x > 0) {
      // Right side of car (+X): right points towards front (+Z)
      right = new THREE.Vector3().crossVectors(up, norm).normalize();
    } else {
      // Left side of car (-X): right points towards rear (-Z)
      right = new THREE.Vector3().crossVectors(up, norm).normalize();
    }
  } else {
    // Front and Rear Bumpers / Fascias
    const worldUp = new THREE.Vector3(0, 1, 0);
    up = worldUp.clone().sub(norm.clone().multiplyScalar(worldUp.dot(norm))).normalize();
    if (norm.z > 0) {
      // Front Bumper (+Z): right points towards passenger side (+X)
      right = new THREE.Vector3().crossVectors(up, norm).normalize();
    } else {
      // Rear Bumper (-Z): right points towards driver side (-X)
      right = new THREE.Vector3().crossVectors(up, norm).normalize();
    }
  }

  // Ensure right-handed orthonormal basis
  const checkNormal = new THREE.Vector3().crossVectors(right, up);
  if (checkNormal.dot(norm) < 0) {
    right.negate();
  }

  const rotMatrix = new THREE.Matrix4().makeBasis(right, up, norm);
  const euler = new THREE.Euler().setFromRotationMatrix(rotMatrix, 'YXZ');

  return { right, up, normal: norm, euler };
}

/**
 * Strictly filters out wheels, tires, brakes, calipers, interiors, seats, and glass.
 */
export function isMeshForbidden(mesh: THREE.Mesh): boolean {
  if (!mesh || !mesh.name) return false;
  const name = mesh.name.toLowerCase();
  
  let matName = '';
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      matName = mesh.material.map((m) => m.name || '').join(' ').toLowerCase();
    } else {
      matName = (mesh.material.name || '').toLowerCase();
    }
  }

  const forbiddenWords = [
    'wheel', 'tire', 'tyre', 'rim', 'brake', 'caliper', 'disc', 'rotor', 'hub', 'nut',
    'interior', 'seat', 'steering', 'dashboard', 'pedal', 'carpet', 'gear',
    'glass', 'window', 'windshield', 'light', 'lamp', 'lens', 'mirror_glass', 'emblem', 'badge'
  ];

  return forbiddenWords.some((w) => name.includes(w) || matName.includes(w));
}

/**
 * Returns nearby paint meshes sorted by proximity to prevent decal distortion across distant panels.
 */
export function getNearbyPaintMeshes(
  meshes: THREE.Mesh[],
  position: THREE.Vector3,
  maxDistance = 0.4
): THREE.Mesh[] {
  const valid = meshes.filter((m) => !isMeshForbidden(m));
  if (valid.length <= 1) return valid;

  const withDist = valid.map((m) => {
    const box = new THREE.Box3().setFromObject(m);
    return { mesh: m, dist: box.distanceToPoint(position) };
  });

  withDist.sort((a, b) => a.dist - b.dist);
  const filtered = withDist.filter((item) => item.dist <= maxDistance).map((item) => item.mesh);
  
  return filtered.length > 0 ? filtered : [withDist[0].mesh];
}
