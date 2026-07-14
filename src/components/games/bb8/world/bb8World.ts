// Procedural backdrop for BB-8 to roll across — twin suns, a mountain
// horizon, ground underfoot, and occasional landmarks, all vector-drawn (no
// image assets). This module only owns the *geometry*: how many of what,
// where, and how they scroll/respawn. Palette and silhouette style (which
// biome it reads as) live in worldThemes.ts and are applied purely at draw
// time in bb8WorldDraw.ts — swapping themes never touches this state, so
// switching biomes is instant. Layers scroll at different fractions of
// BB-8's own on-screen movement (parallax), and elements that scroll fully
// off one edge respawn on the other with fresh random properties — the same
// wrap-and-recycle idea the original ProcessingJS sketch used for its
// mountains/ground-spots/stars.

export const WORLD_CANVAS_H = 460;
export const WORLD_GROUND_Y = 318;

const randRange = (min: number, max: number) => min + Math.random() * (max - min);

export interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

export interface Sun {
  x: number;
  y: number;
}

export interface Dune {
  x: number;
  w: number;
  h: number;
}

export interface GroundProp {
  x: number;
  yFrac: number;
  size: number;
  /** Two reusable archetypes themed by color: a rounded ground-level blob, or an upward tuft/spike. */
  kind: 'blob' | 'tuft';
}

export type LandmarkKind = 'spike' | 'wreck' | 'cluster' | 'dome';

export interface Landmark {
  x: number;
  kind: LandmarkKind;
  scale: number;
}

export interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export interface BB8World {
  stars: Star[];
  suns: Sun[];
  farPeaks: Dune[];
  farDunes: Dune[];
  nearDunes: Dune[];
  groundProps: GroundProp[];
  landmarks: Landmark[];
  dust: Dust[];
  landmarkTimer: number;
}

const STAR_PARALLAX = 0.04;
const SUN_PARALLAX = 0.015;
const FAR_PEAK_PARALLAX = 0.12;
const FAR_DUNE_PARALLAX = 0.22;
const NEAR_DUNE_PARALLAX = 0.5;
const GROUND_PARALLAX = 1;
const LANDMARK_PARALLAX = NEAR_DUNE_PARALLAX;

const FAR_PEAK_SEGMENT_W = 320;
const FAR_DUNE_SEGMENT_W = 160;
const NEAR_DUNE_SEGMENT_W = 190;

const MAX_LANDMARKS = 5;

function makeFarPeak(x: number, w: number): Dune {
  return { x, w, h: randRange(60, 145) };
}

function makeFarDune(x: number, w: number): Dune {
  return { x, w, h: randRange(30, 70) };
}

function makeNearDune(x: number, w: number): Dune {
  return { x, w, h: randRange(60, 130) };
}

function randomGroundPropKind(): GroundProp['kind'] {
  return Math.random() < 0.35 ? 'tuft' : 'blob';
}

export function createBB8World(canvasW: number): BB8World {
  const starCount = Math.round(canvasW / 9);
  const stars: Star[] = Array.from({ length: starCount }, () => ({
    x: randRange(0, canvasW),
    y: randRange(12, WORLD_GROUND_Y - 60),
    radius: randRange(0.6, 1.8),
    opacity: randRange(0.25, 0.9),
  }));

  const farPeakCount = Math.ceil(canvasW / FAR_PEAK_SEGMENT_W) + 2;
  const farPeaks: Dune[] = Array.from({ length: farPeakCount }, (_, i) =>
    makeFarPeak((i - 1) * FAR_PEAK_SEGMENT_W, FAR_PEAK_SEGMENT_W * 1.3),
  );

  const farDuneCount = Math.ceil(canvasW / FAR_DUNE_SEGMENT_W) + 2;
  const farDunes: Dune[] = Array.from({ length: farDuneCount }, (_, i) =>
    makeFarDune((i - 1) * FAR_DUNE_SEGMENT_W, FAR_DUNE_SEGMENT_W * 1.35),
  );

  const nearDuneCount = Math.ceil(canvasW / NEAR_DUNE_SEGMENT_W) + 2;
  const nearDunes: Dune[] = Array.from({ length: nearDuneCount }, (_, i) =>
    makeNearDune((i - 1) * NEAR_DUNE_SEGMENT_W, NEAR_DUNE_SEGMENT_W * 1.3),
  );

  const groundPropCount = Math.round(canvasW / 10);
  const groundProps: GroundProp[] = Array.from({ length: groundPropCount }, () => ({
    x: randRange(0, canvasW),
    yFrac: randRange(0.12, 0.94),
    size: randRange(3, 12),
    kind: randomGroundPropKind(),
  }));

  return {
    stars,
    suns: [
      { x: canvasW * 0.76, y: 44 },
      { x: canvasW * 0.815, y: 56 },
    ],
    farPeaks,
    farDunes,
    nearDunes,
    groundProps,
    landmarks: [],
    dust: [],
    landmarkTimer: Math.round(randRange(90, 220)),
  };
}

