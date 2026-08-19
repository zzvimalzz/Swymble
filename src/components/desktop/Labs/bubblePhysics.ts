/**
 * The bubble field's solver: circles, equal mass, no rotation.
 *
 * Deliberately pure — no DOM, no rAF, no React. The whole point is that the behaviour a reader
 * feels (bubbles that never overlap, never escape the stage, come to rest when left alone, and
 * keep the direction you throw them) is provable in vitest rather than by staring at a page.
 * BubbleField.tsx owns the loop and the pixels; everything here is arithmetic.
 *
 * n is 7, so the pair pass is 21 checks a frame. There is no spatial index and there should not
 * be one until the lab roster is an order of magnitude bigger.
 */

export type Bubble = {
  id: string;
  /** Centre, in stage pixels. */
  x: number;
  y: number;
  /** Velocity, in stage pixels per second. */
  vx: number;
  vy: number;
  r: number;
};

export type Bounds = { width: number; height: number };

/** A box the bubbles are not allowed inside — the page's own headings, measured from the DOM.
 *  Stage coordinates, same as the bubbles. */
export type Rect = { x: number; y: number; width: number; height: number };

export type StepOptions = {
  /** Velocity retained per second of simulated time. Below 1, the field settles. */
  drag?: number;
  /** Bounce energy kept on a wall or a neighbour, 0..1. */
  restitution?: number;
  /** Speed cap, px/s — a hard throw should not put a bubble through a wall in one frame. */
  maxSpeed?: number;
  /** The bubble under the pointer. It is kinematic: it goes exactly where the pointer is, shoves
   *  its neighbours, and is never shoved back. */
  heldId?: string | null;
  heldTo?: { x: number; y: number } | null;
  /** Solid boxes on the page: the title, the subtitle, the open card. */
  obstacles?: readonly Rect[];
  /** The idle drift. `time` is seconds since the field started — passing it in rather than
   *  reading a clock is what keeps this function pure and its tests reproducible. */
  wander?: { time: number; strength?: number } | null;
};

export const DEFAULTS = {
  drag: 0.55,
  restitution: 0.7,
  maxSpeed: 2200,
  /** px/s². Against the default drag this settles at roughly 40px/s — a drift you notice only
   *  if you watch, which is the point. */
  wanderStrength: 24,
} as const;

/** Frames can be arbitrarily long (a backgrounded tab, a slow paint). Integrating a 2-second gap
 *  in one go tunnels every bubble through the walls, so the step is clamped instead. */
export const MAX_DT = 1 / 30;

/** How much velocity a bubble under press keeps each frame. A tenth: enough that a shove still
 *  reads as a shove, little enough that nothing can be pumped between two immovable things. */
const GRIP = 0.1;

/** How fast a bubble leaves a box that appeared on top of it, px/s. Enough to clear the edge in
 *  a few frames, not so much that the specimen card looks like it fired something. */
const EVICT_SPEED = 150;

const clampSpeed = (bubble: Bubble, maxSpeed: number) => {
  const speed = Math.hypot(bubble.vx, bubble.vy);
  if (speed <= maxSpeed || speed === 0) return;
  const scale = maxSpeed / speed;
  bubble.vx *= scale;
  bubble.vy *= scale;
};

