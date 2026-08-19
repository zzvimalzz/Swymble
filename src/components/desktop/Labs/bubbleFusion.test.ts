import { describe, expect, it } from 'vitest';
import { maxOverlap, step, type Bounds, type Bubble, type Rect } from './bubblePhysics';
import {
  BURST_LIFE,
  FUSION,
  ageBurst,
  burstProgress,
  startBurst,
  applyFusion,
  deepestPair,
  fuseBubbles,
  fusedId,
  isFused,
  membersOf,
  readyToFuse,
  splitAll,
  splitBubble,
  strainOf,
  trackSqueeze,
  type Squeeze,
} from './bubbleFusion';

const BOUNDS: Bounds = { width: 900, height: 520 };
const ORDER = ['cortex', 'mybirth', 'mydompet', 'oglets', 'territory', 'watchpaintdry', 'what2watch'];

const FRAME = 1 / 60;

/**
 * Drags a held bubble towards `to` one frame at a time through the real solver, tracking the
 * squeeze exactly as the loop will. Nothing here simulates the squeeze — it comes out of the
 * physics or it does not exist.
 */
const drag = (bubbles: Bubble[], to: number, frames: number, stepX = 6) => {
  let current = bubbles;
  let squeeze: Squeeze | null = null;
  let pointerX = current.find((bubble) => bubble.id === 'held')?.x ?? 0;
  let fusedAt: number | null = null;

  for (let frame = 0; frame < frames; frame += 1) {
    pointerX = Math.min(to, pointerX + stepX);
    current = step(current, BOUNDS, FRAME, { heldId: 'held', heldTo: { x: pointerX, y: 260 } });
    squeeze = trackSqueeze(squeeze, deepestPair(current, 'held'), FRAME);
    if (fusedAt === null && readyToFuse(squeeze)) fusedAt = frame;
  }

  return { bubbles: current, squeeze, fusedAt };
};

describe('forcing two bubbles together', () => {
  it('fuses one held against a bubble that has nowhere to go', () => {
    // `other` is flat against the right wall. The pair pass shoves it out of the way and the wall
    // pass puts it straight back, so the overlap survives every frame — which is the only reason
    // this egg is reachable at all.
    const cornered: Bubble[] = [
      { id: 'held', x: 700, y: 260, vx: 0, vy: 0, r: 50 },
      { id: 'other', x: 850, y: 260, vx: 0, vy: 0, r: 50 },
    ];

    const { squeeze, fusedAt } = drag(cornered, 780, 90);

    expect(squeeze).not.toBeNull();
    expect(readyToFuse(squeeze)).toBe(true);
    // Roughly 0.55s of strain on top of the 13 frames spent closing the distance — it must take
    // a deliberate lean, not a touch.
    expect(fusedAt).toBeGreaterThan(FUSION.hold / FRAME);
  });

  it('will not fuse a bubble shoved across open ground', () => {
    // Same shove, nothing behind the victim. The solver moves it aside every frame, so the
    // overlap never lasts and the field stays seven bubbles however hard it is pushed.
    const loose: Bubble[] = [
      { id: 'held', x: 300, y: 260, vx: 0, vy: 0, r: 50 },
      { id: 'other', x: 450, y: 260, vx: 0, vy: 0, r: 50 },
    ];

    const { bubbles, squeeze, fusedAt } = drag(loose, 620, 90);

    expect(fusedAt).toBeNull();
    // Not merely short of the threshold — there is no end-of-frame overlap at all, because the
    // pair pass gives the whole correction to the bubble that is free to take it.
    expect(squeeze).toBeNull();
    expect(strainOf(squeeze)).toBe(0);
    // And it really was shoved the length of the field, so this is a squeeze that failed rather
    // than two bubbles that never met.
    expect(bubbles.find((bubble) => bubble.id === 'other')?.x).toBeGreaterThan(700);
  });

  it('ignores the overlap a collision makes for a frame or two', () => {
    // A hard throw penetrates deeply on impact. Nothing is held, so there is no squeeze to find:
    // flinging a bubble across the field must never merge anything.
    const thrown: Bubble[] = [
      { id: 'a', x: 200, y: 260, vx: 2000, vy: 0, r: 50 },
      { id: 'b', x: 800, y: 260, vx: 0, vy: 0, r: 50 },
    ];

    let current = thrown;
    let squeeze: Squeeze | null = null;
    for (let frame = 0; frame < 180; frame += 1) {
      current = step(current, BOUNDS, FRAME);
      squeeze = trackSqueeze(squeeze, deepestPair(current, null), FRAME);
      expect(readyToFuse(squeeze)).toBe(false);
    }
  });
});

