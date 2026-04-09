/**
 * Haversine distance between two lat/lng points.
 * Returns distance in miles.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Estimate driving minutes from miles.
 * Assumes ~25 mph average (suburban/neighborhood driving).
 */
export function milesToMinutes(miles: number): number {
  return Math.round((miles / 25) * 60);
}

/**
 * Human-friendly distance label.
 * "2 min away" / "15 min away" / "About 30 min"
 */
export function formatDistance(miles: number): string {
  const mins = milesToMinutes(miles);
  if (mins <= 1) return "Around the corner";
  if (mins <= 5) return `${mins} min away`;
  if (mins <= 15) return `About ${Math.round(mins / 5) * 5} min away`;
  if (mins <= 45) return `About ${Math.round(mins / 5) * 5} min`;
  if (mins <= 90) return `About ${Math.round(mins / 15) * 15} min`;
  return `${Math.round(miles)} mi away`;
}

/**
 * Format distance between two users given their coordinates.
 * Returns null if either user has no location.
 */
export function distanceBetween(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null,
): { label: string; minutes: number; miles: number } | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
    return null;
  }
  const miles = haversineDistance(lat1, lng1, lat2, lng2);
  const minutes = milesToMinutes(miles);
  const label = formatDistance(miles);
  return { label, minutes, miles };
}