/** One frame. Returns a new array; the input is never mutated. */
export function step(
  bubbles: readonly Bubble[],
  bounds: Bounds,
  dt: number,
  options: StepOptions = {},
): Bubble[] {
  const drag = options.drag ?? DEFAULTS.drag;
  const restitution = options.restitution ?? DEFAULTS.restitution;
  const maxSpeed = options.maxSpeed ?? DEFAULTS.maxSpeed;
  const heldId = options.heldId ?? null;
  const stepDt = Math.min(Math.max(dt, 0), MAX_DT);

  const next = bubbles.map((bubble) => ({ ...bubble }));
  if (stepDt === 0) return next;

  // Where everything was before this frame moved it. An obstacle is resolved against the side a
  // bubble *came from*, not the nearest edge — otherwise dragging one into the top of a heading
  // pops it out of the bottom, which reads as a teleport.
  const previous = next.map((bubble) => ({ x: bubble.x, y: bubble.y }));

  // Framerate-independent damping: the same wall-clock second costs the same energy at 30fps
  // and at 144fps, which a naive per-frame multiply does not give you.
  const damping = Math.pow(drag, stepDt);

  const wander = options.wander ?? null;
  const wanderStrength = wander?.strength ?? DEFAULTS.wanderStrength;

  // Whatever the held bubble is already touching, from the positions this frame started at.
  //
  // This is the field's only friction, and without it nothing can be pressed against anything.
  // A bubble being pushed into a barrier is corrected out of it every frame, `kickFromBarriers`
  // cannot tell that correction apart from a barrier moving into it, and the bubble is fired away
  // at up to the kick cap — pushing one against the nav sent it across the page at 400px/s. The
  // drift did the rest: 40px/s is plenty to walk a contact off its normal and let a bubble squirt
  // out sideways.
  //
  // Worked out here rather than passed in, because a caller could only know about a contact one
  // frame after it happened, and by then the bubble has already gone.
  const holder = heldId ? next.find((bubble) => bubble.id === heldId) : undefined;
  const pressed = new Set<string>();
  if (holder) {
    for (const bubble of next) {
      if (bubble.id === heldId) continue;
      if (Math.hypot(bubble.x - holder.x, bubble.y - holder.y) < bubble.r + holder.r) pressed.add(bubble.id);
    }
  }

  for (const [index, bubble] of next.entries()) {
    if (bubble.id === heldId) {
      if (options.heldTo) {
        const startX = bubble.x;
        const startY = bubble.y;
        // Walked to the pointer in short hops rather than snapped to it. Snapping lets a bubble
        // cross a heading in one frame: it sticks to the top edge while the pointer is inside the
        // box, then reappears underneath the moment the pointer comes out the other side. Hopping
        // makes it slide along the obstacle and go around, which is what a held thing should do.
        sweepTo(bubble, options.heldTo, options.obstacles ?? [], bounds);
        // The distance it actually covered becomes its velocity, so letting go mid-drag throws it
        // at the speed your hand was going — and letting go against a wall does not fire it off.
        bubble.vx = (bubble.x - startX) / stepDt;
        bubble.vy = (bubble.y - startY) / stepDt;
        clampSpeed(bubble, maxSpeed);
      }
      continue;
    }

    if (wander && !pressed.has(bubble.id)) {
      // Each bubble pushes in its own slowly turning direction. Two irrational-ish rates mean the
      // seven never fall into step with each other, and no randomness is involved, so a test can
      // run the same field twice and get the same answer.
      //
      // A bubble under press is exempt: the drift is only ~40px/s, and that is more than enough
      // to walk a contact off its normal and let the bubble escape the squeeze.
      const angle = index * 2.399963229728653 + wander.time * (0.21 + index * 0.017);
      bubble.vx += Math.cos(angle) * wanderStrength * stepDt;
      bubble.vy += Math.sin(angle) * wanderStrength * stepDt;
    }

    bubble.vx *= damping;
    bubble.vy *= damping;
    clampSpeed(bubble, maxSpeed);
    bubble.x += bubble.vx * stepDt;
    bubble.y += bubble.vy * stepDt;
  }

  // Where each bubble sat before the barriers had their say. The difference is how far a *moving*
  // barrier — the floor rising as the page scrolls, the nav sliding down over the field — shoved
  // it, and that shove is turned into velocity below.
  const beforeBarriers = next.map((bubble) => ({ x: bubble.x, y: bubble.y }));

  resolveWalls(next, bounds, restitution, heldId);
  if (options.obstacles && options.obstacles.length > 0) {
    resolveObstacles(next, options.obstacles, restitution, heldId, previous, bounds);
  }
  kickFromBarriers(next, beforeBarriers, stepDt, heldId, pressed);
  resolvePairs(next, restitution, heldId);
  // A pair or an obstacle can push a bubble back through a wall; the second pass is what makes
  // "never leaves the stage" true rather than nearly true.
  //
  // The obstacles get a second pass for the same reason, and it is not cosmetic: without it a
  // bubble shoved into the nav by a neighbour simply *stays inside the nav*, because the only
  // pass that would have pushed it out already ran. Solid boxes were solid against motion and
  // porous against being pushed.
  if (options.obstacles && options.obstacles.length > 0) {
    resolveObstacles(next, options.obstacles, restitution, heldId, previous, bounds);
  }
  resolveWalls(next, bounds, restitution, heldId);

  // The grip, applied last because it has to survive every impulse above.
  //
  // A bubble trapped between the held bubble and a barrier is not merely pushed — it is *pumped*.
  // It takes the pair impulse, the barrier's reflection and the barrier kick every frame, all in
  // the same place, and inside a fifth of a second it is doing 800px/s and shoots out of the gap
  // at the first contact that is a degree off its normal. Damping it before the impulses land
  // does nothing, because they land afterwards.
  //
  // So a pressed bubble simply keeps very little of whatever it ends the frame with. That is what
  // friction does, it is why anything can be held against anything, and it is the difference
  // between a squeeze and a catapult.
  // A fixed fraction per *frame*, deliberately not per second like the field's own drag. This is
  // a clamp, not a decay: the pump re-injects a full impulse every frame, so an exponential that
  // is framerate-independent over a second is worth nothing over one frame. At 60fps the drag
  // constant works out to keeping 88% — which is why the first attempt at this changed nothing.
  for (const bubble of next) {
    if (!pressed.has(bubble.id)) continue;
    bubble.vx *= GRIP;
    bubble.vy *= GRIP;
  }

  return next;
}

