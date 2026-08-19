/**
 * A small 2D rigid-body solver: boxes and circles, with rotation.
 *
 * The bubble field's own solver (bubblePhysics.ts) is circles with no angular motion, which is all
 * a drifting field needs. Gravity mode drops the *page* — the wordmark, the nav links, the
 * headings, the footer — and a heading that falls without tumbling reads as a bug, so this one
 * carries orientation, angular velocity and real contact manifolds.
 *
 * Deliberately pure, like its sibling: no DOM, no rAF, no React. Everything below is arithmetic
 * that can be run 600 times in a test without a browser.
 *
 * The approach is the standard sequential-impulse one: integrate, find contacts, then run several
 * passes of impulses over those contacts until the velocities agree with each other. It is not a
 * general-purpose engine — no joints, no continuous collision, no sleeping islands — and it does
 * not need to be. It needs a dozen rectangles to fall convincingly and then stop.
 */

export type Vec = { x: number; y: number };

export type Body = {
  id: string;
  shape: 'box' | 'circle';
  /** Centre of mass, in stage pixels. */
  x: number;
  y: number;
  /** Half-width and half-height for a box; both equal the radius for a circle. */
  hw: number;
  hh: number;
  /** Orientation in radians. */
  angle: number;
  vx: number;
  vy: number;
  /** Angular velocity, radians per second. */
  av: number;
  /** Zero for immovable bodies — the floor, and anything pinned. */
  invMass: number;
  invInertia: number;
  restitution: number;
  friction: number;
  /** Bodies only collide with others on the same layer. The deck's background cards fall on their
   *  own layer so they drift through the pile behind it rather than shouldering it around — they
   *  are scenery, several metres back, and should behave like it. Walls apply to every layer. */
  layer?: number;
  /** Consecutive frames this body has been barely moving. A pile creeps for a long time at speeds
   *  too low to see, and freezing on a single slow frame would catch bodies at the top of a
   *  bounce, so it takes a run of them. */
  still?: number;
};

export type World = {
  width: number;
  /** Sideways gravity. Non-zero inside a tilted container, where "down" for the contents is the
   *  screen's down expressed in the container's own frame. */
  gravityX?: number;
  /** The ceiling. Non-zero when the world is the visible part of a scrolling page: everything has
   *  to stay on screen, so the field is closed at the top as well as the bottom. */
  top?: number;
  /** The floor, measured from the same origin as `top`. */
  height: number;
  /** Pixels per second squared. Earth is ~9.8 m/s²; on a page that reads as sluggish, so this is
   *  tuned by eye rather than by physics. */
  gravity: number;
};

/** Frames can be arbitrarily long. Integrating a 2-second gap in one go puts everything through
 *  the floor before a single contact is found. */
export const MAX_DT = 1 / 30;

/** How much of the remaining overlap is corrected per frame. All of it fights the solver and
 *  makes stacks jitter; none of it lets them sink. */
const CORRECTION = 0.5;

/** Overlap this small is left alone, so resting contacts stop twitching. */
const SLOP = 0.25;

/** Below these a body is treated as stopped, which is what lets a pile settle instead of
 *  shivering forever. */
const SLEEP_LINEAR = 16;
const SLEEP_ANGULAR = 0.3;

/** Frames below those thresholds before a body is put to sleep — a third of a second. */
const SLEEP_FRAMES = 20;

/** Below this approach speed a contact does not bounce at all. Gravity re-drives a resting box
 *  into the floor every single frame, and bouncing on that — however slightly — is what makes a
 *  settled pile hum and shiver instead of sitting still. */
const RESTITUTION_THRESHOLD = 140;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** A box's four corners in world space. */
export const cornersOf = (body: Body): Vec[] => {
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  const dx = [-body.hw, body.hw, body.hw, -body.hw];
  const dy = [-body.hh, -body.hh, body.hh, body.hh];

  return dx.map((ox, index) => ({
    x: body.x + ox * cos - dy[index] * sin,
    y: body.y + ox * sin + dy[index] * cos,
  }));
};

/** Makes a body with sensible mass for its size. Density is arbitrary but consistent, so a big
 *  heading shoves a small nav link out of the way rather than the other way round. */
