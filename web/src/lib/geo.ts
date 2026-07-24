/** Small geographic math helpers for the GIS map's measurement tools
 *  (P2-03) - no turf/maplibre-gl-draw dependency added for 2 formulas. */

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two [lng, lat] points, in meters. */
export function haversineDistanceM(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Sum of consecutive-vertex distances along a polyline, in meters. */
export function polylineLengthM(points: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineDistanceM(points[i - 1], points[i]);
  return total;
}

/** Approximate polygon area in m² - projects [lng, lat] to a local
 *  equirectangular plane centered on the polygon's own vertices (accurate
 *  enough for the small (city-block scale) areas this tool measures, not
 *  meant for large/continental polygons). Shoelace formula on the
 *  projected coordinates. */
export function polygonAreaM2(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const latRef = points.reduce((s, p) => s + p[1], 0) / points.length;
  const mPerDegLng = 111320 * Math.cos(toRad(latRef));
  const mPerDegLat = 110540;
  const projected = points.map(([lng, lat]) => [lng * mPerDegLng, lat * mPerDegLat]);
  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const [x1, y1] = projected[i];
    const [x2, y2] = projected[(i + 1) % projected.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

/** Simple average-of-vertices centroid — good enough for placing a marker
 *  near the middle of a small cluster polygon (P2-03's flood zones, a
 *  handful of vertices from a convex hull), not a true area-weighted
 *  polygon centroid for irregular/large shapes. */
export function polygonCentroid(points: [number, number][]): [number, number] {
  const n = points.length;
  const sum = points.reduce((acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat], [0, 0]);
  return [sum[0] / n, sum[1] / n];
}