/**
 * Circle against axis-aligned box. The nearest point on the box to the centre gives both the
 * normal and the depth, which handles a corner hit as naturally as a flat one.
 *
 * A bubble that starts *inside* a box — the page reflowed under it, or a heading grew — is pushed
 * out through the nearest edge rather than being trapped there.
 */
/**
 * Moves a held bubble towards the pointer in hops no longer than half its radius, resolving
 * obstacles after each one. Position only — the caller derives velocity from the distance
 * actually covered.
 */
function sweepTo(bubble: Bubble, target: { x: number; y: number }, obstacles: readonly Rect[], bounds: Bounds) {
  const distance = Math.hypot(target.x - bubble.x, target.y - bubble.y);
  const hops = Math.max(1, Math.min(16, Math.ceil(distance / Math.max(4, bubble.r * 0.5))));
  // Each hop advances from wherever the last one *ended*, not from where the sweep began. Walking
  // an absolute path instead lets the final hop land on the far side of a box the bubble has been
  // pinned against for every hop before it — which is the teleport this whole function exists to
  // prevent.
  const stepX = (target.x - bubble.x) / hops;
  const stepY = (target.y - bubble.y) / hops;

  for (let hop = 1; hop <= hops; hop += 1) {
    const fromX = bubble.x;
    const fromY = bubble.y;
    bubble.x += stepX;
    bubble.y += stepY;

    for (const rect of obstacles) {
      pushOutOf(bubble, rect, { x: fromX, y: fromY }, 0, true, bounds);
    }

    bubble.x = Math.min(Math.max(bubble.x, bubble.r), Math.max(bubble.r, bounds.width - bubble.r));
    bubble.y = Math.min(Math.max(bubble.y, bubble.r), Math.max(bubble.r, bounds.height - bubble.r));
  }
}

function resolveObstacles(
  bubbles: Bubble[],
  obstacles: readonly Rect[],
  restitution: number,
  heldId: string | null,
  previous: readonly { x: number; y: number }[],
  bounds: Bounds,
) {
  for (const [index, bubble] of bubbles.entries()) {
    const held = bubble.id === heldId;
    const from = previous[index] ?? { x: bubble.x, y: bubble.y };
    const touched: Rect[] = [];

    for (const rect of obstacles) {
      if (pushOutOf(bubble, rect, from, restitution, held, bounds)) touched.push(rect);
    }

    // Two boxes at once means the bubble is wedged in a gap it does not fit through — the 81px
    // between the nav and the page heading, say, against a 176px bubble. Resolving them one at a
    // time just bounces it between the two forever and it sits there looking stuck. Push it clear
    // of the pair instead.
    if (touched.length > 1) {
      const top = Math.min(...touched.map((rect) => rect.y));
      const bottom = Math.max(...touched.map((rect) => rect.y + rect.height));
      bubble.y = from.y <= top ? top - bubble.r : bottom + bubble.r;
      if (!held) bubble.vy *= restitution;
    }
  }
}

