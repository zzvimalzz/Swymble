/**
 * Small spherical-geometry kit for the live transit map: distances,
 * polyline projection, and distance-along-line. Pure functions.
 *
 * Positions are [lon, lat] (GeoJSON order). Distances are metres.
 */

export type LonLat = [number, number];

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance between two points, in metres (haversine). */
export function haversineMeters(a: LonLat, b: LonLat): number {
  const toRad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toRad;
  const dLon = (b[0] - a[0]) * toRad;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(a[1] * toRad) * Math.cos(b[1] * toRad) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Cumulative distance (metres) from the line start to each vertex.
 * `result[0]` is 0; `result[at(line.length - 1)]` is the full length.
 */
export function cumulativeMeters(line: ReadonlyArray<LonLat>): number[] {
  const cumulative = [0];
  for (let i = 1; i < line.length; i += 1) {
    cumulative.push(cumulative[i - 1] + haversineMeters(line[i - 1], line[i]));
  }
  return cumulative;
}

export interface LineProjection {
  /** Index of the segment start vertex the point projects onto. */
  segment: number;
  /** 0..1 position within that segment. */
  t: number;
  /** Distance from line start to the projected point, in metres. */
  alongMeters: number;
  /** Distance from the query point to the line, in metres. */
  offsetMeters: number;
  /** The projected point itself. */
  point: LonLat;
}

/**
 * Projects a point onto a polyline (nearest point across all segments).
 * Uses an equirectangular approximation per segment — accurate to well
 * under a metre at transit scales. Requires `cumulative` from
 * cumulativeMeters(line) so repeat queries don't re-measure the line.
 */
export function projectOntoLine(
  point: LonLat,
  line: ReadonlyArray<LonLat>,
  cumulative: ReadonlyArray<number>,
): LineProjection {
  const toRad = Math.PI / 180;
  const cosLat = Math.cos(point[1] * toRad);
  const px = point[0] * cosLat;
  const py = point[1];

  let best: LineProjection = {
    segment: 0,
    t: 0,
    alongMeters: 0,
    offsetMeters: haversineMeters(point, line[0]),
    point: line[0],
  };

  for (let i = 0; i < line.length - 1; i += 1) {
    const ax = line[i][0] * cosLat;
    const ay = line[i][1];
    const bx = line[i + 1][0] * cosLat;
    const by = line[i + 1][1];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    const t =
      lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
    const projected: LonLat = [line[i][0] + (line[i + 1][0] - line[i][0]) * t, ay + dy * t];
    const offset = haversineMeters(point, projected);
    if (offset < best.offsetMeters) {
      const segmentMeters = cumulative[i + 1] - cumulative[i];
      best = {
        segment: i,
        t,
        alongMeters: cumulative[i] + segmentMeters * t,
        offsetMeters: offset,
        point: projected,
      };
    }
  }
  return best;
}

/** Initial bearing from a to b, degrees clockwise from north (0..360). */
export function bearingDegrees(a: LonLat, b: LonLat): number {
  const toRad = Math.PI / 180;
  const dLon = (b[0] - a[0]) * toRad;
  const lat1 = a[1] * toRad;
  const lat2 = b[1] * toRad;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

/** Smallest absolute angle between two bearings, in degrees (0..180). */
export function bearingDeltaDegrees(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}