export const makeBody = (init: Partial<Body> & Pick<Body, 'id' | 'x' | 'y' | 'hw' | 'hh'>): Body => {
  const shape = init.shape ?? 'box';
  const density = 0.00022;
  const area = shape === 'circle' ? Math.PI * init.hw * init.hw : init.hw * init.hh * 4;
  const mass = init.invMass === 0 ? 0 : area * density;
  const inertia =
    mass === 0
      ? 0
      : shape === 'circle'
        ? 0.5 * mass * init.hw * init.hw
        : (mass * (init.hw * init.hw * 4 + init.hh * init.hh * 4)) / 12;

  return {
    shape,
    angle: 0,
    vx: 0,
    vy: 0,
    av: 0,
    restitution: 0.24,
    friction: 0.42,
    ...init,
    invMass: init.invMass ?? (mass === 0 ? 0 : 1 / mass),
    invInertia: init.invInertia ?? (inertia === 0 ? 0 : 1 / inertia),
  };
};

type Contact = {
  a: Body;
  b: Body | null;
  /** Points from a towards b. */
  nx: number;
  ny: number;
  depth: number;
  point: Vec;
};

/** Sub-steps per frame. Each one re-detects contacts, and re-detection is what keeps a stack
 *  standing: correcting three frames' worth of penetration from a depth measured before any of it
 *  was resolved is how the middle box of a pile ends up buried in the floor. */
const SUBSTEPS = 3;

export type StepOptions = {
  /**
   * The body under the pointer, where the pointer is, and *where on the body it was grabbed* — the
   * anchor, in the body's own unrotated frame.
   *
   * The anchor is what makes these feel like objects rather than cursors. The hand pulls at that
   * point, and a pull applied off-centre is also a torque, so a word taken by its corner swings
   * around the cursor. Held bodies used to be teleported to the pointer, which made every one of
   * them rigidly upright and impossible to spin.
   */
  held?: { id: string; x: number; y: number; anchorX?: number; anchorY?: number } | null;
  iterations?: number;
};

/** How hard the hand pulls, as a fraction of the remaining gap closed per second. Below ~14 an
 *  object lags behind the cursor like treacle; above ~30 it snaps and stops reading as physical. */
const GRAB_STIFFNESS = 24;

/** Ceiling on the hand's speed, px/s. Without it, flicking across the screen in a single frame
 *  launches the object at a few thousand px/s and it ricochets off everything. */
const GRAB_MAX_SPEED = 3800;

/** One frame. Returns a new array; the input is never mutated. */
export function stepWorld(bodies: readonly Body[], world: World, dt: number, options: StepOptions = {}): Body[] {
  const stepDt = Math.min(Math.max(dt, 0), MAX_DT);
  let next = bodies.map((body) => ({ ...body }));
  if (stepDt === 0) return next;

  const iterations = options.iterations ?? 8;
  const held = options.held ?? null;

  for (let sub = 0; sub < SUBSTEPS; sub += 1) {
    next = substep(next, world, stepDt / SUBSTEPS, iterations, held);
  }

  if (held) {
    // A held body never sleeps, or letting go of one you had been holding still would leave it
    // hanging in the air.
    const after = next.find((body) => body.id === held.id);
    if (after) after.still = 0;
  }

  for (const body of next) {
    if (body.invMass === 0) continue;

    clampIntoWorld(body, world);

    const slow = Math.hypot(body.vx, body.vy) < SLEEP_LINEAR && Math.abs(body.av) < SLEEP_ANGULAR;
    body.still = slow ? (body.still ?? 0) + 1 : 0;

    if ((body.still ?? 0) >= SLEEP_FRAMES) {
      body.vx = 0;
      body.vy = 0;
      body.av = 0;
    }
  }

  return next;
}

