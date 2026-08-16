/* YOURS — one Oglet, hatched the first time you ever open the page and kept in this browser
   afterwards. If the store is empty, unreadable, or holds an id that no longer draws a
   creature, a new one hatches; nothing here ever throws at somebody opening the page.

   There is deliberately no reroll. Being able to replace it on a whim is exactly what would
   stop it mattering. */

import { hatchId, nameOf } from '../genome/index.js'
import { LEGACY_KEY, STORAGE_KEY, packOglet, unpackOglet } from './storage.js'

const store = {
  read() {
    try {
      // v2 first; an Oglet from the first release is picked up from the old key and rewritten
      return unpackOglet(localStorage.getItem(STORAGE_KEY)) ?? unpackOglet(localStorage.getItem(LEGACY_KEY))
    } catch {
      return null
    }
  },
  write(state) {
    try {
      localStorage.setItem(STORAGE_KEY, packOglet(state))
    } catch {
      /* private mode, quota, a disabled store — none of these are worth a broken page */
    }
  },
}

export function hatch() {
  const { id, genome } = hatchId()
  const at = Date.now()
  return { id, genome, name: nameOf(id), bond: 0, born: at, seen: at, dex: [] }
}

const saved = store.read()

/** The Oglet this browser owns. Mutated in place; `persist()` writes it back. */
export const mine = saved ?? hatch()

/** True only on the very first visit — the one time the copy gets to say "meet". */
export const firstMeeting = !saved

/** Milliseconds since you were last here. Decides how warm the greeting is. */
export const awayFor = firstMeeting ? 0 : Math.max(0, Date.now() - mine.seen)

/** Long enough that it gave up waiting and went to sleep. */
export const SLEPT_AWAY = 6 * 3600e3

if (firstMeeting) store.write(mine)

let bondSource = null

/** Tells the session where to read the live bond from, so persistence needs no world import. */
export const trackBond = (fn) => {
  bondSource = fn
}

export function persist() {
  if (bondSource) mine.bond = bondSource() ?? mine.bond
  mine.seen = Date.now()
  store.write(mine)
}

export function startPersisting() {
  addEventListener('pagehide', persist)
  setInterval(persist, 10000)
}
