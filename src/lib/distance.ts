export type LatLng = readonly [lat: number, lng: number];

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// Straight-line ("as the crow flies") distance between two points, by the
// haversine formula. No external service involved.
export const haversineKm = ([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};