/** One bubble against one box: put it back outside, on the side it came from, and bounce it
 *  unless it is being held. Returns whether the box was in its way at all. */
function pushOutOf(
  bubble: Bubble,
  rect: Rect,
  from: { x: number; y: number },
  restitution: number,
  held: boolean,
  bounds: Bounds,
): boolean {
  {
      const right = rect.x + rect.width;
      const bottom = rect.y + rect.height;
      const inside = bubble.x > rect.x && bubble.x < right && bubble.y > rect.y && bubble.y < bottom;

      if (inside) {
        /**
         * Which way out.
         *
         * The side it came in from is the right answer where there is one — leaving by the far
         * side reads as a teleport. But it is only a preference: an exit that puts the bubble
         * outside the stage is no exit at all, and taking it anyway is what wedged bubbles under
         * the specimen card. The card is wide, it is solid, and the floor sits not far below it,
         * so "nearest edge" pushed a bubble down into a gap it did not fit in — the wall pass put
         * it straight back inside, and it sat there half-buried, oscillating, for as long as the
         * card was open.
         *
         * So: prefer the side it came from, then the shortest push, and take the first one it
         * actually fits through.
         */
        const exits = [
          { x: rect.x - bubble.r, y: bubble.y, cost: bubble.x - rect.x, came: from.x <= rect.x },
          { x: right + bubble.r, y: bubble.y, cost: right - bubble.x, came: from.x >= right },
          { x: bubble.x, y: rect.y - bubble.r, cost: bubble.y - rect.y, came: from.y <= rect.y },
          { x: bubble.x, y: bottom + bubble.r, cost: bottom - bubble.y, came: from.y >= bottom },
        ];

        const fits = (exit: { x: number; y: number }) =>
          exit.x >= bubble.r &&
          exit.x <= bounds.width - bubble.r &&
          exit.y >= bubble.r &&
          exit.y <= bounds.height - bubble.r;

        const ranked = exits
          .slice()
          .sort((left, right_) => Number(right_.came) - Number(left.came) || left.cost - right_.cost);
        // Nothing fits on a stage smaller than a bubble. Then the shortest push is all there is.
        const chosen = ranked.find(fits) ?? ranked[0];

        const outX = Math.sign(chosen.x - bubble.x);
        const outY = Math.sign(chosen.y - bubble.y);
        bubble.x = chosen.x;
        bubble.y = chosen.y;

        if (!held) {
          bubble.vx *= restitution;
          bubble.vy *= restitution;
          // Shoved clear rather than set down against the edge. A bubble the card opened on top of
          // should visibly get out of the way, and a little speed also stops it settling exactly
          // on the boundary where the next frame finds it inside again.
          bubble.vx += outX * EVICT_SPEED;
          bubble.vy += outY * EVICT_SPEED;
        }
        return true;
      }

      const closestX = Math.min(Math.max(bubble.x, rect.x), right);
      const closestY = Math.min(Math.max(bubble.y, rect.y), bottom);
      const dx = bubble.x - closestX;
      const dy = bubble.y - closestY;
      const distance = Math.hypot(dx, dy);
      if (distance >= bubble.r || distance === 0) return false;

      const nx = dx / distance;
      const ny = dy / distance;
      bubble.x = closestX + nx * bubble.r;
      bubble.y = closestY + ny * bubble.r;

      if (held) return true;
      const along = bubble.vx * nx + bubble.vy * ny;
      if (along >= 0) return true;
      bubble.vx -= (1 + restitution) * along * nx;
      bubble.vy -= (1 + restitution) * along * ny;
      return true;
  }
}

/** How much of a barrier's shove comes back as speed. At 1 the bubble would leave exactly as fast
 *  as it was pushed, which reads as flinging; a third of it reads as being nudged out of the way. */
const KICK = 0.34;

/** Ignore corrections smaller than this — a bubble resting against a wall is corrected by a
 *  fraction of a pixel every frame, and kicking on that is a permanent jitter. */
const KICK_FLOOR = 1.2;

/** Fast enough to feel like a shove, not so fast that scrolling launches the field. */
const KICK_MAX = 780;

/**
 * A barrier that moves into a bubble propels it. Without this the floor and the nav simply carry
 * their bubbles along, pinned to the edge, which looks like they are stuck to it — the bubbles
 * should be knocked out of the way and drift off.
 */
