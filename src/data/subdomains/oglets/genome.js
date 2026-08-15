/* ═══════════════════════════════════════════════════════════
   OGLETS — the genome layer.

   Everything in here is deterministic and free of the DOM, so the repo's vitest
   suite covers it (this project has no DOM test environment — the rule is that
   anything worth testing gets extracted into a pure function like these).
   Anything that draws, animates or touches the page stays in index.html.

   Weights are the ONLY source of rarity: a trait is rare because its allele is
   rare, not because a table says so. That is also what lets breeding inherit
   alleles directly, later, without any of this being rewritten.
   ═══════════════════════════════════════════════════════════ */

export const GENES = {
  shape: [
    { id: 'round', name: 'Round', w: 0.38, rx: 1.0, ry: 1.03, kT: 0.58, kO: 0.56, kB: 0.56, kI: 0.58 },
    { id: 'egg', name: 'Egg', w: 0.29, rx: 0.86, ry: 1.16, kT: 0.62, kO: 0.54, kB: 0.54, kI: 0.62 },
    { id: 'cat', name: 'Cat', w: 0.21, rx: 1.02, ry: 1.0, kT: 0.32, kO: 0.62, kB: 0.58, kI: 0.5 },
    { id: 'bean', name: 'Bean', w: 0.12, rx: 1.14, ry: 0.9, kT: 0.8, kO: 0.84, kB: 0.84, kI: 0.8 },
  ],
  pupil: [
    { id: 'dot', name: 'Dot', w: 0.46, travel: 0.46, lift: 1.0 },
    { id: 'oval', name: 'Oval', w: 0.27, travel: 0.34, lift: 0.45 },
    { id: 'slit', name: 'Slit', w: 0.17, travel: 0.44, lift: 0.85 },
    { id: 'ring', name: 'Ring', w: 0.1, travel: 0.42, lift: 0.95 },
  ],
  palette: [
    { id: 'moss', name: 'Moss', w: 0.14, e: '#86e6a8', p: '#2c8c5c' },
    { id: 'lagoon', name: 'Lagoon', w: 0.13, e: '#8ad8f0', p: '#26647f' },
    { id: 'peony', name: 'Peony', w: 0.12, e: '#ffb2c8', p: '#9e3a5e' },
    { id: 'amber', name: 'Amber', w: 0.11, e: '#ffcf6b', p: '#a06418' },
    { id: 'bone', name: 'Bone', w: 0.1, e: '#f0e8d6', p: '#5a5045' },
    { id: 'coral', name: 'Coral', w: 0.09, e: '#ff8f70', p: '#9e3623' },
    { id: 'iris', name: 'Iris', w: 0.08, e: '#c2acff', p: '#553aa2' },
    { id: 'lime', name: 'Lime', w: 0.07, e: '#d8f07a', p: '#5b7418' },
    { id: 'jukebox', name: 'Jukebox', w: 0.06, e: '#1a55e8', p: '#ff44b0' },
    { id: 'siren', name: 'Siren', w: 0.05, e: '#d4807e', p: '#8adcea' },
    { id: 'ember', name: 'Ember', w: 0.03, e: '#2b0d0d', p: '#ff5c3a' },
    { id: 'void', name: 'Void', w: 0.02, e: '#2a2a34', p: '#e8e8f2' },
  ],
  finish: [
    { id: 'matte', name: 'Matte', w: 0.9 },
    { id: 'glow', name: 'Glow', w: 0.08 },
    { id: 'prism', name: 'Prism', w: 0.02 },
  ],
}

export const TIERS = [
  { min: 0.3, name: 'Common', c: 't0' },
  { min: 0.16, name: 'Uncommon', c: 't1' },
  { min: 0.08, name: 'Rare', c: 't2' },
  { min: 0.03, name: 'Epic', c: 't3' },
  { min: 0, name: 'Legendary', c: 't4' },
]

/* The categorical genes, in the order they are encoded. Continuous genes are excluded from the
   odds because they always vary — nobody is lucky for having a slightly wider eye gap. */
export const CATS = ['shape', 'pupil', 'palette', 'finish']

/* Continuous genes and their ranges. One table, used by the roller, the encoder and the decoder,
   so the three can never drift apart. */
const RANGES = {
  gap: [0.98, 1.12],
  pupilSize: [0.25, 0.33],
  pace: [0.8, 1.3],
  temper: [0.7, 1.4],
  sociable: [0.6, 1.4],
}
const CODED = ['gap', 'pupilSize', 'pace', 'temper', 'sociable']

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)

export const tierOf = (w) => TIERS.find((t) => w >= t.min)
export const geneOf = (cat, id) => GENES[cat].find((x) => x.id === id) || GENES[cat][0]

export function rollFrom(list, rng = Math.random) {
  let r = rng() * list.reduce((s, x) => s + x.w, 0)
  for (const x of list) {
    if ((r -= x.w) <= 0) return x
  }
  return list[list.length - 1]
}

