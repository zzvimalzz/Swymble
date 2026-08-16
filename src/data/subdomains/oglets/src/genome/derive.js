/* ═══════════════════════════════════════════════════════════
   IDENTITY — an Oglet is a hash, and everything else is derived from it.

   Three properties, and every design choice here serves one of them:

   1. **Nobody else gets yours.** The id is 128 bits from the platform CSPRNG. It is not a seeded
      roll, not a counter, and not derived from anything about you — two people cannot collide.
   2. **The id always redraws the same Oglet.** `genomeOf(id)` is pure. Hand the id to anyone,
      today or in ten years, and they get the same creature — which is what makes it verifiable
      without a server holding a record of it.
   3. **It survives the genome growing.** Each gene is drawn from its OWN stream, keyed by the id
      and the gene's name. Adding `crest` later reads `stream(id, 'crest')` and every existing
      gene comes out byte-identical, because none of them shared a sequence with it. This is the
      whole reason for the domain tag: a single sequential PRNG would re-roll every creature on
      the site the first time a gene was inserted.

   The same mechanism carries change *over time*. A gene named in `AGEING` is drawn from
   `stream(id, 'gene@epoch')`, so an Oglet that ages, earns a cosmetic or settles into a
   personality still derives entirely from its id plus a number — nothing new to store, and the
   whole history is reproducible from the id alone. Epoch 0 is byte-identical to no epoch at all,
   so switching a gene to ageing never disturbs an Oglet that has not aged yet.
   ═══════════════════════════════════════════════════════════ */

import { CATS, GENES, RANGES } from './genes.js'
import { decode } from './codec.js'
import { hash } from './hash.js'
import { rollFrom } from './roll.js'

/** 16 bytes → 32 hex characters. Long enough that "unique" needs no asterisk. */
export const ID_BYTES = 16
const ID_PATTERN = /^[0-9a-f]{32}$/

/** Genes that will be redrawn as an Oglet changes. Empty today; the machinery is not. */
export const AGEING = new Set()

/** A brand new identity. Never derived from anything — the CSPRNG is the whole source. */
export function newId() {
  const bytes = new Uint8Array(ID_BYTES)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const isId = (value) => typeof value === 'string' && ID_PATTERN.test(value.trim().toLowerCase())

/** mulberry32 — small, fast, and good enough for drawing an animal. */
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * One independent random stream per (id, gene). Two genes never share a sequence, so the order
 * genes are added in — or read in — can never change what any of the others draw.
 */
export function streamFor(id, tag, epoch = 0) {
  const domain = AGEING.has(tag) && epoch > 0 ? `${tag}@${epoch}` : tag
  return mulberry32(hash(`oglet/${String(id).toLowerCase()}/${domain}`))
}

/**
 * The genome an id draws. Pure, total, and stable forever.
 *
 * A nine-character code from the first release is still a valid id: it decodes the way it always
 * did, so an Oglet from before ids existed keeps the face it has always had.
 */
export function genomeOf(id, { epoch = 0 } = {}) {
  if (!isId(id)) return decode(id) // legacy nine-character code, or null if it is junk

  const seed = String(id).trim().toLowerCase()
  const draw = (tag) => streamFor(seed, tag, epoch)
  const between = (tag, [a, b]) => a + draw(tag)() * (b - a)

  const g = {}
  for (const cat of CATS) g[cat] = rollFrom(GENES[cat], draw(cat)).id
  for (const key of Object.keys(RANGES)) g[key] = between(key, RANGES[key])
  g.asymW = between('asymW', [0.95, 1.06])
  g.asymH = between('asymH', [0.96, 1.04])
  return g
}

/** A new Oglet: its identity, and the creature that identity draws. */
export function hatchId() {
  const id = newId()
  return { id, genome: genomeOf(id) }
}

/** `a3f19c02…` in groups of eight, which is the only way 32 characters are readable. */
export const groupId = (id, size = 8) =>
  String(id).toUpperCase().match(new RegExp(`.{1,${size}}`, 'g'))?.join(' ') ?? String(id)
