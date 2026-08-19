/**
 * The liquid neck drawn between two bubbles that are being squeezed together.
 *
 * This is the only instruction the reader ever gets. Nothing on the page says the bubbles can be
 * merged; a skin forming in the crevice the moment two of them are pressed hard is what says it,
 * and it says it before anything irreversible happens.
 *
 * Two overlapping circles already look like two overlapping circles — what makes them read as one
 * body is the *fillet*, the little concave patch that fills the notch where their outlines cross.
 * That is what this builds: at each of the two intersection points, a patch spanning from a point
 * on one circle, bulging outward past the crossing, to a point on the other.
 *
 * Geometry only. It returns path data; the caller owns the SVG, and a test can check the shape
 * without a browser.
 */

export type Circle = { x: number; y: number; r: number };

/** How far around each circle the patch reaches from the crossing point, in radians. Wider looks
 *  like a puddle, narrower like a crack. */
const SWEEP = 0.55;

/** How far past the crossing the patch bulges, as a share of the smaller radius. The lower bound
 *  is what makes a first touch visible at all; strain takes it the rest of the way. */
const BULGE_MIN = 0.3;
const BULGE_MAX = 0.85;

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * The path for the two fillets, or null when there is nothing to draw — the circles are apart, or
 * one has swallowed the other entirely and there is no crossing left to fill.
 *
 * `strain` is 0..1, the same number the squeeze reports: the patch grows as the merge approaches,
 * so the field tells you how close you are without a word of copy.
 */
export function neckPath(a: Circle, b: Circle, strain: number): string | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);

  // Apart, concentric, or one inside the other: no crossing, no notch, nothing to fill.
  if (distance === 0 || distance >= a.r + b.r || distance <= Math.abs(a.r - b.r)) return null;

  // Standard circle-circle intersection: `along` is how far down the centre line the crossing
  // chord sits, `half` is half that chord.
  const along = (distance * distance + a.r * a.r - b.r * b.r) / (2 * distance);
  const half = Math.sqrt(Math.max(0, a.r * a.r - along * along));
  if (half === 0) return null;

  const ux = dx / distance;
  const uy = dy / distance;
  const baseX = a.x + ux * along;
  const baseY = a.y + uy * along;

  const clamped = Math.min(1, Math.max(0, strain));
  const bulge = Math.min(a.r, b.r) * (BULGE_MIN + (BULGE_MAX - BULGE_MIN) * clamped);

  const patches = [1, -1].map((side) => {
    // The crossing point on this side, on the boundary of both circles.
    const pointX = baseX - uy * half * side;
    const pointY = baseY + ux * half * side;

    // Backed off around each circle, away from the overlap — one patch edge per circle.
    const fromA = Math.atan2(pointY - a.y, pointX - a.x);
    const fromB = Math.atan2(pointY - b.y, pointX - b.x);
    const edgeAX = a.x + Math.cos(fromA + SWEEP * side) * a.r;
    const edgeAY = a.y + Math.sin(fromA + SWEEP * side) * a.r;
    const edgeBX = b.x + Math.cos(fromB - SWEEP * side) * b.r;
    const edgeBY = b.y + Math.sin(fromB - SWEEP * side) * b.r;

    // Pushed out along the bisector of the two surface normals, which at a crossing points
    // straight out of the notch whatever the two radii are.
    const outX = (pointX - a.x) / a.r + (pointX - b.x) / b.r;
    const outY = (pointY - a.y) / a.r + (pointY - b.y) / b.r;
    const outLength = Math.hypot(outX, outY) || 1;
    const controlX = pointX + (outX / outLength) * bulge;
    const controlY = pointY + (outY / outLength) * bulge;

    return `M${round(edgeAX)} ${round(edgeAY)}Q${round(controlX)} ${round(controlY)} ${round(edgeBX)} ${round(edgeBY)}L${round(pointX)} ${round(pointY)}Z`;
  });

  return patches.join('');
}

/**
 * The outer curve alone, with the closing edge left off.
 *
 * The filled patch is closed back through the crossing point, and that closing line runs *under*
 * the two bubbles. Their background is not quite opaque, so stroking the closed shape leaves two
 * faint lines showing through the circles. The visible edge is drawn separately instead.
 */
export function neckEdge(a: Circle, b: Circle, strain: number): string | null {
  const filled = neckPath(a, b, strain);
  if (!filled) return null;
  // Same construction, minus the `L…Z` that closes each patch.
  return filled.replace(/L-?[\d.]+ -?[\d.]+Z/g, '');
}
