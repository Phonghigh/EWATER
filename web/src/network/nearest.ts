import type { FeatureCollection } from "geojson";

/** Approximate planar distance in metres - fine at this city scale (a few km across). */
function distanceMetres(a: [number, number], b: [number, number]): number {
  const R = 111_320; // metres per degree latitude
  const dLat = (a[1] - b[1]) * R;
  const dLng = (a[0] - b[0]) * R * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/** Nearest manhole muid to a point, by straight-line distance. */
export function nearestManhole(manholes: FeatureCollection, point: [number, number]): string | null {
  let bestId: string | null = null;
  let bestDist = Infinity;
  for (const f of manholes.features) {
    if (f.geometry.type !== "Point") continue;
    const d = distanceMetres(point, f.geometry.coordinates as [number, number]);
    if (d < bestDist) {
      bestDist = d;
      bestId = String((f.properties as Record<string, unknown>).muid);
    }
  }
  return bestId;
}