/** Integrate, find every contact, then argue about the velocities until they agree. */
function substep(
  bodies: Body[],
  world: World,
  dt: number,
  iterations: number,
  held: { id: string; x: number; y: number; anchorX?: number; anchorY?: number } | null,
): Body[] {
  const next = bodies;

  for (const body of next) {
    if (body.invMass === 0) continue;
    body.vx += (world.gravityX ?? 0) * dt;
    body.vy += world.gravity * dt;
    // A whisper of drag, so nothing accelerates forever and a settled pile actually settles.
    body.vx *= 0.999;
    body.av *= 0.995;
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    body.angle += body.av * dt;
  }

  // The hand, applied at the point the body was actually grabbed. Before the contacts, so a body
  // dragged into the floor is still stopped by it rather than pushed through.
  if (held) {
    const grabbed = next.find((body) => body.id === held.id);
    if (grabbed) pullTowards(grabbed, held, dt);
  }

  const contacts: Contact[] = [];
  for (const body of next) {
    if (body.invMass === 0) continue;
    contacts.push(...wallContacts(body, world));
  }
  for (let i = 0; i < next.length; i += 1) {
    for (let j = i + 1; j < next.length; j += 1) {
      if (next[i].invMass === 0 && next[j].invMass === 0) continue;
      if ((next[i].layer ?? 0) !== (next[j].layer ?? 0)) continue;
      contacts.push(...pairContacts(next[i], next[j]));
    }
  }

  for (let pass = 0; pass < iterations; pass += 1) {
    for (const contact of contacts) solveContact(contact, pass === 0);
  }

  // A box resting flat on the floor makes four corner contacts, and each one used to correct the
  // whole overlap — so it was shoved up four times as far as it had sunk, fell back, and hummed
  // there forever. Each body's share is divided by how many contacts it is party to.
  const contactCount = new Map<string, number>();
  const count = (body: Body | null) => {
    if (!body) return;
    contactCount.set(body.id, (contactCount.get(body.id) ?? 0) + 1);
  };
  for (const contact of contacts) {
    count(contact.a);
    count(contact.b);
  }

  for (let pass = 0; pass < 2; pass += 1) {
    for (const contact of contacts) correctPosition(contact, contactCount);
  }

  return next;
}

/**
 * The last word on where a body may be.
 *
 * Contacts resolve overlap a fraction at a time and leave a few pixels of penetration under load,
 * which is invisible against a floor and very visible when the floor is the edge of the screen.
 * This is a hard clamp of the body's *rotated* bounding box into the world, applied after
 * everything else has had its say.
 */
function clampIntoWorld(body: Body, world: World) {
  const cos = Math.abs(Math.cos(body.angle));
  const sin = Math.abs(Math.sin(body.angle));
  const halfWidth = body.shape === 'circle' ? body.hw : body.hw * cos + body.hh * sin;
  const halfHeight = body.shape === 'circle' ? body.hw : body.hw * sin + body.hh * cos;
  const ceiling = world.top ?? 0;

  const minX = Math.min(halfWidth, world.width / 2);
  const maxX = Math.max(minX, world.width - halfWidth);
  if (body.x < minX) body.x = minX;
  else if (body.x > maxX) body.x = maxX;

  const minY = ceiling + Math.min(halfHeight, (world.height - ceiling) / 2);
  const maxY = Math.max(minY, world.height - halfHeight);
  if (body.y < minY) body.y = minY;
  else if (body.y > maxY) body.y = maxY;
}

/** True once everything has stopped moving — what the loop uses to stop drawing frames. */
export const worldAtRest = (bodies: readonly Body[]): boolean =>
  bodies.every((body) => body.invMass === 0 || (body.still ?? 0) >= SLEEP_FRAMES);

/**
 * The floor and the two side walls, as contacts rather than as a position clamp.
 *
 * A clamp would stop a body leaving the stage but would never make it topple: a heading landing on
 * one corner has to be pushed at that corner, not at its centre, or it lands flat like a sticker.
 */
function wallContacts(body: Body, world: World): Contact[] {
  const found: Contact[] = [];
  const points = body.shape === 'circle' ? [{ x: body.x, y: body.y }] : cornersOf(body);
  const radius = body.shape === 'circle' ? body.hw : 0;

  const ceiling = world.top ?? 0;

  for (const point of points) {
    const below = point.y + radius - world.height;
    if (below > 0) found.push({ a: body, b: null, nx: 0, ny: 1, depth: below, point });

    const above = ceiling - (point.y - radius);
    if (above > 0) found.push({ a: body, b: null, nx: 0, ny: -1, depth: above, point });

    const left = world.width * 0 - (point.x - radius);
    if (left > 0) found.push({ a: body, b: null, nx: -1, ny: 0, depth: left, point });

    const right = point.x + radius - world.width;
    if (right > 0) found.push({ a: body, b: null, nx: 1, ny: 0, depth: right, point });
  }

  return found;
}