function kickFromBarriers(
  bubbles: Bubble[],
  before: readonly { x: number; y: number }[],
  dt: number,
  heldId: string | null,
  pressed: ReadonlySet<string>,
) {
  if (dt <= 0) return;

  for (const [index, bubble] of bubbles.entries()) {
    if (bubble.id === heldId) continue;
    // A bubble being pressed into a barrier is corrected out of it every frame, and this cannot
    // tell that correction apart from a barrier moving into it. Without this exemption, pushing
    // one bubble against the nav fires it across the page at the cap — the barrier kicks it away
    // exactly as hard as it is being pushed in.
    if (pressed.has(bubble.id)) continue;

    const from = before[index];
    if (!from) continue;

    const dx = bubble.x - from.x;
    const dy = bubble.y - from.y;
    if (Math.hypot(dx, dy) < KICK_FLOOR) continue;

    const kickX = (dx / dt) * KICK;
    const kickY = (dy / dt) * KICK;
    const speed = Math.hypot(kickX, kickY);
    const scale = speed > KICK_MAX ? KICK_MAX / speed : 1;

    bubble.vx += kickX * scale;
    bubble.vy += kickY * scale;
  }
}

function resolveWalls(bubbles: Bubble[], bounds: Bounds, restitution: number, heldId: string | null) {
  for (const bubble of bubbles) {
    const held = bubble.id === heldId;

    if (bubble.x - bubble.r < 0) {
      bubble.x = bubble.r;
      if (!held && bubble.vx < 0) bubble.vx = -bubble.vx * restitution;
    } else if (bubble.x + bubble.r > bounds.width) {
      bubble.x = bounds.width - bubble.r;
      if (!held && bubble.vx > 0) bubble.vx = -bubble.vx * restitution;
    }

    if (bubble.y - bubble.r < 0) {
      bubble.y = bubble.r;
      if (!held && bubble.vy < 0) bubble.vy = -bubble.vy * restitution;
    } else if (bubble.y + bubble.r > bounds.height) {
      bubble.y = bounds.height - bubble.r;
      if (!held && bubble.vy > 0) bubble.vy = -bubble.vy * restitution;
    }
  }
}

/**
 * A bubble's mass: its area, give or take the π. Derived rather than stored, so it cannot fall
 * out of step with the radius the reader can see.
 *
 * Every bubble in the loose field is the same size, so this changes nothing for six of the seven.
 * It exists for the fused one, which is √2 wider and ought to shove like it — a specimen that
 * bounced off a single the way a single bounces off a single reads as a picture of a big bubble
 * rather than a big bubble.
 */
const massOf = (bubble: Bubble): number => bubble.r * bubble.r;

/** Impulse along the contact normal weighted by mass, plus a positional correction so two bubbles
 *  cannot come to rest inside each other. A held bubble has infinite mass: it takes none of the
 *  correction and none of the impulse. */