export function randomGenome(rng = Math.random) {
  const between = (a, b) => a + rng() * (b - a)
  return {
    shape: rollFrom(GENES.shape, rng).id,
    pupil: rollFrom(GENES.pupil, rng).id,
    palette: rollFrom(GENES.palette, rng).id,
    finish: rollFrom(GENES.finish, rng).id,
    // continuous genes — these carry personality and small look drift
    gap: between(...RANGES.gap),
    pupilSize: between(...RANGES.pupilSize),
    asymW: between(0.95, 1.06),
    asymH: between(0.96, 1.04),
    pace: between(...RANGES.pace),
    temper: between(...RANGES.temper),
    sociable: between(...RANGES.sociable),
  }
}

/** The odds of drawing this exact combination of categorical alleles. */
export function odds(g) {
  return CATS.reduce((p, c) => p * geneOf(c, g[c]).w, 1)
}

const C36 = '0123456789abcdefghijklmnopqrstuvwxyz'

/* FNV-1a. Used for everything that must look arbitrary but stay identical forever: an Oglet's name,
   and the two asymmetry genes, which are too small to be worth spending code characters on. */
function hash(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function encode(g) {
  const allele = (cat) => C36[GENES[cat].findIndex((x) => x.id === g[cat])]
  const quantise = (key) => {
    const [a, b] = RANGES[key]
    return C36[clamp(Math.round(((g[key] - a) / (b - a)) * 35), 0, 35)]
  }
  return (CATS.map(allele).join('') + CODED.map(quantise).join('')).toUpperCase()
}

/**
 * The inverse of encode(). Returns null for anything that is not a real code, so a hand-typed or
 * corrupted one degrades to "start fresh" rather than to a broken creature.
 *
 * asymW/asymH are not encoded — nine characters is the budget — so they are derived from a hash
 * of the code instead. That keeps a code round-trippable *and* means the same code always draws
 * the same Oglet, which is the property share links and storage actually depend on.
 */
export function decode(code) {
  if (typeof code !== 'string') return null
  const s = code.trim().toLowerCase()
  if (s.length !== CATS.length + CODED.length) return null

  const g = {}
  for (const [i, cat] of CATS.entries()) {
    const index = C36.indexOf(s[i])
    if (index < 0 || index >= GENES[cat].length) return null
    g[cat] = GENES[cat][index].id
  }
  for (const [i, key] of CODED.entries()) {
    const index = C36.indexOf(s[CATS.length + i])
    if (index < 0) return null
    const [a, b] = RANGES[key]
    g[key] = a + (b - a) * (index / 35)
  }

  const h = hash(s)
  g.asymW = 0.95 + ((h >>> 3) % 111) / 1000
  g.asymH = 0.96 + ((h >>> 11) % 81) / 1000
  return g
}

/* ── names ──────────────────────────────────────────────────
   Derived from the code, never stored: the same Oglet is called the same thing on every device it
   is ever opened on, with no backend and nothing to keep in sync. 320 possibilities is plenty —
   you only ever meet one. */
const HEADS = ['Pob', 'Nix', 'Tur', 'Mol', 'Bim', 'Kes', 'Lun', 'Fip', 'Wob', 'Rue',
  'Zar', 'Hix', 'Gom', 'Mip', 'Syl', 'Dob', 'Vun', 'Tam', 'Orr', 'Quil']
const TAILS = ['ble', 'it', 'low', 'ly', 'py', 'kin', 'na', 'o',
  'er', 'us', 'ie', 'by', 'en', 'im', 'or', 'et']

export function nameOf(genomeOrCode) {
  const code = typeof genomeOrCode === 'string' ? genomeOrCode : encode(genomeOrCode)
  const h = hash(`name:${code}`)
  return HEADS[h % HEADS.length] + TAILS[(h >>> 7) % TAILS.length]
}

/* ── storage ────────────────────────────────────────────────
   One Oglet, one key. The code is stored rather than the genome: it is nine characters, it is
   already the thing shown to the reader, and reading it back through decode() means the format
   the site displays and the format it persists can never disagree. */
export const STORAGE_KEY = 'oglets:v1'

export function packOglet(state) {
  return JSON.stringify({
    v: 1,
    code: state.code,
    bond: Math.round(clamp(state.bond ?? 0, 0, 1) * 1000) / 1000,
    born: Math.round(state.born ?? 0),
    seen: Math.round(state.seen ?? 0),
  })
}

/**
 * Reads a stored Oglet back. Returns null on anything unusable — missing, wrong version, junk
 * JSON, a code that no longer decodes (an allele could be removed in a future release). The
 * caller's job on null is to hatch a new one, never to throw at somebody opening the page.
 */
export function unpackOglet(raw) {
  if (typeof raw !== 'string' || !raw) return null

  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object' || data.v !== 1) return null

  const genome = decode(data.code)
  if (!genome) return null

  const number = (v, fallback) => (Number.isFinite(v) && v > 0 ? v : fallback)
  return {
    code: String(data.code).toUpperCase(),
    genome,
    name: nameOf(data.code),
    bond: Number.isFinite(data.bond) ? clamp(data.bond, 0, 1) : 0,
    born: number(data.born, 0),
    seen: number(data.seen, 0),
  }
}
