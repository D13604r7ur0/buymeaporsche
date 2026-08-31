/**
 * Single source of truth for the centimeter <-> Three.js world unit conversion.
 *
 * The GLB is authored in meters (4.492 m long) and `RealPorscheLoader` normalizes
 * it so that its longest dimension measures `CAR_LENGTH_WORLD` units. Every module
 * that turns a sticker size in cm into world units MUST use these helpers, otherwise
 * decals, collision detection and pricing drift apart.
 */

/** Real length of a Porsche 911 (992) in centimeters. */
export const CAR_LENGTH_CM = 452;

/** World units the loader normalizes the car length to. */
export const CAR_LENGTH_WORLD = 4.4;

/** ≈ 0.00973 world units per centimeter. */
export const WORLD_PER_CM = CAR_LENGTH_WORLD / CAR_LENGTH_CM;

/** ≈ 102.7 centimeters per world unit. */
export const CM_PER_WORLD = CAR_LENGTH_CM / CAR_LENGTH_WORLD;

export const cmToWorld = (cm: number): number => cm * WORLD_PER_CM;

export const worldToCm = (units: number): number => units * CM_PER_WORLD;