function resolvePairs(bubbles: Bubble[], restitution: number, heldId: string | null) {
  for (let i = 0; i < bubbles.length; i += 1) {
    for (let j = i + 1; j < bubbles.length; j += 1) {
      const a = bubbles[i];
      const b = bubbles[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const minDistance = a.r + b.r;
      let distance = Math.hypot(dx, dy);

      if (distance >= minDistance) continue;

      // Exactly concentric — seven bubbles seeded on one point, or a field dropped in from
      // nowhere. Separating every such pair along the same axis makes the corrections cancel by
      // symmetry and the pile never comes apart, so the axis is fanned out by pair index:
      // deterministic (a random nudge would make the field unreproducible in a test) but
      // different for each pair.
      if (distance === 0) {
        const angle = (i * 2.399963229728653 + j * 0.7853981633974483) % (Math.PI * 2);
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        distance = 0.0001;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;
      const aHeld = a.id === heldId;
      const bHeld = b.id === heldId;

      if (aHeld && bHeld) continue;

      // The lighter one gives way. Each takes the share of the correction that belongs to the
      // *other's* mass, which for two equal bubbles is half each — exactly what this did before
      // mass existed, so the loose field is unchanged to the last decimal.
      const massA = massOf(a);
      const massB = massOf(b);
      const total = massA + massB;
      const aShare = aHeld ? 0 : bHeld ? 1 : massB / total;
      const bShare = bHeld ? 0 : aHeld ? 1 : massA / total;
      a.x -= nx * overlap * aShare;
      a.y -= ny * overlap * aShare;
      b.x += nx * overlap * bShare;
      b.y += ny * overlap * bShare;

      const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (relative > 0) continue;

      // The standard reduced-mass impulse. A held bubble is infinitely heavy, so the reduced mass
      // collapses to the other's and it takes the whole exchange.
      //
      // Both special cases come out at the numbers this used before mass existed: two equal
      // bubbles each change velocity by half, and anything hitting a held bubble takes all of it.
      const reduced = aHeld || bHeld ? (aHeld ? massB : massA) : (massA * massB) / total;
      const impulse = -(1 + restitution) * relative * reduced;
      if (!aHeld) {
        a.vx -= (impulse / massA) * nx;
        a.vy -= (impulse / massA) * ny;
      }
      if (!bHeld) {
        b.vx += (impulse / massB) * nx;
        b.vy += (impulse / massB) * ny;
      }
    }
  }
}

/** True once every bubble is slower than `threshold` px/s — what the loop uses to stop drawing
 *  frames for a field nobody is touching. */
export const atRest = (bubbles: readonly Bubble[], threshold = 4): boolean =>
  bubbles.every((bubble) => Math.hypot(bubble.vx, bubble.vy) < threshold);

/** The largest pairwise overlap in the field, in px. Zero means nothing intersects. */
export const maxOverlap = (bubbles: readonly Bubble[]): number => {
  let worst = 0;
  for (let i = 0; i < bubbles.length; i += 1) {
    for (let j = i + 1; j < bubbles.length; j += 1) {
      const a = bubbles[i];
      const b = bubbles[j];
      worst = Math.max(worst, a.r + b.r - Math.hypot(b.x - a.x, b.y - a.y));
    }
  }
  return worst;
};

export type Target = { x: number; y: number; r: number };

/**
 * The other half of the field's life: every bubble pulled to an assigned slot, as a spring rather
 * than a tween, so a bubble that was mid-throw when you pressed one arrives without a visible
 * snap. Radius is interpolated the same way — the row is drawn smaller than the field.
 *
 * Critically damped by default: `damping = 2 * sqrt(stiffness)` is the point where a spring
 * arrives as fast as it can without overshooting, and an overshooting row of logos reads as a
 * bug rather than as bounce.
 */
export function stepToward(
  bubbles: readonly Bubble[],
  targets: ReadonlyMap<string, Target>,
  dt: number,
  stiffness = 120,
  // Critical damping derived from whatever stiffness was passed, not from the default — a caller
  // that softens the spring must get a softer damper with it or the row crawls in.
  damping = 2 * Math.sqrt(stiffness),
): Bubble[] {
  const stepDt = Math.min(Math.max(dt, 0), MAX_DT);

  return bubbles.map((bubble) => {
    const target = targets.get(bubble.id);
    if (!target || stepDt === 0) return { ...bubble };

    const ax = (target.x - bubble.x) * stiffness - bubble.vx * damping;
    const ay = (target.y - bubble.y) * stiffness - bubble.vy * damping;
    const vx = bubble.vx + ax * stepDt;
    const vy = bubble.vy + ay * stepDt;

    return {
      ...bubble,
      vx,
      vy,
      x: bubble.x + vx * stepDt,
      y: bubble.y + vy * stepDt,
      // Radius has no momentum — it is a size change, not a movement.
      r: bubble.r + (target.r - bubble.r) * Math.min(1, stepDt * 12),
    };
  });
}

/** True once every bubble is within `tolerance` px of its slot and has stopped moving — what tells
 *  the loop the transition is over and it can stop drawing frames. */
export const arrived = (
  bubbles: readonly Bubble[],
  targets: ReadonlyMap<string, Target>,
  tolerance = 0.6,
): boolean =>
  bubbles.every((bubble) => {
    const target = targets.get(bubble.id);
    if (!target) return true;
    return (
      Math.hypot(target.x - bubble.x, target.y - bubble.y) < tolerance &&
      Math.abs(target.r - bubble.r) < tolerance &&
      Math.hypot(bubble.vx, bubble.vy) < 8
    );
  });
