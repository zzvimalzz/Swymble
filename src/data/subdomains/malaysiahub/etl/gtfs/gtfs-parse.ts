/**
 * Minimal GTFS text parsing: RFC 4180 CSV (quoted fields, embedded commas)
 * and a Douglas-Peucker polyline simplifier. Pure functions, unit-tested.
 */

/** Parses one CSV line honouring double-quoted fields. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

/**
 * Parses a GTFS CSV file into row objects keyed by the header line.
 * Handles BOM, CRLF, and blank trailing lines.
 */
export function parseGtfsCsv(text: string): Array<Record<string, string>> {
  const bomFree = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = bomFree.split(/\r?\n/);
  const headerLine = lines.shift();
  if (!headerLine) return [];
  const headers = parseCsvLine(headerLine).map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];
  for (const line of lines) {
    if (!line) continue;
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

export type LonLat = [number, number];

/** Squared perpendicular distance from p to segment a–b (degrees²). */
function segmentDistanceSq(p: LonLat, a: LonLat, b: LonLat): number {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

/**
 * Douglas-Peucker simplification. `tolerance` is in degrees (~1e-5 ≈ 1 m
 * near the equator); endpoints are always kept.
 */
export function simplifyLine(coords: LonLat[], tolerance: number): LonLat[] {
  if (coords.length <= 2) return coords;
  const toleranceSq = tolerance * tolerance;
  const keep = new Uint8Array(coords.length);
  keep[0] = 1;
  keep[coords.length - 1] = 1;

  const stack: Array<[number, number]> = [[0, coords.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    let maxDistSq = 0;
    let index = 0;
    for (let i = first + 1; i < last; i += 1) {
      const distSq = segmentDistanceSq(coords[i], coords[first], coords[last]);
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        index = i;
      }
    }
    if (maxDistSq > toleranceSq) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return coords.filter((_, i) => keep[i] === 1);
}

/** Rounds to 5 dp (~1 m) and removes consecutive duplicate points. */
export function compactLine(coords: LonLat[]): LonLat[] {
  const out: LonLat[] = [];
  for (const [lon, lat] of coords) {
    const point: LonLat = [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5];
    const prev = out[out.length - 1];
    if (!prev || prev[0] !== point[0] || prev[1] !== point[1]) out.push(point);
  }
  return out;
}
