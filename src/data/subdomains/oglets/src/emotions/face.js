/* Which face is on, right now, and why.

   **Neutral is the floor.** Everything below is a reason to leave it, and when no reason applies
   it comes back — which is what makes the other faces mean anything. Timed expressions (set by
   `setExpr`) hold until they expire and this only runs once the last one has, so a beat is never
   cut off half way.

   The four ordinary ways out of neutral:

     happy    you are holding it, or it is playing catch with you
     petted   your hand is moving across it, slowly — the nicest thing you can do to it
     angry    you shook it or kept jabbing it
     sad      you did that three times, and it has stopped squaring up to you
     sleepy   you left it alone, or it played until it was worn out

   `focus`, `thinking`, `crying`, `startled` and `crazy` are all reached from those four rather
   than being separate moods of their own: two are what attention looks like, and three are
   earned by something specific happening.

   **A squint is not a mood.** `focus` is only ever worn while it is actually trying to make
   something out, because a face held half shut the whole time it likes you overlaps every other
   expression and stops reading as anything at all. */

import { isPetted } from '../behaviour/pet.js'
import { rand } from '../core/math.js'
import { upsetLook } from './drives.js'

export function settleFace(o, now) {
  const B = o.body
  const d = o.drive
  if (now <= B.exprUntil) return

  if (o.phase === 'asleep') B.expr = 'asleep'
  else if (o.phase === 'sleepy') B.expr = 'sleepy'
  // it gave up somewhere around the third time, and stopped scowling — see drives.js#upsetFace
  else if (d.annoy > 0.5) B.expr = upsetLook(o)
  else if (isPetted(o)) B.expr = 'petted' // your hand is moving on it, and it has gone soft
  else if (d.held > 0.6) B.expr = 'happy' // your hand is resting on it
  else if (o.game.on) B.expr = 'happy' // mid-chase, after you
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
    } else if (d.lonely > 0.85 && !o.dragging) {
      /* Half a minute of you being *here* and not once coming near. Sad is what it does at 0.55
         and it has clearly not worked, so this is the same feeling with nowhere left to go —
         and it costs more of the drive than a sad does, so it is a thing that happens and then
         is over rather than a state it gets stuck in. */
      d.lonely = Math.max(0, d.lonely - 0.55)
      o.setExpr('crying', rand(2.8, 4.2), now)
      B.blinkNow(0.15)
    } else if (d.lonely > 0.55 && !o.dragging) {
      // you are right there, and not looking
      d.lonely = Math.max(0, d.lonely - 0.3)
      o.setExpr('sad', rand(1.6, 2.6), now)
      B.blinkNow(0.2)
    }
  }
}
