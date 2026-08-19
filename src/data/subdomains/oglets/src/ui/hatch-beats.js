/* ═══════════════════════════════════════════════════════════
   THE HATCHING SCHEDULE — five minutes, as arithmetic.

   Kept apart from `ui/hatch.js` and free of every import so the test suite can cover it: the
   schedule is the part most likely to be wrong and the only part of the sequence that can be
   checked without a browser.

   **Progress is seconds, and it is derived from a stored timestamp, never counted.** An egg that
   ran on a frame counter would reset every time the tab was closed, and asking a stranger to sit
   through five uninterrupted minutes is not a thing anybody would do. `eggAt` is when it was
   laid; leave, come back, and it has been getting on with it.

   Tapping does not skip ahead — it gives the thing inside a hand, and the credit is banked in
   `eggHelp` so it survives a reload too. Capped at `MAX_HELP`, which is deliberately exactly half
   of `FULL`: **however hard you work at it, it takes two and a half minutes; ignore it entirely
   and it takes five.**

   **A tap is worth one second, and it is the only way through.** There is no longer a button that
   opens the egg — the wait is the thing, and an escape hatch beside it says the wait was never
   real. One second is the point: it is small enough that the clock has to be *worked* down over a
   hundred and fifty deliberate taps, and it is a number a visitor can read straight off the line
   above it, which three never was.
   ═══════════════════════════════════════════════════════════ */

/** Seconds from laid to hatched, untouched. */
export const FULL = 300
/** The most tapping can take off it — half. */
export const MAX_HELP = 150
/**
 * Seconds of credit per tap, and the gap below which a tap does not count. Mashing is not work.
 *
 * The gap is what keeps the pair honest. At one second a tap, a masher at eight a second would
 * clear the whole `MAX_HELP` in under twenty — which is the button this replaced, wearing a
 * different hat. Throttled to `TAP_GAP`, the best anybody can do is 1s of credit per 0.6s of
 * waiting, so the floor at two and a half minutes still costs a minute and a half of tapping.
 */
export const TAP_HELP = 1
export const TAP_GAP = 0.6

/**
 * The beats, as the fraction of `FULL` each one ends at. Numbers rather than durations because
 * every question asked of this table is "where are we now", never "how long is beat 3".
 *
 * `cracks` is how many are showing by the END of the beat, so the count only ever grows.
 */
export const BEATS = [
  { id: 'arrival', name: 'Laid', until: 0.02, cracks: 0, rock: 0 },
  { id: 'settling', name: 'Something turned over', until: 0.14, cracks: 0, rock: 0.25 },
  { id: 'stirring', name: 'Stirring', until: 0.4, cracks: 2, rock: 0.55 },
  { id: 'working', name: 'Working at it', until: 0.985, cracks: 6, rock: 1 },
  { id: 'break', name: 'Breaking', until: 1, cracks: 6, rock: 1 },
]

/** Total cracks the shell can carry. The last beat adds none — it opens the ones already there. */
export const MAX_CRACKS = BEATS[BEATS.length - 1].cracks

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * How far along an egg laid at `eggAt` is, in seconds, given the credit banked into `help`.
 * Clamped at `FULL`: an egg that has been sitting for a week is not overdue, it is hatched.
 */
export function progressOf(eggAt, help = 0, now = 0) {
  if (!eggAt) return 0
  const real = Math.max(0, (now - eggAt) / 1000)
  const credit = Math.min(Math.max(0, help), MAX_HELP)
  return Math.min(FULL, real + credit)
}

/** What one tap is worth, or null if it came too soon after the last one to count. */
export function creditTap(help, lastTapAt, now) {
  if (now - lastTapAt < TAP_GAP) return null
  return Math.min(MAX_HELP, Math.max(0, help) + TAP_HELP)
}

/**
 * The state of the shell at `progress` seconds.
 *
 * `rock` is how hard it is moving, 0…1. `cracks` is a whole number and **never decreases** as
 * progress rises — a crack that healed would be a bug you could watch. `thumpRate` is beats per
 * second: every visible change is timed to one of these rather than eased in, because a crack
 * that grows smoothly reads as a progress bar and a crack that appears the instant the shell
 * jerks reads as something hitting it from the inside.
 */
export function beatAt(progress) {
  const p = clamp01(progress / FULL)
  let index = BEATS.length - 1
  for (let i = 0; i < BEATS.length; i++) {
    if (p <= BEATS[i].until) {
      index = i
      break
    }
  }
  const beat = BEATS[index]
  const from = index === 0 ? 0 : BEATS[index - 1].until
  const span = beat.until - from
  const phase = span > 0 ? clamp01((p - from) / span) : 1

  const prevCracks = index === 0 ? 0 : BEATS[index - 1].cracks
  const cracks = prevCracks + Math.floor((beat.cracks - prevCracks) * phase + 1e-9)
  const prevRock = index === 0 ? 0 : BEATS[index - 1].rock
  const rock = prevRock + (beat.rock - prevRock) * phase

  return {
    index,
    id: beat.id,
    name: beat.name,
    phase,
    beat: index + 1,
    cracks: Math.min(MAX_CRACKS, cracks),
    rock,
    // it works harder the closer it gets: one thump every four seconds at first, three a second at the end
    thumpRate: 0.25 + rock * 2.75,
    done: p >= 1,
  }
}

/** Whole seconds left, for the one line of copy that admits how long this takes. */
export const remainingOf = (progress) => Math.max(0, Math.ceil(FULL - progress))

/* ── the flash ──────────────────────────────────────────────
   The shell parts, light fills the screen **completely**, and while nothing can be seen the egg is
   taken away and the creature is put in its place. Then the light fades off it.

   The full cover is the mechanism, not the decoration: it is what buys the swap. A flash that only
   ever reached 0.9 left the shards and the creature faintly visible through it, so the change
   happened in front of you and the whole thing read as a dissolve between two drawings instead of
   one thing having become another.

   `hold` exists for the same reason a stage blackout does — long enough that the change is
   certainly finished before the light comes back, short enough that nobody thinks the page broke.

   Reduced motion keeps the cover and loses the strobe: it takes over a second to reach full rather
   than a sixth of one. A slow wash to white is not a photosensitivity risk; a sudden one is. */
export const FLASH = { up: 0.16, hold: 0.28, fade: 1.7, calmUp: 1.1, calmFade: 1.4 }

/** Light over the screen, 0…1, `lit` seconds after the shell finished coming apart. */
export function flashAt(lit, calm = false) {
  if (!(lit >= 0)) return 0
  const up = calm ? FLASH.calmUp : FLASH.up
  const fade = calm ? FLASH.calmFade : FLASH.fade
  if (lit < up) return lit / up
  if (lit < up + FLASH.hold) return 1
  const left = 1 - (lit - up - FLASH.hold) / fade
  return left <= 0 ? 0 : left ** 1.5
}

/**
 * True once the light is total — the window in which the egg must be gone and the creature must be
 * there. Everything that draws the sequence keys the swap off this rather than off its own timer,
 * so the two can never drift apart and reveal the join.
 */
export const flashCovers = (lit, calm = false) => lit >= (calm ? FLASH.calmUp : FLASH.up)

/** How long the whole flash lasts, so a caller can size the beat that contains it. */
export const flashLength = (calm = false) =>
  (calm ? FLASH.calmUp + FLASH.calmFade : FLASH.up + FLASH.fade) + FLASH.hold