describe('pressing a bubble against a barrier', () => {
  // Three bugs made the egg unreachable on the real page, and every one of them is invisible in
  // a two-bubble test with no obstacles and no drift. They are pinned here.
  const BAR: Rect = { x: 0, y: 0, width: BOUNDS.width, height: 90 };

  /** Presses a held bubble up into one resting under the bar, chasing it if it slides. */
  const pressUp = (frames: number) => {
    const victim: Bubble = { id: 'v', x: 450, y: 90 + 50, vx: 0, vy: 0, r: 50 };
    let current: Bubble[] = [{ id: 'held', x: 450, y: victim.y + 150, vx: 0, vy: 0, r: 50 }, victim];
    let pointerY = current[0].y;
    let clock = 0;

    for (let frame = 0; frame < frames; frame += 1) {
      pointerY = Math.max(victim.y + 65, pointerY - 6);
      clock += FRAME;
      current = step(current, BOUNDS, FRAME, {
        heldId: 'held',
        heldTo: { x: current.find((bubble) => bubble.id === 'v')!.x, y: pointerY },
        obstacles: [BAR],
        wander: { time: clock },
      });
    }

    return current.find((bubble) => bubble.id === 'v')!;
  };

  it('keeps a bubble out of an obstacle it was pushed into, not just one it flew into', () => {
    // The obstacle pass used to run only before the pair pass, so a bubble shoved into the nav by
    // a neighbour simply stayed inside it: solid against motion, porous against being pushed.
    const victim = pressUp(120);
    expect(victim.y - victim.r).toBeGreaterThanOrEqual(BAR.y + BAR.height - 0.5);
  });

  it('does not fire it across the page for being pressed', () => {
    // `kickFromBarriers` cannot tell a barrier moving into a bubble from a bubble being pushed
    // into a barrier, so every press used to launch the victim at the kick cap.
    const victim = pressUp(120);
    expect(Math.hypot(victim.vx, victim.vy)).toBeLessThan(120);
    expect(Math.abs(victim.x - 450)).toBeLessThan(300);
  });

  it('holds the squeeze long enough to be worth attempting', () => {
    const victim: Bubble = { id: 'v', x: 450, y: 140, vx: 0, vy: 0, r: 50 };
    let current: Bubble[] = [{ id: 'held', x: 450, y: 290, vx: 0, vy: 0, r: 50 }, victim];
    let pointerY = 290;
    let clock = 0;
    let squeeze: Squeeze | null = null;
    let fused = false;

    for (let frame = 0; frame < 300; frame += 1) {
      // Press, ease off, press again — the rhythm a person actually uses.
      const aim = frame % 50 < 30 ? 205 : 250;
      pointerY += Math.sign(aim - pointerY) * Math.min(9, Math.abs(aim - pointerY));
      clock += FRAME;
      current = step(current, BOUNDS, FRAME, {
        heldId: 'held',
        heldTo: { x: current.find((bubble) => bubble.id === 'v')!.x, y: pointerY },
        obstacles: [BAR],
        wander: { time: clock },
      });
      squeeze = trackSqueeze(squeeze, deepestPair(current, 'held'), FRAME);
      if (readyToFuse(squeeze)) fused = true;
    }

    expect(fused).toBe(true);
  });
});

