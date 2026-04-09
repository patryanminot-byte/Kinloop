// supabase/functions/calculate-distance/index.ts
// On demand: given two zip codes, return approximate distance and a drive-time label.
// Uses Haversine formula on zip code centroids.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

/** Approximate lat/lng centroids for US zip codes. In production, replace with
 *  a database lookup or geocoding API. This uses a simplified lookup approach. */
const ZIP_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  // This would be populated from a zip code database in production.
  // Example entries for reference:
  "94301": { lat: 37.4419, lng: -122.143 },
  "94025": { lat: 37.4529, lng: -122.1817 },
  "94040": { lat: 37.3861, lng: -122.0839 },
  "94087": { lat: 37.3501, lng: -122.0356 },
  "94305": { lat: 37.4275, lng: -122.1697 },
};

/** Haversine distance in miles between two lat/lng points. */
function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
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

/** Convert distance in miles to a friendly drive-time label. */
function driveTimeLabel(miles: number): string {
  if (miles < 0.5) return "About 2 min away";
  if (miles < 1.5) return "About 5 min away";
  if (miles < 3) return "About 10 min away";
  if (miles < 7) return "About 15 min away";
  return "About 20+ min away";
}

serve(async (req) => {
  const { zip1, zip2 } = await req.json();

  if (!zip1 || !zip2) {
    return new Response(
      JSON.stringify({ error: "Both zip1 and zip2 are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const coord1 = ZIP_CENTROIDS[zip1];
  const coord2 = ZIP_CENTROIDS[zip2];

  if (!coord1 || !coord2) {
    return new Response(
      JSON.stringify({
        error: "Zip code not found in centroid database",
        missing: [!coord1 ? zip1 : null, !coord2 ? zip2 : null].filter(Boolean),
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const distanceMiles = haversineDistanceMiles(
    coord1.lat,
    coord1.lng,
    coord2.lat,
    coord2.lng
  );

  const label = driveTimeLabel(distanceMiles);

  return new Response(
    JSON.stringify({
      zip1,
      zip2,
      distance_miles: Math.round(distanceMiles * 10) / 10,
      drive_time_label: label,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
