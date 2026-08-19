/**
 * Two bubbles forced together until they merge.
 *
 * Nothing here changes how the field moves — the squeeze it looks for is a state the solver
 * already produces. A held bubble is infinite mass, so it takes none of the pair correction; a
 * bubble cornered against a wall or a heading has nowhere to be pushed, and `resolveWalls` runs
 * again *after* `resolvePairs` (see bubblePhysics.step) and puts it straight back where it was.
 * The frame therefore ends with real overlap, and leaning harder deepens it. That is the whole
 * interaction: this file only measures it.
 *
 * Pure, like the solver: no DOM, no clock, no React. `dt` is passed in, so a test can hold a
 * squeeze for exactly 550ms without waiting 550ms.
 */

import type { Bubble } from './bubblePhysics';

/** Fused ids carry their own membership — `fused:mybirth+oglets`. There is deliberately no side
 *  table: the bubble array is the entire fusion state, so nothing can fall out of step with it. */
export const FUSED_PREFIX = 'fused:';

export const FUSION = {
  /** Overlap, as a share of the two radii, at which the pair starts to visibly strain. Below
   *  this they are merely touching, which happens constantly and must mean nothing. */
  contact: 0.06,
  /** The share that counts as being squeezed. A throw reaches it for a frame or two; only
   *  something held against something cornered can hold it. */
  strain: 0.2,
  /**
   * Seconds of sustained strain before the two merge. This is what separates an impact from an
   * intent — a collision cannot survive it, a shove can.
   *
   * Measured, not chosen: a real press against a heading holds a fifth of the bubble's width for
   * about 0.45s before the contact walks off its own normal and the bubble slides out. 0.4 gives
   * a deliberate lean one clear press, and gives a throw nothing at all.
   */
  hold: 0.4,
  /**
   * How fast held time drains back off when the strain slips. Slower than it accrues, so a press
   * that slides out at 0.3s is not wasted — press again within a second or so and the second one
   * finishes the job.
   *
   * This is the difference between an egg that is hard and an egg that is impossible. It was 2×
   * (faster than it built), which meant every near miss reset the reader to nothing.
   */
  decay: 0.6,
} as const;

/** The deepest overlap the held bubble is currently in. */
export type Contact = {
  /** The held bubble. */
  a: string;
  /** What it is being pressed into. */
  b: string;
  /** Overlap in px: `ra + rb - distance`. */
  penetration: number;
  /** That overlap as a share of `ra + rb` — the scale-free number every threshold uses, so the
   *  egg is exactly as hard on a small stage as on a large one. */
  ratio: number;
};

/** A squeeze in progress. `null` between squeezes; the loop keeps the last one it was handed. */
export type Squeeze = {
  a: string;
  b: string;
  /** Seconds of strain accumulated so far, after decay. */
  held: number;
  /** The current overlap ratio — what the neck between the two circles is drawn from. */
  ratio: number;
};

/** The deepest pair involving the held bubble, or null if nothing is holding or nothing touches.
 *  Only the held bubble can squeeze: two free bubbles are separated by the solver every frame,
 *  so a sustained overlap between them cannot happen and looking for one would be dead code. */
export function deepestPair(bubbles: readonly Bubble[], heldId: string | null): Contact | null {
  if (!heldId) return null;

  const held = bubbles.find((bubble) => bubble.id === heldId);
  if (!held) return null;
  // Two labs, and only ever two. A specimen cannot be squeezed into anything else — the joke is
  // one card about one impossible pairing, and a chain of them would be a filing system.
  // Enforced here rather than at the merge so the neck never draws on a squeeze that cannot give.
  if (isFused(held.id)) return null;

  let worst: Contact | null = null;

  for (const other of bubbles) {
    if (other.id === held.id || isFused(other.id)) continue;

    const reach = held.r + other.r;
    const penetration = reach - Math.hypot(other.x - held.x, other.y - held.y);
    if (penetration <= 0) continue;

    const ratio = penetration / reach;
    if (!worst || ratio > worst.ratio) worst = { a: held.id, b: other.id, penetration, ratio };
  }

  return worst;
}

/** Whether two contacts are the same pair, whichever way round they were reported. */
const samePair = (squeeze: Squeeze, contact: Contact) =>
  (squeeze.a === contact.a && squeeze.b === contact.b) || (squeeze.a === contact.b && squeeze.b === contact.a);

/**
 * One frame of the squeeze. Hand it the previous squeeze and the current contact; it returns the
 * next one, or null once there is nothing left to remember.
 *
 * Moving to a different pair starts over rather than carrying credit across, so the egg cannot be
 * ground out by mashing one bubble around the field.
 */
export function trackSqueeze(previous: Squeeze | null, contact: Contact | null, dt: number): Squeeze | null {
  const elapsed = Math.max(0, dt);

  if (!contact || contact.ratio < FUSION.contact) {
    if (!previous) return null;
    const held = previous.held - elapsed * FUSION.decay;
    return held <= 0 ? null : { ...previous, held, ratio: 0 };
  }

  if (!previous || !samePair(previous, contact)) {
    return {
      a: contact.a,
      b: contact.b,
      held: contact.ratio >= FUSION.strain ? elapsed : 0,
      ratio: contact.ratio,
    };
  }

  const held =
    contact.ratio >= FUSION.strain
      ? previous.held + elapsed
      : Math.max(0, previous.held - elapsed * FUSION.decay);

  return { a: contact.a, b: contact.b, held, ratio: contact.ratio };
}

/** 0 while a squeeze is only touching, 1 when it is about to give. What the neck and the rings
 *  are drawn from — the reader can see the egg coming before it happens, which is the only
 *  instruction they get. */
export const strainOf = (squeeze: Squeeze | null): number =>
  squeeze ? Math.min(1, squeeze.held / FUSION.hold) : 0;

