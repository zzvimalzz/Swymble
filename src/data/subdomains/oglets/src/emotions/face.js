/* Which face is on, right now, and why.

   Every branch here names the thing that caused it. Nothing is picked at random: an Oglet that
   looks sad is sad *about* something, which is the whole difference between a character and a
   screensaver. Timed expressions (set by setExpr) hold until they expire; this only runs once
   the last one has, so an emotion is never cut off mid-beat.

   **A squint is not a mood.** `focus` is only ever worn while it is actually trying to make
   something out, because a face held half shut the whole time it likes you overlaps every other
   expression and stops reading as anything at all. */

import { rand } from '../core/math.js'

export function settleFace(o, now) {
  const B = o.body
  const d = o.drive
  if (now <= B.exprUntil) return

  if (o.phase === 'asleep') B.expr = 'asleep'
  else if (o.phase === 'sleepy') B.expr = 'sleepy'
  else if (d.annoy > 0.5) B.expr = 'angry' // you kept jabbing it
  else if (d.held > 0.6) B.expr = 'happy' // your hand is resting on it
  else if (o.attn === 'speck' && now - o.attnAt > 1.1) B.expr = 'focus' // making out something small
  else if (o.attn === 'seek') B.expr = 'focus' // peering at the last place you were
  else if (o.attn === 'muse') B.expr = 'thinking' // away with it, and you can see the question marks
  else if (o.soc.state === 'play') B.expr = 'happy' // mid-game with a friend
  else {
    B.expr = 'neutral'
    if (d.cheer >= 1) {
      // something good just happened — spend it
      d.cheer = 0
      o.setExpr('happy', rand(1.4, 2.4), now)
      if (Math.random() < 0.28) B.wink()
    } else if (d.lonely > 0.55 && !o.dragging) {
      // you are right there, and not looking
      d.lonely = Math.max(0, d.lonely - 0.3)
      o.setExpr('sad', rand(1.6, 2.6), now)
      B.blinkNow(0.2)
    }
  }
}