describe('the squeeze', () => {
  const contact = (ratio: number, a = 'held', b = 'other') => ({ a, b, penetration: ratio * 100, ratio });

  it('accumulates only while the strain is held', () => {
    // Thirds of the threshold, so this stays true if the threshold is retuned — which it has
    // been once already, from what the real field turned out to sustain.
    const third = FUSION.hold / 3;
    let squeeze = trackSqueeze(null, contact(FUSION.strain), third);
    squeeze = trackSqueeze(squeeze, contact(FUSION.strain + 0.1), third);

    expect(squeeze?.held).toBeCloseTo(third * 2, 6);
    expect(readyToFuse(squeeze)).toBe(false);

    squeeze = trackSqueeze(squeeze, contact(FUSION.strain), third);
    expect(readyToFuse(squeeze)).toBe(true);
  });

  it('decays rather than resets when the strain slips for a frame', () => {
    // The threshold flickers frame to frame against a wall. Losing half a second of squeeze to
    // one such frame would read as the egg being broken rather than as it being difficult.
    let squeeze = trackSqueeze(null, contact(FUSION.strain), 0.4);
    squeeze = trackSqueeze(squeeze, contact(FUSION.contact), FRAME);

    expect(squeeze?.held).toBeCloseTo(0.4 - FRAME * FUSION.decay, 6);
    expect(squeeze?.a).toBe('held');
  });

  it('forgets a squeeze that is let go of', () => {
    let squeeze = trackSqueeze(null, contact(FUSION.strain), 0.2);
    squeeze = trackSqueeze(squeeze, null, 0.5);

    expect(squeeze).toBeNull();
  });

  it('starts over when the squeeze moves to another bubble', () => {
    let squeeze = trackSqueeze(null, contact(FUSION.strain + 0.2), 0.5);
    squeeze = trackSqueeze(squeeze, contact(FUSION.strain + 0.2, 'held', 'third'), FRAME);

    expect(squeeze?.b).toBe('third');
    expect(squeeze?.held).toBeCloseTo(FRAME, 6);
  });

  it('will not squeeze a specimen into anything, or anything into a specimen', () => {
    // Two labs, and only ever two. Checked here rather than at the merge, so the neck never draws
    // on a squeeze that could not give.
    // `cortex` is buried in the specimen; `territory` is right across the field from both.
    const withSpecimen: Bubble[] = [
      { id: 'fused:mybirth+oglets', x: 400, y: 260, vx: 0, vy: 0, r: 70 },
      { id: 'cortex', x: 440, y: 260, vx: 0, vy: 0, r: 50 },
      { id: 'territory', x: 800, y: 260, vx: 0, vy: 0, r: 50 },
    ];

    expect(deepestPair(withSpecimen, 'fused:mybirth+oglets')).toBeNull();
    expect(deepestPair(withSpecimen, 'cortex')).toBeNull();
    // Two singles still find each other, so the rule has not broken the ordinary case.
    expect(deepestPair([withSpecimen[1], { ...withSpecimen[2], x: 480 }], 'cortex')?.b).toBe('territory');
  });

  it('reports the deepest of several overlaps, and only ones the held bubble is in', () => {
    const crowd: Bubble[] = [
      { id: 'held', x: 400, y: 260, vx: 0, vy: 0, r: 50 },
      { id: 'grazed', x: 495, y: 260, vx: 0, vy: 0, r: 50 },
      { id: 'crushed', x: 330, y: 260, vx: 0, vy: 0, r: 50 },
      { id: 'apart', x: 700, y: 260, vx: 0, vy: 0, r: 50 },
    ];

    expect(deepestPair(crowd, 'held')?.b).toBe('crushed');
    expect(deepestPair(crowd, 'apart')).toBeNull();
    // Two free bubbles inside each other are the solver's business, not this file's.
    expect(deepestPair(crowd, null)).toBeNull();
  });
});