export const readyToFuse = (squeeze: Squeeze | null): boolean => squeeze !== null && squeeze.held >= FUSION.hold;

/** The lab ids inside a bubble: itself, unless it is already a fusion. */
export const membersOf = (id: string): string[] =>
  id.startsWith(FUSED_PREFIX) ? id.slice(FUSED_PREFIX.length).split('+') : [id];

/**
 * A fusion's id. Members are put back into the page's own order, so squeezing A into B and B into
 * A produce the same bubble — the id is an identity, not a history of how it was made.
 */
export const fusedId = (members: readonly string[], order: readonly string[]): string => {
  const unique = [...new Set(members)];
  const ranked = unique.slice().sort((left, right) => order.indexOf(left) - order.indexOf(right));
  return `${FUSED_PREFIX}${ranked.join('+')}`;
};

export const isFused = (id: string): boolean => id.startsWith(FUSED_PREFIX);

/**
 * The bubble two bubbles become.
 *
 * Area is conserved — `r = sqrt(ra² + rb²)` — because a merge should read as the same amount of
 * bubble in one place rather than as something new being added to the field. Centre and velocity
 * are weighted by that area, so the larger of the two dominates and a fusion does not lurch.
 */
export function fuseBubbles(a: Bubble, b: Bubble, order: readonly string[]): Bubble {
  const areaA = a.r * a.r;
  const areaB = b.r * b.r;
  const total = areaA + areaB;
  const shareA = total === 0 ? 0.5 : areaA / total;
  const shareB = 1 - shareA;

  return {
    id: fusedId([...membersOf(a.id), ...membersOf(b.id)], order),
    x: a.x * shareA + b.x * shareB,
    y: a.y * shareA + b.y * shareB,
    vx: a.vx * shareA + b.vx * shareB,
    vy: a.vy * shareA + b.vy * shareB,
    r: Math.sqrt(total),
  };
}

/** Replaces the two squeezed bubbles with the one they become, in place of the first of them —
 *  the field keeps its ordering, so nothing else jumps when a fusion happens. */
export function applyFusion(
  bubbles: readonly Bubble[],
  squeeze: Squeeze,
  order: readonly string[],
): Bubble[] | null {
  const a = bubbles.find((bubble) => bubble.id === squeeze.a);
  const b = bubbles.find((bubble) => bubble.id === squeeze.b);
  if (!a || !b) return null;

  const fused = fuseBubbles(a, b, order);
  return bubbles.flatMap((bubble) => {
    if (bubble.id === a.id) return [fused];
    if (bubble.id === b.id) return [];
    return [bubble];
  });
}

/** How fast the pieces leave when a fusion is broken. Enough to look like it came apart rather
 *  than was taken apart. */
const SPLIT_SPEED = 340;

/** How long the rupture is drawn for, in seconds. Short: it is a rupture, not a transition. */
export const BURST_LIFE = 0.72;

/** A specimen coming apart, kept only for as long as it is being drawn. */
export type Burst = {
  /** Where it let go, in stage pixels. */
  x: number;
  y: number;
  /** The radius it had at the moment it gave. The shockwave starts here and grows past it. */
  r: number;
  /** Seconds since it went. */
  age: number;
};

export const startBurst = (bubble: Bubble): Burst => ({ x: bubble.x, y: bubble.y, r: bubble.r, age: 0 });

/** One frame of the rupture. Returns null once it is over and there is nothing left to draw. */
export const ageBurst = (burst: Burst | null, dt: number): Burst | null => {
  if (!burst) return null;
  const age = burst.age + Math.max(0, dt);
  return age >= BURST_LIFE ? null : { ...burst, age };
};

/** 0 at the moment it gives, 1 as the last of it fades. */
export const burstProgress = (burst: Burst | null): number =>
  burst ? Math.min(1, burst.age / BURST_LIFE) : 0;

/**
 * A fusion back into its members, arranged on a ring around where it stood and fired outward.
 *
 * The ring is sized so the members start clear of each other — `radius / sin(π / n)` is the
 * circle on which n circles of that radius exactly touch — and the members keep the fusion's own
 * velocity on top of their outward push, so breaking one mid-throw does not stop it dead.
 *
 * The ring can put a member outside the stage. That is fine and deliberate: the wall pass on the
 * next frame is the authority on where bubbles may be, and duplicating its rules here is how the
 * two get to disagree.
 */
export function splitBubble(bubble: Bubble, radius: number, speed = SPLIT_SPEED): Bubble[] {
  const members = membersOf(bubble.id);
  if (members.length < 2) return [{ ...bubble }];

  // 1.04 rather than 1: touching exactly leaves the solver a contact to resolve on the first
  // frame, which shows up as a shudder at the moment of the split.
  const ring = (radius / Math.sin(Math.PI / members.length)) * 1.04;

  return members.map((id, index) => {
    // Offset so the pieces never come apart along the horizontal, which reads as a mechanism
    // rather than as something bursting.
    const angle = (index * Math.PI * 2) / members.length + 0.6;
    return {
      id,
      x: bubble.x + Math.cos(angle) * ring,
      y: bubble.y + Math.sin(angle) * ring,
      vx: bubble.vx + Math.cos(angle) * speed,
      vy: bubble.vy + Math.sin(angle) * speed,
      r: radius,
    };
  });
}

/** Every fusion in the field broken at once — what opening a lab card, turning gravity on, or
 *  pressing Escape does. Bubbles that were never fused are passed through untouched. */
export const splitAll = (bubbles: readonly Bubble[], radius: number): Bubble[] =>
  bubbles.flatMap((bubble) => (isFused(bubble.id) ? splitBubble(bubble, radius) : [{ ...bubble }]));