function pairContacts(a: Body, b: Body): Contact[] {
  if (a.shape === 'circle' && b.shape === 'circle') return circleCircle(a, b);
  if (a.shape === 'circle') return circleBox(a, b, false);
  if (b.shape === 'circle') return circleBox(b, a, true);
  return boxBox(a, b);
}

function circleCircle(a: Body, b: Body): Contact[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  const overlap = a.hw + b.hw - distance;
  if (overlap <= 0) return [];

  const nx = distance === 0 ? 1 : dx / distance;
  const ny = distance === 0 ? 0 : dy / distance;
  return [
    {
      a,
      b,
      nx,
      ny,
      depth: overlap,
      point: { x: a.x + nx * a.hw, y: a.y + ny * a.hw },
    },
  ];
}

/** Circle against an oriented box, solved in the box's own frame where it is axis-aligned. */
function circleBox(circle: Body, box: Body, flipped: boolean): Contact[] {
  const cos = Math.cos(box.angle);
  const sin = Math.sin(box.angle);
  const dx = circle.x - box.x;
  const dy = circle.y - box.y;
  const localX = dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;

  const closestX = clamp(localX, -box.hw, box.hw);
  const closestY = clamp(localY, -box.hh, box.hh);
  let normalX = localX - closestX;
  let normalY = localY - closestY;
  let distance = Math.hypot(normalX, normalY);

  if (distance > circle.hw) return [];

  if (distance === 0) {
    // Centre inside the box: push out through the nearest face.
    const toX = box.hw - Math.abs(localX);
    const toY = box.hh - Math.abs(localY);
    if (toX < toY) {
      normalX = Math.sign(localX) || 1;
      normalY = 0;
      distance = -toX;
    } else {
      normalX = 0;
      normalY = Math.sign(localY) || 1;
      distance = -toY;
    }
  } else {
    normalX /= distance;
    normalY /= distance;
  }

  // Back into world space. The normal points from the box towards the circle.
  const worldNx = normalX * cos - normalY * sin;
  const worldNy = normalX * sin + normalY * cos;
  const contactX = box.x + (closestX * cos - closestY * sin);
  const contactY = box.y + (closestX * sin + closestY * cos);
  const depth = circle.hw - distance;

  // Contacts are stored with the normal pointing from `a` to `b`.
  return flipped
    ? [{ a: box, b: circle, nx: worldNx, ny: worldNy, depth, point: { x: contactX, y: contactY } }]
    : [{ a: circle, b: box, nx: -worldNx, ny: -worldNy, depth, point: { x: contactX, y: contactY } }];
}

/**
 * Box against box by the separating-axis theorem: four candidate axes (two per box), the one with
 * the least overlap wins, and the incident face is clipped against the reference face to give one
 * or two contact points.
 *
 * Two points is what lets a rectangle lie flat instead of see-sawing on a single point forever.
 */
function boxBox(a: Body, b: Body): Contact[] {
  const axes = [...faceAxes(a), ...faceAxes(b)];
  let best = { depth: Infinity, nx: 0, ny: 0 };

  for (const axis of axes) {
    const overlap = overlapOnAxis(a, b, axis);
    if (overlap === null) return [];
    if (overlap.depth < best.depth) best = { depth: overlap.depth, nx: overlap.nx, ny: overlap.ny };
  }

  if (best.depth === Infinity) return [];

  // Contact points: the vertices of each box that lie inside the other, which for a shallow
  // overlap is exactly the pair that should carry the impulse.
  const points: Vec[] = [];
  for (const corner of cornersOf(b)) if (pointInBox(corner, a)) points.push(corner);
  for (const corner of cornersOf(a)) if (pointInBox(corner, b)) points.push(corner);

  if (points.length === 0) {
    points.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }

  // More than two points means both boxes are deeply interpenetrating; the two furthest apart
  // describe the contact best.
  const chosen = points.length <= 2 ? points : [points[0], points[points.length - 1]];

  return chosen.map((point) => ({
    a,
    b,
    nx: best.nx,
    ny: best.ny,
    depth: best.depth / chosen.length,
    point,
  }));
}

