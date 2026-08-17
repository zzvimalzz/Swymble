/* The saved shape of your Oglet — pure, so the test suite can cover it.

   One Oglet, one record. What is stored is its **id** and nothing about its appearance: the id
   redraws the creature, so the format on screen and the format on disk cannot drift apart, and
   a future gene changes nobody's saved data.

   **A chosen name is the one exception, and it has to be.** Every other thing about an Oglet is a
   pure function of 128 random bits — including the name it is born with (`nameOf(id)`). A name you
   picked cannot be a function of those bits, because the bits came first and they are what draws
   the creature; writing a name *into* the hash would change the hash and therefore change the
   animal. So it is stored beside the id, and `session.js#shareCode` is what carries the two of
   them together when the id leaves this device.

   v1 records held a nine-character code instead. They are still read, and the code is carried
   forward as the id — `genomeOf()` knows how to draw one. An Oglet from the first release keeps
   the face it has always had. */

import { clamp } from '../core/math.js'
import { CATS, GENES, genomeOf, isId, nameOf } from '../genome/index.js'

export const STORAGE_KEY = 'oglets:v2'
/** The first release's key. Read once, on the way to v2; never written again. */
export const LEGACY_KEY = 'oglets:v1'

const VALID_DEX = new Set(CATS.flatMap((cat) => GENES[cat].map((a) => `${cat}:${a.id}`)))

/** Discovered alleles, as `cat:allele`. Unknown entries are dropped, so removing an allele in a
    future release cannot resurrect it as a ghost in somebody's dex. */

/**
 * A name somebody typed. Letters, digits, spaces and a few marks; trimmed, collapsed and capped.
 *
 * **Filtered on the way in rather than escaped on the way out.** A chosen name is the only thing
 * about an Oglet that did not come out of a hash, it is written straight into the Genome page's
 * markup, and this module is the one seam every record already passes through — so the allowlist
 * lives here, once, instead of at every place a name is drawn. Anything unusable comes back empty
 * and the caller falls back to the name the id draws.
 *
 * Unicode-aware on purpose: `\p{L}` keeps every alphabet, which an ASCII range would not.
 */
export function cleanName(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[^\p{L}\p{N} '’-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18)
}

const cleanDex = (list) => (Array.isArray(list) ? [...new Set(list.filter((x) => VALID_DEX.has(x)))].sort() : [])

export function packOglet(state) {
  return JSON.stringify({
    v: 2,
    id: String(state.id).toLowerCase(),
    // only when it differs from the name the id draws — an unrenamed Oglet stores nothing extra
    name: state.name && state.name !== nameOf(state.id) ? cleanName(state.name) : undefined,
    bond: Math.round(clamp(state.bond ?? 0, 0, 1) * 1000) / 1000,
    born: Math.round(state.born ?? 0),
    seen: Math.round(state.seen ?? 0),
    dex: cleanDex(state.dex),
    /* The egg. `hatched` is the only gate on ever showing it again; `eggAt` is when it was laid
       and `eggHelp` the seconds of tapping banked into it — both stored, because a five-minute
       hatch that restarted on every reload would be an insult rather than a wait. */
    hatched: state.hatched !== false,
    eggAt: Math.round(state.eggAt ?? 0),
    eggHelp: Math.round(clamp(state.eggHelp ?? 0, 0, 3600)),
  })
}

/**
 * Reads a stored Oglet back. Returns null on anything unusable — missing, wrong version, junk
 * JSON, an id that no longer draws a creature. The caller's job on null is to hatch a new one,
 * never to throw at somebody opening the page.
 */
export function unpackOglet(raw) {
  if (typeof raw !== 'string' || !raw) return null

  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  if (data.v !== 1 && data.v !== 2) return null

  // v1 stored `code`; a code is a perfectly good id, it is simply an older kind of one
  const id = String(data.v === 1 ? (data.code ?? '') : (data.id ?? '')).trim().toLowerCase()
  const genome = genomeOf(id)
  if (!genome) return null

  const number = (v, fallback) => (Number.isFinite(v) && v > 0 ? v : fallback)
  return {
    id,
    legacy: !isId(id),
    genome,
    name: cleanName(data.name) || nameOf(id),
    bond: Number.isFinite(data.bond) ? clamp(data.bond, 0, 1) : 0,
    born: number(data.born, 0),
    seen: number(data.seen, 0),
    dex: cleanDex(data.dex),
    /* **Anything saved before the egg existed counts as hatched.** A v1 record, or a v2 one with
       no `hatched` field, belongs to somebody who already has an Oglet and has had it for months
       — showing them an egg would be taking it away. Only an explicit `false` means unhatched. */
    hatched: data.hatched !== false,
    eggAt: number(data.eggAt, 0),
    eggHelp: Number.isFinite(data.eggHelp) ? clamp(data.eggHelp, 0, 3600) : 0,
  }
}