function wrapStar(star: Star, deltaX: number, canvasW: number) {
  star.x -= deltaX * STAR_PARALLAX;
  if (star.x < -10) {
    star.x = canvasW + randRange(0, 20);
  } else if (star.x > canvasW + 10) {
    star.x = -randRange(0, 20);
  } else {
    return;
  }
  star.y = randRange(12, WORLD_GROUND_Y - 60);
  star.radius = randRange(0.6, 1.8);
  star.opacity = randRange(0.25, 0.9);
}

function wrapSun(sun: Sun, deltaX: number, canvasW: number) {
  sun.x -= deltaX * SUN_PARALLAX;
  if (sun.x < -60) sun.x = canvasW + 60;
  else if (sun.x > canvasW + 60) sun.x = -60;
}

function wrapDune(dune: Dune, deltaX: number, parallax: number, canvasW: number, make: (x: number, w: number) => Dune) {
  dune.x -= deltaX * parallax;
  if (dune.x + dune.w < -20) {
    Object.assign(dune, make(canvasW + randRange(0, 30), dune.w));
  } else if (dune.x > canvasW + 20) {
    Object.assign(dune, make(-dune.w - randRange(0, 30), dune.w));
  }
}

function wrapGroundProp(prop: GroundProp, deltaX: number, canvasW: number) {
  prop.x -= deltaX * GROUND_PARALLAX;
  if (prop.x < -20) {
    prop.x = canvasW + randRange(0, 30);
  } else if (prop.x > canvasW + 20) {
    prop.x = -randRange(0, 30);
  } else {
    return;
  }
  prop.yFrac = randRange(0.12, 0.94);
  prop.size = randRange(3, 12);
  prop.kind = randomGroundPropKind();
}

const LANDMARK_KINDS: LandmarkKind[] = ['spike', 'wreck', 'cluster', 'dome'];

/**
 * The droid never actually moves on screen anymore (the scene is infinite —
 * see BB8.tsx), so `speed` alone *is* the world's scroll delta this frame;
 * there's no separate clamped "realized travel" to distinguish it from.
 * dustOriginX is the droid's fixed on-canvas screen x (where its shadow
 * touches the ground).
 */
export function updateBB8World(world: BB8World, canvasW: number, speed: number, dustOriginX: number) {
  const deltaX = speed;
  for (const star of world.stars) wrapStar(star, deltaX, canvasW);
  for (const sun of world.suns) wrapSun(sun, deltaX, canvasW);
  for (const peak of world.farPeaks) wrapDune(peak, deltaX, FAR_PEAK_PARALLAX, canvasW, makeFarPeak);
  for (const dune of world.farDunes) wrapDune(dune, deltaX, FAR_DUNE_PARALLAX, canvasW, makeFarDune);
  for (const dune of world.nearDunes) wrapDune(dune, deltaX, NEAR_DUNE_PARALLAX, canvasW, makeNearDune);
  for (const prop of world.groundProps) wrapGroundProp(prop, deltaX, canvasW);

  for (const landmark of world.landmarks) landmark.x -= deltaX * LANDMARK_PARALLAX;
  world.landmarks = world.landmarks.filter((landmark) => landmark.x > -80 && landmark.x < canvasW + 80);

  if (Math.abs(speed) > 0.5) {
    world.landmarkTimer -= 1;
    if (world.landmarkTimer <= 0 && world.landmarks.length < MAX_LANDMARKS) {
      const spawnFromRight = deltaX >= 0;
      world.landmarks.push({
        x: spawnFromRight ? canvasW + 40 : -40,
        kind: LANDMARK_KINDS[Math.floor(Math.random() * LANDMARK_KINDS.length)],
        scale: randRange(0.7, 1.4),
      });
      world.landmarkTimer = Math.round(randRange(110, 260));
    }
  }

  // Dust kicked up behind BB-8 while it's rolling fast.
  if (Math.abs(speed) > 9) {
    world.dust.push({
      x: dustOriginX,
      y: WORLD_GROUND_Y + 4,
      vx: speed * randRange(0.4, 0.5),
      vy: randRange(-4, -2),
      radius: randRange(1.5, 3.5),
      opacity: 0.8,
    });
  }
  for (const particle of world.dust) {
    particle.x -= particle.vx;
    particle.vy += 0.12;
    particle.y = Math.min(particle.y + particle.vy, WORLD_GROUND_Y + 26);
    particle.opacity -= 0.025;
  }
  world.dust = world.dust.filter((particle) => particle.opacity > 0);
}