function faceAxes(body: Body): Vec[] {
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  return [
    { x: cos, y: sin },
    { x: -sin, y: cos },
  ];
}

function overlapOnAxis(a: Body, b: Body, axis: Vec): { depth: number; nx: number; ny: number } | null {
  const projectionA = project(a, axis);
  const projectionB = project(b, axis);
  const left = projectionB.max - projectionA.min;
  const right = projectionA.max - projectionB.min;
  if (left <= 0 || right <= 0) return null;

  // The normal always points from a towards b. `right` is the overlap when b sits on the +axis
  // side of a, so that case takes +axis — getting this backwards pushes overlapping boxes into
  // each other instead of apart, and a stack collapses into one pile on the floor.
  return right < left
    ? { depth: right, nx: axis.x, ny: axis.y }
    : { depth: left, nx: -axis.x, ny: -axis.y };
}

function project(body: Body, axis: Vec) {
  const points = body.shape === 'circle' ? [{ x: body.x, y: body.y }] : cornersOf(body);
  let min = Infinity;
  let max = -Infinity;
  for (const point of points) {
    const value = point.x * axis.x + point.y * axis.y;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (body.shape === 'circle') {
    min -= body.hw;
    max += body.hw;
  }
  return { min, max };
}

/**
 * Is this point inside this body?
 *
 * Exported because grabbing cannot be left to the DOM: the pieces of a fallen page overlap, a
 * bubble is a square element with a round face, and the footer's own box sits on top of whatever
 * has landed on it. Asking the *simulation* what is under the pointer answers all three at once.
 */
export const pointInBody = (point: Vec, body: Body): boolean =>
  body.shape === 'circle'
    ? Math.hypot(point.x - body.x, point.y - body.y) <= body.hw
    : pointInBox(point, body);

/** Roughly how much of the screen a body covers — used to prefer a small word over the big box
 *  it happens to be lying on. */
export const areaOf = (body: Body): number =>
  body.shape === 'circle' ? Math.PI * body.hw * body.hw : body.hw * body.hh * 4;

function pointInBox(point: Vec, box: Body): boolean {
  const cos = Math.cos(box.angle);
  const sin = Math.sin(box.angle);
  const dx = point.x - box.x;
  const dy = point.y - box.y;
  const localX = dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;
  return Math.abs(localX) <= box.hw + 0.001 && Math.abs(localY) <= box.hh + 0.001;
}

/**
 * The hand, as a joint rather than a teleport.
 *
 * The grab point is fixed in the body's own frame and pulled towards the pointer by an impulse
 * applied *at that point*. Off-centre, that impulse is also a torque — which is the whole reason a
 * word grabbed by its corner swings around the cursor instead of gliding along rigidly upright.
 */
function pullTowards(
  body: Body,
  held: { x: number; y: number; anchorX?: number; anchorY?: number },
  dt: number,
) {
  if (body.invMass === 0 || dt <= 0) return;

  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  const localX = held.anchorX ?? 0;
  const localY = held.anchorY ?? 0;
  // The grab point, rotated with the body.
  const rx = localX * cos - localY * sin;
  const ry = localX * sin + localY * cos;
  const anchorX = body.x + rx;
  const anchorY = body.y + ry;

  // The velocity the grab point would need to close the gap this step, softened and capped.
  const pull = Math.min(1, GRAB_STIFFNESS * dt);
  let desiredX = ((held.x - anchorX) / dt) * pull;
  let desiredY = ((held.y - anchorY) / dt) * pull;
  const desiredSpeed = Math.hypot(desiredX, desiredY);
  if (desiredSpeed > GRAB_MAX_SPEED) {
    desiredX = (desiredX / desiredSpeed) * GRAB_MAX_SPEED;
    desiredY = (desiredY / desiredSpeed) * GRAB_MAX_SPEED;
  }

  // What the grab point is doing right now, rotation included.
  const currentX = body.vx - body.av * ry;
  const currentY = body.vy + body.av * rx;

  // Effective mass at the anchor, per axis. The cross terms are dropped: this is a hand, not a
  // load-bearing joint, and the diagonal approximation is stable and cheap.
  const massX = body.invMass + ry * ry * body.invInertia;
  const massY = body.invMass + rx * rx * body.invInertia;
  const impulseX = massX > 0 ? (desiredX - currentX) / massX : 0;
  const impulseY = massY > 0 ? (desiredY - currentY) / massY : 0;

  applyImpulse(body, impulseX, impulseY, rx, ry);
}

/** One pass of impulses at one contact: bounce along the normal, then friction across it. */
function solveContact(contact: Contact, firstPass: boolean) {
  const { a, b } = contact;
  const rax = contact.point.x - a.x;
  const ray = contact.point.y - a.y;
  const rbx = b ? contact.point.x - b.x : 0;
  const rby = b ? contact.point.y - b.y : 0;

  // Velocity of each body *at the contact point*, which is where rotation enters the picture.
  const vax = a.vx - a.av * ray;
  const vay = a.vy + a.av * rax;
  const vbx = b ? b.vx - b.av * rby : 0;
  const vby = b ? b.vy + b.av * rbx : 0;

  const rvx = vbx - vax;
  const rvy = vby - vay;
  const along = rvx * contact.nx + rvy * contact.ny;
  if (along > 0) return;

  const raCrossN = rax * contact.ny - ray * contact.nx;
  const rbCrossN = b ? rbx * contact.ny - rby * contact.nx : 0;
  const invMassSum =
    a.invMass +
    (b ? b.invMass : 0) +
    raCrossN * raCrossN * a.invInertia +
    (b ? rbCrossN * rbCrossN * b.invInertia : 0);
  if (invMassSum === 0) return;

  // Restitution only on the pass that first sees the impact: applying it every pass pumps energy
  // into a resting stack and the pile hums.
  const restitution =
    firstPass && -along > RESTITUTION_THRESHOLD
      ? Math.min(a.restitution, b ? b.restitution : a.restitution)
      : 0;
  const j = (-(1 + restitution) * along) / invMassSum;

  applyImpulse(a, -j * contact.nx, -j * contact.ny, rax, ray);
  if (b) applyImpulse(b, j * contact.nx, j * contact.ny, rbx, rby);

  // Friction along the tangent, clamped by Coulomb's law so a box slides rather than sticks.
  const tx = -contact.ny;
  const ty = contact.nx;
  const alongTangent = rvx * tx + rvy * ty;
  const raCrossT = rax * ty - ray * tx;
  const rbCrossT = b ? rbx * ty - rby * tx : 0;
  const tangentMassSum =
    a.invMass +
    (b ? b.invMass : 0) +
    raCrossT * raCrossT * a.invInertia +
    (b ? rbCrossT * rbCrossT * b.invInertia : 0);
  if (tangentMassSum === 0) return;

  const friction = Math.min(a.friction, b ? b.friction : a.friction);
  const jt = clamp(-alongTangent / tangentMassSum, -Math.abs(j) * friction, Math.abs(j) * friction);

  applyImpulse(a, -jt * tx, -jt * ty, rax, ray);
  if (b) applyImpulse(b, jt * tx, jt * ty, rbx, rby);
}

function applyImpulse(body: Body, ix: number, iy: number, rx: number, ry: number) {
  if (body.invMass === 0) return;
  body.vx += ix * body.invMass;
  body.vy += iy * body.invMass;
  body.av += (rx * iy - ry * ix) * body.invInertia;
}

/** Pushes overlapping bodies apart. Velocity alone never quite closes the gap, and without this
 *  a stack sinks into itself a pixel at a time. */
function correctPosition(contact: Contact, contactCount: Map<string, number>) {
  const { a, b } = contact;
  const total = a.invMass + (b ? b.invMass : 0);
  if (total === 0 || contact.depth <= SLOP) return;

  const amount = ((contact.depth - SLOP) / total) * CORRECTION;
  const shareA = amount / Math.max(1, contactCount.get(a.id) ?? 1);
  a.x -= contact.nx * shareA * a.invMass;
  a.y -= contact.ny * shareA * a.invMass;

  if (b) {
    const shareB = amount / Math.max(1, contactCount.get(b.id) ?? 1);
    b.x += contact.nx * shareB * b.invMass;
    b.y += contact.ny * shareB * b.invMass;
  }
}
