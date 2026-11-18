import { PlaceCoordinates } from './place';

const EARTH_RADIUS_METERS = 6_371_000;

/** Average walking speed used for estimates: 4.8 km/h. */
export const WALKING_METERS_PER_MINUTE = 80;

/** Streets are not straight lines: real walking distance is longer. */
export const WALKING_DETOUR_FACTOR = 1.3;

/** A place the user searched for or their current position. */
export interface SearchLocation {
  readonly name: string;
  /** Context to tell places apart, for example `Andalucía, España`. */
  readonly detail: string;
  readonly coordinates: PlaceCoordinates;
  readonly countryCode?: string;
}

export function distanceMeters(from: PlaceCoordinates, to: PlaceCoordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Estimated walking distance between two points, including street detours. */
export function walkingMeters(from: PlaceCoordinates, to: PlaceCoordinates): number {
  return distanceMeters(from, to) * WALKING_DETOUR_FACTOR;
}

/** Estimated walking time in whole minutes (at least 1 when there is any distance). */
export function walkingMinutes(meters: number): number {
  return meters <= 0 ? 0 : Math.max(1, Math.round(meters / WALKING_METERS_PER_MINUTE));
}

export function isValidCoordinates(value: unknown): value is PlaceCoordinates {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const { latitude, longitude } = value as Record<string, unknown>;
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}
