import * as THREE from 'three';

/**
 * Orientation math shared by the decal layer and the surface classifier.
 *
 * A sticker lies flat against the sheet metal (its +Z axis is the surface normal),
 * stays upright with respect to the car, and can then be spun around its own normal.
 */

/**
 * Builds the projector orientation for a decal sitting on `normal`.
 *
 * On vertical panels the sticker stands upright. On roughly horizontal panels
 * (hood, roof, decklid) there is no "up", so it is oriented the way real liveries
 * are: hood and roof graphics read from the front of the car, rear decklid
 * graphics read from behind it — that is what `readFromRear` selects.
 */
export const decalOrientation = (
  normal: THREE.Vector3,
  spinDeg = 0,
  readFromRear = false
): THREE.Quaternion => {
  const n = normal.clone().normalize();

  const reference =
    Math.abs(n.y) > 0.86
      ? new THREE.Vector3(0, 0, readFromRear ? 1 : -1)
      : new THREE.Vector3(0, 1, 0);

  const up = reference.clone().addScaledVector(n, -reference.dot(n));
  if (up.lengthSq() < 1e-8) up.set(0, 0, 1).addScaledVector(n, -n.z);
  up.normalize();

  const right = new THREE.Vector3().crossVectors(up, n).normalize();

  const quaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(right, up, n)
  );

  if (spinDeg) {
    quaternion.premultiply(
      new THREE.Quaternion().setFromAxisAngle(n, THREE.MathUtils.degToRad(spinDeg))
    );
  }

  return quaternion;
};

/** In-plane axes of a decal: `right` along its width, `up` along its height. */
export const decalAxes = (
  normal: THREE.Vector3,
  spinDeg = 0,
  readFromRear = false
): { right: THREE.Vector3; up: THREE.Vector3 } => {
  const quaternion = decalOrientation(normal, spinDeg, readFromRear);
  return {
    right: new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion),
    up: new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion),
  };
};

/** Rotation stored on the sponsor record, kept for backwards compatibility. */
export const orientationToEuler = (
  normal: THREE.Vector3,
  spinDeg = 0,
  readFromRear = false
): [number, number, number] => {
  const euler = new THREE.Euler().setFromQuaternion(
    decalOrientation(normal, spinDeg, readFromRear),
    'YXZ'
  );
  return [euler.x, euler.y, euler.z];
};

/** Recovers the outward normal from a legacy `rotation3D` triple. */
export const eulerToNormal = (
  rotation?: [number, number, number] | null
): THREE.Vector3 | null => {
  if (!rotation) return null;
  const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2], 'YXZ');
  return new THREE.Vector3(0, 0, 1).applyEuler(euler).normalize();
};