describe('the fused bubble', () => {
  const a: Bubble = { id: 'oglets', x: 300, y: 200, vx: 100, vy: 0, r: 60 };
  const b: Bubble = { id: 'mybirth', x: 400, y: 200, vx: -300, vy: 40, r: 40 };

  it('conserves area, so a merge adds nothing to the field', () => {
    const fused = fuseBubbles(a, b, ORDER);
    expect(fused.r * fused.r).toBeCloseTo(a.r * a.r + b.r * b.r, 6);
    // And it is bigger than either — the reader has to be able to see that it happened.
    expect(fused.r).toBeGreaterThan(Math.max(a.r, b.r));
  });

  it('lands between the two, weighted by size, and keeps their momentum', () => {
    const fused = fuseBubbles(a, b, ORDER);
    const shareA = (a.r * a.r) / (a.r * a.r + b.r * b.r);

    expect(fused.x).toBeCloseTo(a.x * shareA + b.x * (1 - shareA), 6);
    expect(fused.vx).toBeCloseTo(a.vx * shareA + b.vx * (1 - shareA), 6);
    // The larger bubble dominates, so a fusion does not lurch towards the smaller one.
    expect(fused.x).toBeLessThan((a.x + b.x) / 2);
  });

  it('is named by its members in the page order, whichever way round it was squeezed', () => {
    expect(fuseBubbles(a, b, ORDER).id).toBe(fuseBubbles(b, a, ORDER).id);
    expect(fuseBubbles(a, b, ORDER).id).toBe('fused:mybirth+oglets');
    expect(membersOf('fused:mybirth+oglets')).toEqual(['mybirth', 'oglets']);
    expect(membersOf('oglets')).toEqual(['oglets']);
    expect(isFused('oglets')).toBe(false);
  });

  it('can be squeezed into again, and never counts a lab twice', () => {
    const first = fuseBubbles(a, b, ORDER);
    const second = fuseBubbles(first, { ...a, id: 'cortex', r: 40 }, ORDER);

    expect(second.id).toBe('fused:cortex+mybirth+oglets');
    expect(membersOf(second.id)).toHaveLength(3);
    expect(fusedId(['oglets', 'oglets', 'mybirth'], ORDER)).toBe('fused:mybirth+oglets');
  });

  it('replaces both bubbles in place, leaving the rest of the field alone', () => {
    const field: Bubble[] = [
      { id: 'cortex', x: 100, y: 100, vx: 0, vy: 0, r: 50 },
      a,
      { id: 'territory', x: 600, y: 300, vx: 0, vy: 0, r: 50 },
      b,
    ];

    const merged = applyFusion(field, { a: 'oglets', b: 'mybirth', held: 1, ratio: 0.3 }, ORDER);

    expect(merged?.map((bubble) => bubble.id)).toEqual(['cortex', 'fused:mybirth+oglets', 'territory']);
    expect(applyFusion(field, { a: 'oglets', b: 'gone', held: 1, ratio: 0.3 }, ORDER)).toBeNull();
  });

});

describe('the rupture', () => {
  const blob: Bubble = { id: 'fused:mybirth+oglets', x: 300, y: 200, vx: 40, vy: 0, r: 90 };

  it('starts where the specimen let go and forgets itself when it is done', () => {
    let burst = startBurst(blob);
    expect(burst).toMatchObject({ x: 300, y: 200, r: 90, age: 0 });
    expect(burstProgress(burst)).toBe(0);

    for (let frame = 0; frame < Math.ceil(BURST_LIFE / FRAME) - 2; frame += 1) {
      burst = ageBurst(burst, FRAME)!;
      expect(burst).not.toBeNull();
    }

    expect(burstProgress(burst)).toBeGreaterThan(0.9);
    expect(ageBurst(burst, FRAME * 4)).toBeNull();
  });

  it('is nothing at all when there is no rupture to draw', () => {
    expect(ageBurst(null, FRAME)).toBeNull();
    expect(burstProgress(null)).toBe(0);
  });
});

describe('breaking a fusion', () => {
  const fused: Bubble = { id: fusedId(['cortex', 'mybirth', 'oglets'], ORDER), x: 450, y: 260, vx: 80, vy: 0, r: 90 };

  it('gives back every member, clear of each other and moving apart', () => {
    const pieces = splitBubble(fused, 50);

    expect(pieces.map((piece) => piece.id)).toEqual(['cortex', 'mybirth', 'oglets']);
    expect(maxOverlap(pieces)).toBeLessThanOrEqual(0);

    for (const piece of pieces) {
      // Outward from where the fusion stood, and carrying the throw it was in the middle of.
      const outward = (piece.x - fused.x) * piece.vx + (piece.y - fused.y) * piece.vy;
      expect(outward).toBeGreaterThan(0);
      expect(piece.r).toBe(50);
    }
  });

  it('settles into a field the solver is happy with', () => {
    let current: Bubble[] = splitAll([fused, { id: 'territory', x: 200, y: 200, vx: 0, vy: 0, r: 50 }], 50);
    expect(current).toHaveLength(4);

    for (let frame = 0; frame < 240; frame += 1) current = step(current, BOUNDS, FRAME);

    expect(maxOverlap(current)).toBeLessThan(1);
    for (const bubble of current) {
      expect(bubble.x - bubble.r).toBeGreaterThanOrEqual(-0.001);
      expect(bubble.x + bubble.r).toBeLessThanOrEqual(BOUNDS.width + 0.001);
    }
  });

  it('leaves a bubble that was never fused exactly as it was', () => {
    const single: Bubble = { id: 'oglets', x: 10, y: 20, vx: 3, vy: 4, r: 50 };
    expect(splitBubble(single, 50)).toEqual([single]);
    expect(splitAll([single], 50)).toEqual([single]);
  });
});
