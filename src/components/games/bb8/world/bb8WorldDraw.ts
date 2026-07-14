// Rendering for the bb8World.ts backdrop — plain Canvas 2D calls (no need for
// the Pen/Processing-style shim here, this scenery is original, not ported).
// Every color/shape choice comes from the active WorldTheme (worldThemes.ts);
// this file never hardcodes a palette, so switching themes is just passing a
// different object in. Draw order (see BB8.tsx) is back-to-front: sky,
// stars, suns, far peaks, dune layers, landmarks, ground, ground props,
// dust — the character is drawn last, on top of all of it.
import type { BB8World, Dune } from './bb8World';
import type { WorldTheme } from './worldThemes';

export function drawSky(ctx: CanvasRenderingContext2D, canvasW: number, groundY: number, theme: WorldTheme) {
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyHorizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvasW, groundY);
}

export function drawStars(ctx: CanvasRenderingContext2D, world: BB8World, theme: WorldTheme) {
  for (const star of world.stars) {
    ctx.fillStyle = `rgba(${theme.starColor}, ${star.opacity})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSuns(ctx: CanvasRenderingContext2D, world: BB8World, theme: WorldTheme) {
  const [primary, secondary] = world.suns;
  if (!primary) return;

  ctx.fillStyle = theme.sunGlow;
  ctx.beginPath();
  ctx.arc(primary.x, primary.y, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.sunPrimary;
  ctx.beginPath();
  ctx.arc(primary.x, primary.y, 22, 0, Math.PI * 2);
  ctx.fill();

  if (theme.sunSecondary && secondary) {
    ctx.fillStyle = theme.sunSecondary;
    ctx.beginPath();
    ctx.arc(secondary.x, secondary.y, 13, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRidgeLayer(ctx: CanvasRenderingContext2D, dunes: Dune[], groundY: number, color: string, jagged: boolean) {
  ctx.fillStyle = color;
  for (const dune of dunes) {
    ctx.beginPath();
    ctx.moveTo(dune.x, groundY);
    if (jagged) {
      ctx.lineTo(dune.x + dune.w * 0.5, groundY - dune.h);
      ctx.lineTo(dune.x + dune.w, groundY);
    } else {
      ctx.quadraticCurveTo(dune.x + dune.w / 2, groundY - dune.h, dune.x + dune.w, groundY);
    }
    ctx.closePath();
    ctx.fill();
  }
}

/** Distant, hazy mountain silhouette behind everything else — always jagged, regardless of theme's own dune style. */
export function drawFarPeaks(ctx: CanvasRenderingContext2D, world: BB8World, groundY: number, theme: WorldTheme) {
  drawRidgeLayer(ctx, world.farPeaks, groundY, theme.farPeakColor, true);
}

export function drawFarDunes(ctx: CanvasRenderingContext2D, world: BB8World, groundY: number, theme: WorldTheme) {
  drawRidgeLayer(ctx, world.farDunes, groundY, theme.farDuneColor, theme.duneStyle === 'peak');
}

export function drawNearDunes(ctx: CanvasRenderingContext2D, world: BB8World, groundY: number, theme: WorldTheme) {
  drawRidgeLayer(ctx, world.nearDunes, groundY, theme.nearDuneColor, theme.duneStyle === 'peak');
}

export function drawLandmarks(ctx: CanvasRenderingContext2D, world: BB8World, groundY: number, theme: WorldTheme) {
  ctx.fillStyle = theme.landmarkColor;
  for (const landmark of world.landmarks) {
    const s = landmark.scale;
    const x = landmark.x;
    if (landmark.kind === 'dome') {
      // A small clustered homestead — moisture-farm-style domes half-sunk into the ground.
      for (const dome of [
        { dx: 0, r: 15 * s },
        { dx: 23 * s, r: 10 * s },
        { dx: -21 * s, r: 9 * s },
      ]) {
        ctx.beginPath();
        ctx.arc(x + dome.dx, groundY, dome.r, Math.PI, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
      }
      continue;
    }
    ctx.beginPath();
    if (landmark.kind === 'spike') {
      ctx.moveTo(x, groundY);
      ctx.lineTo(x - 10 * s, groundY - 46 * s);
      ctx.lineTo(x, groundY - 60 * s);
      ctx.lineTo(x + 10 * s, groundY - 46 * s);
      ctx.closePath();
    } else if (landmark.kind === 'wreck') {
      ctx.moveTo(x, groundY);
      ctx.lineTo(x + 30 * s, groundY - 4 * s);
      ctx.lineTo(x + 54 * s, groundY - 18 * s);
      ctx.lineTo(x + 18 * s, groundY - 10 * s);
      ctx.closePath();
    } else {
      ctx.moveTo(x, groundY);
      ctx.lineTo(x + 8 * s, groundY - 22 * s);
      ctx.lineTo(x + 20 * s, groundY - 10 * s);
      ctx.lineTo(x + 30 * s, groundY - 28 * s);
      ctx.lineTo(x + 40 * s, groundY);
      ctx.closePath();
    }
    ctx.fill();
  }
}

export function drawGround(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, groundY: number, theme: WorldTheme) {
  const ground = ctx.createLinearGradient(0, groundY, 0, canvasH);
  ground.addColorStop(0, theme.groundTop);
  ground.addColorStop(1, theme.groundBottom);
  ctx.fillStyle = ground;
  ctx.fillRect(0, groundY, canvasW, canvasH - groundY);
}

export function drawGroundProps(ctx: CanvasRenderingContext2D, world: BB8World, groundY: number, canvasH: number, theme: WorldTheme) {
  const bandH = canvasH - groundY;
  for (const prop of world.groundProps) {
    const y = groundY + prop.yFrac * bandH;
    if (prop.kind === 'blob') {
      ctx.fillStyle = theme.propBlob;
      ctx.beginPath();
      ctx.ellipse(prop.x, y, prop.size, prop.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = theme.propTuft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(prop.x, y);
      ctx.lineTo(prop.x - prop.size * 0.4, y - prop.size);
      ctx.moveTo(prop.x, y);
      ctx.lineTo(prop.x, y - prop.size * 1.2);
      ctx.moveTo(prop.x, y);
      ctx.lineTo(prop.x + prop.size * 0.4, y - prop.size);
      ctx.stroke();
    }
  }
}

export function drawDust(ctx: CanvasRenderingContext2D, world: BB8World) {
  for (const particle of world.dust) {
    ctx.fillStyle = `rgba(200, 175, 130, ${particle.opacity})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
