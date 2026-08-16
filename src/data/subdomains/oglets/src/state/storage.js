/* The saved shape of your Oglet — pure, so the test suite can cover it.

   One Oglet, one record. What is stored is its **id** and nothing about its appearance: the id
   redraws the creature, so the format on screen and the format on disk cannot drift apart, and
   a future gene changes nobody's saved data.

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
const cleanDex = (list) => (Array.isArray(list) ? [...new Set(list.filter((x) => VALID_DEX.has(x)))].sort() : [])

export function packOglet(state) {
  return JSON.stringify({
    v: 2,
    id: String(state.id).toLowerCase(),
    bond: Math.round(clamp(state.bond ?? 0, 0, 1) * 1000) / 1000,
    born: Math.round(state.born ?? 0),
    seen: Math.round(state.seen ?? 0),
    dex: cleanDex(state.dex),
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
    name: nameOf(id),
    bond: Number.isFinite(data.bond) ? clamp(data.bond, 0, 1) : 0,
    born: number(data.born, 0),
    seen: number(data.seen, 0),
    dex: cleanDex(data.dex),
  }
}
