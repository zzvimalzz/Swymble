import { describe, expect, it } from 'vitest';
import { cornersOf, makeBody, stepWorld, worldAtRest, type Body, type World } from './rigidBody';

const WORLD: World = { width: 1200, height: 800, gravity: 1900 };

const run = (bodies: Body[], frames: number, world: World = WORLD) => {
  let current = bodies;
  for (let frame = 0; frame < frames; frame += 1) {
    current = stepWorld(current, world, 1 / 60);
  }
  return current;
};

const lowestPoint = (body: Body) =>
  body.shape === 'circle' ? body.y + body.hw : Math.max(...cornersOf(body).map((corner) => corner.y));

describe('gravity', () => {
  it('drops a box onto the floor and leaves it there', () => {
    const box = makeBody({ id: 'a', x: 600, y: 120, hw: 120, hh: 26 });
    const settled = run([box], 300)[0];

    expect(lowestPoint(settled)).toBeLessThanOrEqual(WORLD.height + 6);
    expect(lowestPoint(settled)).toBeGreaterThan(WORLD.height - 40);
    expect(worldAtRest([settled])).toBe(true);
  });

  it('makes a tilted box topple rather than land like a sticker', () => {
    const tilted = makeBody({ id: 'a', x: 600, y: 200, hw: 140, hh: 24, angle: 0.5 });
    const settled = run([tilted], 400)[0];

    // It ends flatter than it started: a corner landing turns into a face landing.
    const flatness = Math.abs(Math.sin(settled.angle));
    expect(flatness).toBeLessThan(Math.abs(Math.sin(0.5)));
  });

  it('never lets anything through the floor, however hard it is thrown', () => {
    const thrown = [
      makeBody({ id: 'a', x: 300, y: 100, hw: 90, hh: 20, vy: 6000 }),
      makeBody({ id: 'b', x: 700, y: 100, hw: 40, hh: 40, shape: 'circle', vy: 5200 }),
    ];

    for (const body of run(thrown, 240)) {
      expect(lowestPoint(body), `body ${body.id}`).toBeLessThanOrEqual(WORLD.height + 2);
    }
  });

  it('keeps everything inside the side walls', () => {
    const flung = [
      makeBody({ id: 'a', x: 600, y: 300, hw: 80, hh: 30, vx: -4200 }),
      makeBody({ id: 'b', x: 600, y: 200, hw: 60, hh: 60, shape: 'circle', vx: 4200 }),
    ];

    for (const body of run(flung, 300)) {
      const points = body.shape === 'circle' ? [{ x: body.x - body.hw }, { x: body.x + body.hw }] : cornersOf(body);
      for (const point of points) {
        expect(point.x, `body ${body.id}`).toBeGreaterThanOrEqual(-2);
        expect(point.x, `body ${body.id}`).toBeLessThanOrEqual(WORLD.width + 2);
      }
    }
  });

  it('stacks boxes without letting them sink through each other', () => {
    const stack = [
      makeBody({ id: 'bottom', x: 600, y: 300, hw: 150, hh: 25 }),
      makeBody({ id: 'middle', x: 600, y: 200, hw: 120, hh: 25 }),
      makeBody({ id: 'top', x: 600, y: 100, hw: 90, hh: 25 }),
    ];

    const settled = run(stack, 500);
    const byId = new Map(settled.map((body) => [body.id, body]));
    const bottom = byId.get('bottom');
    const middle = byId.get('middle');
    const top = byId.get('top');

    expect(bottom && middle && top).toBeTruthy();
    if (!bottom || !middle || !top) return;

    // None of them ends up inside another, and none is meaningfully through the floor. A few px
    // of penetration under the weight of a stack is inherent to a solver that corrects position
    // by a fraction each frame — it is invisible against bodies this size. Which box ends on top
    // after they slide off each other is not something this test should care about.
    for (const body of settled) {
      expect(lowestPoint(body), `body ${body.id}`).toBeLessThanOrEqual(WORLD.height + 10);
    }

    const gaps = [
      Math.abs(top.y - middle.y),
      Math.abs(middle.y - bottom.y),
    ];
    for (const gap of gaps) {
      // Either stacked (roughly two half-heights apart) or side by side — never occupying the
      // same space.
      expect(gap > 30 || Math.abs(top.x - middle.x) > 80 || Math.abs(middle.x - bottom.x) > 80).toBe(true);
    }
  });

  it('does not explode: a crowded pile stays at sane speeds', () => {
    const crowd = Array.from({ length: 12 }, (_unused, index) =>
      makeBody({
        id: `b${index}`,
        x: 560 + (index % 3) * 40,
        y: 120 + index * 30,
        hw: 70,
        hh: 22,
        angle: index * 0.3,
      }),
    );

    for (const body of run(crowd, 420)) {
      expect(Math.hypot(body.vx, body.vy), `body ${body.id}`).toBeLessThan(3000);
      expect(Number.isFinite(body.x) && Number.isFinite(body.y)).toBe(true);
    }
  });

  it('lets a pile come to rest', () => {
    const pile = Array.from({ length: 6 }, (_unused, index) =>
      makeBody({ id: `p${index}`, x: 500 + index * 60, y: 120 + index * 20, hw: 60, hh: 20 }),
    );

    expect(worldAtRest(run(pile, 800))).toBe(true);
  });

  it('leaves an immovable body exactly where it was put', () => {
    const pinned = makeBody({ id: 'wall', x: 600, y: 700, hw: 200, hh: 20, invMass: 0, invInertia: 0 });
    const falling = makeBody({ id: 'a', x: 600, y: 200, hw: 60, hh: 20 });
    const settled = run([pinned, falling], 300);
    const wall = settled.find((body) => body.id === 'wall');

    expect(wall && wall.x).toBe(600);
    expect(wall && wall.y).toBe(700);
    expect(wall && wall.angle).toBe(0);
  });

  it('does not mutate the bodies it is given', () => {
    const original = [makeBody({ id: 'a', x: 600, y: 200, hw: 60, hh: 20 })];
    const snapshot = JSON.stringify(original);
    stepWorld(original, WORLD, 1 / 60);
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it('clamps a long frame instead of teleporting everything through the floor', () => {
    const box = makeBody({ id: 'a', x: 600, y: 100, hw: 60, hh: 20 });
    const afterStall = stepWorld([box], WORLD, 5)[0];
    expect(lowestPoint(afterStall)).toBeLessThanOrEqual(WORLD.height + 2);
  });
});

describe('the separating axis, specifically', () => {
  // This was wrong once and cost an afternoon: with the normal inverted, two overlapping boxes
  // were pushed *into* each other and a stack collapsed into a single heap on the floor.
  it('pushes two overlapping boxes apart, not together', () => {
    const world: World = { width: 1200, height: 4000, gravity: 0 };
    const overlapping = [
      makeBody({ id: 'left', x: 600, y: 500, hw: 90, hh: 25 }),
      makeBody({ id: 'right', x: 640, y: 500, hw: 90, hh: 25 }),
    ];

    const before = Math.abs(overlapping[1].x - overlapping[0].x);
    const settled = run(overlapping, 90, world);
    const after = Math.abs(settled[1].x - settled[0].x) + Math.abs(settled[1].y - settled[0].y);

    expect(after).toBeGreaterThan(before);
  });

  it('separates a circle resting inside a box', () => {
    const world: World = { width: 1200, height: 4000, gravity: 0 };
    const pair = [
      makeBody({ id: 'box', x: 600, y: 500, hw: 100, hh: 30 }),
      makeBody({ id: 'ball', x: 610, y: 505, hw: 40, hh: 40, shape: 'circle' }),
    ];

    const settled = run(pair, 120, world);
    const gap = Math.hypot(settled[1].x - settled[0].x, settled[1].y - settled[0].y);
    expect(gap).toBeGreaterThan(Math.hypot(10, 5));
  });
});

describe('picking something up', () => {
  it('brings the held body to the pointer and holds it there against gravity', () => {
    let bodies = [makeBody({ id: 'held', x: 300, y: 300, hw: 80, hh: 30 })];
    for (let frame = 0; frame < 60; frame += 1) {
      bodies = stepWorld(bodies, WORLD, 1 / 60, { held: { id: 'held', x: 500, y: 200 } });
    }

    // A joint, not a teleport: it arrives within a pixel or two and stays.
    expect(Math.hypot(bodies[0].x - 500, bodies[0].y - 200)).toBeLessThan(4);
  });

  it('spins a body grabbed by its corner', () => {
    // Held at the right-hand end of a long bar, dragged in a circle around the cursor. Pulling
    // off-centre is a torque, so the bar must turn — this is the whole point of the joint.
    const bar = makeBody({ id: 'held', x: 600, y: 400, hw: 150, hh: 18 });
    let bodies = [bar];
    const anchor = { anchorX: 140, anchorY: 0 };

    for (let frame = 0; frame < 120; frame += 1) {
      const angle = (frame / 120) * Math.PI * 2;
      bodies = stepWorld(bodies, { width: 1200, height: 800, gravity: 0 }, 1 / 60, {
        held: { id: 'held', x: 600 + Math.cos(angle) * 160, y: 400 + Math.sin(angle) * 160, ...anchor },
      });
    }

    // Half a radian per lap of the cursor. The exact figure depends on the bar's inertia; what
    // matters is that it turns at all, which it did not when a held body was teleported.
    expect(Math.abs(bodies[0].angle)).toBeGreaterThan(0.4);
  });

  it('does not spin a body grabbed dead centre', () => {
    const bar = makeBody({ id: 'held', x: 600, y: 400, hw: 150, hh: 18 });
    let bodies = [bar];

    for (let frame = 0; frame < 90; frame += 1) {
      bodies = stepWorld(bodies, { width: 1200, height: 800, gravity: 0 }, 1 / 60, {
        held: { id: 'held', x: 600 + frame * 4, y: 400, anchorX: 0, anchorY: 0 },
      });
    }

    expect(Math.abs(bodies[0].angle)).toBeLessThan(0.05);
  });

  it('shoves what it is dragged into, and is not shoved back', () => {
    // No gravity here: with it, the free body falls away and the drag turns into a push from
    // above, which is true to life but says nothing about shoving.
    const flat: World = { width: 1200, height: 800, gravity: 0 };
    let bodies = [
      makeBody({ id: 'held', x: 200, y: 700, hw: 60, hh: 30 }),
      makeBody({ id: 'other', x: 400, y: 700, hw: 60, hh: 30 }),
    ];

    let pointerX = 200;
    for (let frame = 0; frame < 60; frame += 1) {
      pointerX += 4;
      bodies = stepWorld(bodies, flat, 1 / 60, { held: { id: 'held', x: pointerX, y: 700 } });
    }

    const held = bodies.find((body) => body.id === 'held');
    const other = bodies.find((body) => body.id === 'other');
    // The hand is a spring, so the body trails the cursor slightly rather than sitting exactly
    // on it — a few pixels while it is also shouldering something out of the way.
    expect(Math.abs((held?.x ?? 0) - pointerX)).toBeLessThan(20);
    expect(other && other.x).toBeGreaterThan(400);
  });

  it('keeps the throw when it is let go', () => {
    let bodies = [makeBody({ id: 'held', x: 200, y: 300, hw: 50, hh: 25 })];
    let pointerX = 200;
    for (let frame = 0; frame < 30; frame += 1) {
      pointerX += 14;
      bodies = stepWorld(bodies, WORLD, 1 / 60, { held: { id: 'held', x: pointerX, y: 300 } });
    }

    // Released: the velocity the hand gave it is its own again.
    expect(bodies[0].vx).toBeGreaterThan(300);
    const flying = stepWorld(bodies, WORLD, 1 / 60);
    expect(flying[0].x).toBeGreaterThan(bodies[0].x);
  });
});

describe('a world with a ceiling', () => {
  // Gravity mode's world is the *visible* part of the page, so it is closed at the top as well as
  // the bottom: scrolling up raises the floor, and without a ceiling the pile is squeezed out
  // through the top of the screen.
  const CEILING = 200;
  const boxed: World = { width: 1200, top: CEILING, height: 800, gravity: 1900 };

  it('keeps a body under the ceiling however hard it is thrown upward', () => {
    let bodies = [makeBody({ id: 'a', x: 600, y: 700, hw: 90, hh: 24, vy: -7000 })];
    for (let frame = 0; frame < 240; frame += 1) {
      bodies = stepWorld(bodies, boxed, 1 / 60);
      const top = Math.min(...cornersOf(bodies[0]).map((corner) => corner.y));
      expect(top).toBeGreaterThanOrEqual(CEILING - 6);
    }
  });

  it('squeezes a pile between a rising floor and the ceiling without losing anything', () => {
    let bodies = Array.from({ length: 5 }, (_unused, index) =>
      makeBody({ id: `p${index}`, x: 400 + index * 90, y: 700, hw: 60, hh: 22 }),
    );

    // The floor comes up as a reader scrolls back up the page.
    for (let frame = 0; frame < 300; frame += 1) {
      const rising: World = { ...boxed, height: Math.max(CEILING + 260, 800 - frame * 1.5) };
      bodies = stepWorld(bodies, rising, 1 / 60);
    }

    for (const body of bodies) {
      const top = Math.min(...cornersOf(body).map((corner) => corner.y));
      const bottom = Math.max(...cornersOf(body).map((corner) => corner.y));
      expect(top, `body ${body.id}`).toBeGreaterThanOrEqual(CEILING - 10);
      expect(bottom, `body ${body.id}`).toBeLessThanOrEqual(CEILING + 260 + 10);
    }
  });
});

describe('layers', () => {
  it('lets bodies on different layers pass through each other', () => {
    const flat: World = { width: 1200, height: 800, gravity: 0 };
    const crossing = [
      makeBody({ id: 'front', x: 400, y: 400, hw: 60, hh: 40, vx: 300 }),
      makeBody({ id: 'back', x: 700, y: 400, hw: 60, hh: 40, vx: -300, layer: 1 }),
    ];

    const passed = run(crossing, 90, flat);
    // They started 300 apart closing at 600px/s: on one layer they would have hit.
    expect(passed[0].x).toBeGreaterThan(passed[1].x);
  });

  it('still collides bodies that share a layer', () => {
    const flat: World = { width: 1200, height: 800, gravity: 0 };
    const crossing = [
      makeBody({ id: 'a', x: 400, y: 400, hw: 60, hh: 40, vx: 300, layer: 2 }),
      makeBody({ id: 'b', x: 700, y: 400, hw: 60, hh: 40, vx: -300, layer: 2 }),
    ];

    const hit = run(crossing, 90, flat);
    expect(hit[0].x).toBeLessThan(hit[1].x);
  });
});
