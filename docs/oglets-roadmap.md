# Oglets — where it goes next

A plan for three things: **personality**, **toys and reasons to return**, and **more than one
Oglet**. Written against the code as it stands on `claude/oglets-improvements-planning-iuxvwa`,
so every proposal below names the file it lands in.

Nothing here is committed to. The last section is the list of decisions that are yours.

---

## 0 · Where it actually stands

Three things are **already built, already tested, and wired to nothing**. That is the single most
important fact in this document, because it means the first phase is mostly connection rather
than construction.

| Built | Where | Consumed by |
| --- | --- | --- |
| **A twelve-character personality system** | `genome/character.js` — 8 temperaments + 4 extremes, each with a `tell` and a `bias` | **Nothing.** `characterOf()` is exported through `genome/index.js` and imported by no page and no behaviour. |
| **Three scripted beats** — Orbit, Burst, Comet | `behaviour/beats.js`, `render/decor.js` | `#/assets` and `#/lab` only. `render/body.js:366` says so in as many words: *"Nothing in the creature's own logic starts a beat."* |
| **Ageing / epoch machinery** | `genome/derive.js` — `AGEING`, `streamFor(id, tag, epoch)` | `AGEING` is an empty Set. Epoch 0 is byte-identical to no epoch, so switching a gene on disturbs nobody. |

And two more that matter for the third question:

- **`population` is an array written for many.** `behaviour/social.js` (approach → engage → play),
  `behaviour/separate.js`, `bump()`, and the yawn contagion in `behaviour/sleep.js` are all
  written for a crowd. `world/world.js` pushes exactly one. Growing the world is a `push()`.
- **Per-gene random streams.** `streamFor(id, gene)` means a *new gene added tomorrow redraws
  nobody*. That is what makes new personality genes cheap and it is the reason the design below
  leans on them.

### What "random reactions" actually is

It is worth being precise, because the code is better than it looks from the outside. Nothing an
Oglet feels is random — `emotions/drives.js` and `emotions/face.js` enforce that every expression
is caused, and `README.md` rule 2 states it: *"No expression is ever picked at random."*

The problem is not randomness. **The problem is that every Oglet is the same creature.** Only
three genes touch behaviour at all — `pace`, `temper`, `sociable` — and between them they are
read in ten places:

| Gene | Every place it is read | Effect |
| --- | --- | --- |
| `pace` | `oglet.js:308` drift interval · `oglet.js:338` steer spring · `attention.js` wander interval · `oglet.js:359` breathe rate | how fast it moves |
| `temper` | `drives.js:114` poke · `drives.js:158` shake · `drives.js:95` gives-up · `oglet.js:139–142` `receive()` · `oglet.js:280` drag | how easily it takes offence |
| `sociable` | `social.js:18,24` `nextTry` only | how soon it tries a peer — invisible in a world of one |

So of three personality axes, one is literally unobservable today, one is a speed multiplier, and
one only shows up if you are unkind to it. Two Oglets side by side would be told apart by their
colours and nothing else.

**That is the gap to close, and it is a wiring job, not a redesign.**

---

## 1 · Personality

### 1.1 The shape: three layers, one of them new

```
axes        pace · temper · sociable          continuous genes, already rolled     KEEP
character   Lull · Spark · Tinder · …         DERIVED from the axes                SURFACE + WIRE
quirk       one signature habit               a NEW rolled gene                    ADD (phase 6)
```

**Keep the character derived, do not roll it.** `genome/character.js:8` already argues this and
the argument is right: a rolled `nature` gene sits *beside* the numbers that decide how the thing
actually behaves and can contradict them. An Oglet labelled "Placid" with a temper of 1.38 is a
lie the first time you poke it. Derived, the label can only ever describe what you are about to
see.

The **quirk** is different and can be rolled, because it is not a summary of anything — it is one
extra habit bolted on. See §1.5.

### 1.2 Wire the bias table

Every character already carries a `bias` string describing the code path it should lean on. They
are documentation. Turn them into numbers.

New file: **`src/genome/personality.js`** — pure, testable, no DOM, sits beside `character.js`.

```js
// The knobs a character is allowed to turn. Defaults are 1 (or 0), so an unwired
// character behaves exactly as today and nothing regresses.
export const NEUTRAL = {
  sleepAfter: 1,     // multiplies the 18–32s boredom clock
  napFor:     1,
  driftEvery: 1,     // multiplies the 3–7.5s wander interval
  driftRange: 1,     // multiplies the 0.14 × minSide drift radius
  annoyDecay: 1,     // multiplies drives.js's 0.09/s forgiveness
  annoyGain:  1,     // multiplies the poke/shake hit
  cheerGain:  1,     // multiplies how fast good things bank
  bondGain:   1,     // multiplies bond accrual from holding and stroking
  socialTry:  1,     // divides soc.nextTry
  startleOdds:1,     // multiplies the 0.35 blink-on-startle and startle duration
  playOdds:   1,     // multiplies the chance a release starts a round of catch
  chaseBias:  0.5,   // P(taking the chase role) in a peer game
  lean:       1,     // multiplies the 0.09 + bond×0.07 pull toward the pointer
}

export const BIASES = {
  lull:    { sleepAfter: 0.6, driftRange: 0.5, cheerGain: 1.2 },
  hearth:  { bondGain: 1.5, socialTry: 0.5, lean: 0.5 },
  sulk:    { annoyDecay: 0.55, annoyGain: 1.1 },
  bramble: { socialTry: 1.6, annoyDecay: 0.7, cheerGain: 0.85 },
  flit:    { driftEvery: 0.5, driftRange: 1.4, sleepAfter: 1.3 },
  spark:   { cheerGain: 1.6, lean: 1.5, playOdds: 1.2 },
  skitter: { startleOdds: 1.9, driftEvery: 0.6, sleepAfter: 1.2 },
  tussle:  { playOdds: 1.5, chaseBias: 0.95, annoyDecay: 1.2 },
  tinder:  { annoyGain: 2.2, annoyDecay: 0.8 },
  placid:  { annoyGain: 0.25, annoyDecay: 1.8, bondGain: 1.2 },
  magnet:  { socialTry: 4, lean: 1.4 },
  drowse:  { driftEvery: 1.8, sleepAfter: 0.7, startleOdds: 0.6 },
}

export const biasOf = (character) => ({ ...NEUTRAL, ...(BIASES[character?.id] ?? {}) })
```

Then in `behaviour/oglet.js`'s constructor: `this.ch = characterOf(g)` and `this.bias =
biasOf(this.ch)` — one lookup, once, per creature. Thread it through **fourteen named seams**:

| Seam | File · line today | Change |
| --- | --- | --- |
| boredom clock | `oglet.js:39` and `oglet.js:120` — `rand(18,32)` | `× bias.sleepAfter` |
| nap length | `oglet.js:40` — `rand(16,34)` | `× bias.napFor` |
| drift interval | `oglet.js:308` — `rand(3,7.5)/pace` | `× bias.driftEvery` |
| drift radius | `oglet.js:309` — `0.14` | `× bias.driftRange` |
| forgiveness | `drives.js:37` — `0.09/s` | `× bias.annoyDecay` |
| poke sting | `drives.js:114` | `× bias.annoyGain` |
| shake sting | `drives.js:158` | `× bias.annoyGain` |
| good mood | `drives.js:51,55` cheer gains | `× bias.cheerGain` |
| fondness | `drives.js:50,54` bond gains | `× bias.bondGain` |
| peer attempts | `social.js:18,24` — `rand(6,16)/sociable` | `/ bias.socialTry` |
| startle | `oglet.js:193,194` — brief `startled` + `0.35` blink | `× bias.startleOdds` |
| leaning in | `oglet.js:319` — `0.09 + bond*0.07` | `× bias.lean` |
| starting catch | `play.js:39` `maybeStart` | gate on `bias.playOdds` |
| chase role | `social.js:73`-ish role pick | `bias.chaseBias` |

**One rule, and it is the whole safety property:** *a personality changes rates and thresholds,
never causes.* No bias may introduce an expression that has no drive behind it. That preserves
README rule 2 exactly as written, and it means the entire change is unit-testable as pure
arithmetic — which matters, because this repo has no DOM test environment.

New test file `tests/personality.test.js`: every character has a bias; every key in every bias
exists in `NEUTRAL`; `biasOf(null)` is `NEUTRAL`; and — the useful one — **every character
differs from neutral on at least two keys**, so no personality is a label with nothing behind it.

### 1.3 Signature beats — the cheapest win on this list

Orbit, Burst and Comet are built, tested, scrubbed on `#/assets`, and never played. `beats.js:4`
quotes the original brief: *"the 'wait, did you see that?' moments that hold attention."*

Give each character one beat and one earned trigger:

| Beat | Meaning | Wired to |
| --- | --- | --- |
| **Orbit** | it has lost the plot | `crazy` — already earned by the 5th catch (`play.js:33` `GIDDY_AT`). Just call `body.playBeat(ORBIT, now)` there. **Spark** and **Tussle** get it more often. |
| **Burst** | a sudden delight | first pet of a session, a return greeting after `SLEPT_AWAY`, a catch on a **Spark** |
| **Comet** | a sustained state | **Flit** and **Skitter** while drifting fast; **Magnet** while approaching a peer |

`beats.js` already sets the four rules that make this safe — a beat never sets an expression, it
starts under a blink, it is replaced rather than queued, one at a time. Nothing about wiring them
violates any of them. This is maybe forty lines and it is the single most visible change in the
whole document.

### 1.4 The Nature section on `#/genome`

Insert between `hero()` and the mutation catalogue in `ui/genome-page.js:466`, as
`nature(host, thumbs)`.

```
NATURE                                          derived, not rolled

  ┌─ your Oglet ────────────────────────────────────────────┐
  │  SPARK                                          8.6%    │
  │  The one that bumps into you on purpose and pops        │
  │  about it.                                              │
  │                                                         │
  │  pace      slow  ──────●───────  quick                  │
  │  temper   sweet  ────●─────────  sharp                  │
  │  sociable   shy  ─────────●────  warm                   │
  └─────────────────────────────────────────────────────────┘

  the other eleven — 12 natures, one per Oglet
  [Lull] [Hearth] [Sulk] [Bramble] [Flit] [Skitter] [Tussle]
  [Tinder] [Placid] [Magnet] [Drowse]
```

Three deliberate choices:

1. **Bars, not numbers.** `axesOf()` already returns 0…1 per axis. A bar is a reading; `1.24`
   is a specification, and `genes.js:266` already deleted a mechanics table for exactly that
   reason.
2. **The odds are real.** `shareOf(character)` computes them from `EXTREME` and the midpoints —
   no hand-typed percentage that can drift. Same discipline as `chanceText(allele.w)`.
3. **No dex entries, and this is load-bearing.** A character is derived, so there is nothing to
   "meet" — the other eleven are shown open, named, with their `tell` and their share. This
   avoids touching `state/storage.js`'s `VALID_DEX`, avoids a v3 record, and keeps §1 a pure
   additive change. Every Oglet already alive gets a Nature section the moment it ships.

The eleven others render as plain cards. They could carry a live thumbnail later; they do not
need one to be worth reading, and the Genome page is already the heaviest page on the site.

### 1.5 Quirks — a sixth gene (later, and it costs something)

Once the axes are visibly driving behaviour, the next increment of "unique" is one *habit* rather
than one more dial. A `quirk` gene, sparse in the same way `body` is — most Oglets have none.

```
none      the ordinary case, ~92%
hoarder   drags its speck back to the same corner every time
mimic     copies the last expression it caught, a beat late
nightowl  sleepAfter doubles after your local 10pm
sentry    faces the edge of the canvas rather than the middle when idle
echo      blinks when you click anywhere, even off it
mirror    leans away from the pointer instead of toward it
```

**What it costs**, honestly:

- `CATS` gains an entry → the Gallery's combination count changes from 186,592 to ×N, and
  `ui/gallery.js` virtualisation is keyed off that number.
- `VALID_DEX` in `storage.js` grows → fine, it is derived from `GENES`, but every existing
  record's dex is now incomplete against a larger total. That is a copy problem, not a data one.
- `genome/codec.js` — the nine-character legacy code has no slot. It already handles this
  (`decode()` reads the characters it has and defaults the rest), so a legacy Oglet gets `none`.
- Tier quota — `tests/rarity.test.js` demands ≥2 mutations per band unless the gene is in
  `TIER_QUOTA.sparse`. Add `quirk` there.

Because of `streamFor`, **no existing Oglet changes appearance.** But this is genuinely the
biggest-surface item in §1 and it belongs after everything else here works.

---

## 2 · Toys, meters and reasons to come back

### 2.1 The meters already exist and none of them is on screen

`emotions/drives.js` maintains seven: `annoy`, `idle`, `held`, `bond`, `cheer`, `ignored`,
`lonely`. Only `bond` survives a refresh (`storage.js`). A visitor has no idea any of it is
happening.

**Show one, not seven.** The proposal is a single persistent readout and two ambient ones:

| | What | Where |
| --- | --- | --- |
| **Bond** | the only drive that persists. 0…1. | Genome hero, under the name, as a filled hairline — same visual language as the dex progress bar. Plus a word: *stranger · known · fond · attached · inseparable*. |
| **Days** | `mine.born` and `mine.seen` are already stored | *"Yours since 12 Mar · 41 days"* — the `since` line already exists at `genome-page.js:102`, it just does not count. |
| **Mood** | live `annoy` / `cheer` / `lonely` | **Never as a bar.** It is already on the creature's face; a number beside the face is the site telling you what you can see. |

**One hard rule: bond must never decay from absence.** It already does not — the only thing that
lowers it is `annoy > 0.6` (`drives.js:63`). Keep that. A meter that empties while you are not
looking turns a pet into a chore, and this site's entire posture (`sleep.js:3` — *"Nothing here
punishes you for leaving"*) is against it. The reason to come back should be that it is pleased to
see you, which is already implemented in `world.js#greet()`.

### 2.2 Toys, ranked by payoff over cost

The physics is already there — `b.vx/vy/vz`, throw-on-release, tilt gravity, squash and stretch
above `DASH`. A toy is an entity with a position that the Oglet's `steer()` can target.

**Do these three first.** All are small, all reuse machinery that exists:

1. **The Speck, made real.** `attention.js` already has an invisible speck it tracks in a slow arc,
   and it produces the `focus` face. Make it a visible mote you can drag, and let it chase.
   Reuses: `attn === 'speck'`, `aimGaze`, `focus`. New: one drawn dot, one drag target.
   *Payoff: the single most "alive" behaviour already in the engine, currently invisible.*

2. **A ball.** Today catch is chase-the-cursor (`play.js#chaseTarget`). A real thrown object —
   one entity with the same spring physics — makes catch a game with a thing in it rather than a
   cursor-follow, and it works on a phone where there is no cursor to follow.
   Reuses: `play.js` wholesale, `separate.js` for collision.

3. **A light.** Pupil dilation is already sprung per expression (`DILATION`). A draggable light
   source it looks at, dilates away from, and squints at with `focus` costs almost nothing and
   reads as a real sense.

**Then a treat.** One consumable that arrives *earned*, not required — it banks `cheer`, buys a
`Burst`, and nudges `bond`. Explicitly **not** a hunger meter: hunger is a debt you owe a piece of
software, and this site does not do debts.

**Deliberately not doing:** sound (zero dependencies, and audio drags in a permission surface);
mini-games with scores (the site has no scores anywhere); anything with a cooldown timer.

### 2.3 A shelf

Toys need a home. A small tray at the bottom of `#/world` — the things you have, the things you
have earned. That is the first thing on this list that needs storage (§4), and it is the point at
which the world stops being one canvas and becomes a room.

### 2.4 What makes somebody come back

Four levers, in the order they are worth building:

1. **It is pleased to see you.** Built. `awayFor > GREETABLE_ABSENCE` → `greet()`. Extend it: an
   Oglet that has been asleep for six hours should do something on waking that you can only see by
   having been away.
2. **It did something while you were gone.** Cheap and strong: on return, one line — *"It has been
   watching the corner."* / *"It wore itself out and slept."* Derived from `awayFor` and its
   character, not stored, not random. A **Skitter** and a **Hearth** should not report the same
   absence.
3. **The catalogue.** The dex already works and nobody grinds it — `dex.js:8` is right that
   looking is the verb. Natures (§1.4), quirks (§1.5) and eggs extend it honestly.
4. **Eggs on a real clock.** The five-minute hatch already proves people will wait
   (`ui/hatch.js`). A found egg on a twelve-hour clock is a reason to open the tab tomorrow that
   asks nothing of you today. See §3.

---

## 3 · More Oglets

This is the one that needs care, because the product has a stated rule in the opposite direction:

> There is deliberately no reroll button: being able to replace it on a whim is what would stop it
> mattering. — `README.md`, `state/session.js:6`

That rule should survive. So the framing is not *"how do users get more Oglets"* — it is:

> **Exactly one Oglet is yours, forever. Everything else is a guest, a stray, or a descendant.**

Under that framing, four routes. They are not alternatives; they are a sequence.

### A · Visitors — do this first

Paste a friend's share code into your world. Their Oglet walks in, stays for the session, and is
never yours.

Why this first:

- **It costs almost nothing.** `shareCode()` and `readShareCode()` already exist and already carry
  `id~Name`. `genomeOf(id)` redraws any Oglet from its id alone, forever, with no server. A
  visitor is `population.push(new Oglet(genomeOf(theirId), …))` and nothing else.
- **It turns on half the codebase.** `social.js` (approach → engage → play), `bump()`,
  `separate()`, emotion contagion via `receive()`, the yawn contagion — all written, all tested by
  hand only, all currently dead because the world holds one. The first visitor makes every one of
  them visible at once.
- **It is the viral loop, and an honest one.** Your code becomes worth sending to somebody. No
  account, no server, no data leaves the browser — which is the site's own promise.
- **It proves the personality work.** Two Oglets in a room is the only context in which "this one
  is a Bramble and that one is a Magnet" is legible at all.

Scope: a paste field on `#/world`, a guest cap of 3, guests are not persisted, guests never enter
your dex, and the Genome page never mentions them. **The `#/genome` page stays about yours.**

### B · Strays — the returning-visitor loop

A wild Oglet drifts in and can be befriended over several days.

The seed problem has a clean answer: `hash(`stray:${mine.id}:${dayNumber}`)` → a deterministic
id for today. No server, no storage, reproducible, and *different for every person* because it is
keyed off your own id. It appears in the corner, will not approach, and warms over repeat visits —
which is a reason to come back that costs the user nothing and asks nothing.

After N days it stays. **It is a companion, not a replacement**, and the Genome page still shows
one creature.

Cost: needs the v3 record (§4) to remember which strays stayed and how warm each one is.

### C · Breeding — the telegraphed one, and the one that bends the invariant

The code has been anticipating this since the beginning — `genes.js:8` keeps the word `allele`
*"because inheritance will need the word"*, `dex.js:11` reserves a third discovery route for
*"an allele you actually bred"*.

The real design problem is stated in `derive.js:1`. Property 2 is: **the id always redraws the
same Oglet, purely, with nothing else needed.** A child with inherited alleles cannot satisfy that
from a fresh CSPRNG id — the parents' alleles are information the id does not contain.

Two ways out:

1. **Store lineage.** `genomeOf(id, { parents })`. Breaks purity-from-id-alone: hand somebody a
   child's id and they draw the wrong creature. **Do not do this.**
2. **Make the identity a triple.** A child's shareable identity becomes `child:parentA:parentB` —
   longer, but *still pure and still verifiable by anyone*, because the whole input is in the
   string. `genomeOf()` gains a branch; `isId()` gains a form; `storage.js` stores the triple as
   the id. Property 2 survives intact. **This is the one to do.**

Then inheritance itself is straightforward and it is where `AGEING`/epochs earn their keep: per
gene, draw from the child's own stream to pick parent A's allele, parent B's, or (rarely) a fresh
roll — the mutation. Continuous genes lerp with jitter, which means **a child's character is a
real blend of its parents' characters**, and §1 is what makes that mean anything.

Gates: you need a visitor present (A), it takes a real egg wait (`ui/hatch.js` exists), and the
child is a companion — yours is still yours.

### D · Adopting from the Gallery — no

`ui/gallery.js` renders all 186,592 combinations. Letting somebody take one is a reroll with a
catalogue in front of it. It is the one route that would actually cost the site its premise.

### The cap

`beats.js:24` already names the ceiling: *"10–12 Oglets with an O(n²) separation pass."* Set the
world cap at **6** — yours, up to 3 guests, up to 2 residents — and enforce it in `world.js`
rather than discovering it as jank.

### Recommended order

```
A visitors  →  B strays  →  C breeding
cheap          medium        expensive
turns on       gives the     needs the id
social         daily reason  format decision
```

---

## 4 · The v3 record

Nothing in §1 needs it. §2.3 (a shelf) and §3B (strays) do. `storage.js` already has the v1→v2
migration pattern to copy — read old, never write it again, degrade to sensible defaults.

```js
{
  v: 3,
  id, name, bond, born, seen, dex, hatched, eggAt, eggHelp,   // unchanged
  toys:     ['speck', 'ball'],       // what you have
  resident: [{ id, warmth, since }], // strays that stayed. NOT yours; capped.
  met:      ['<id>', …],             // visitor ids seen, capped and hashed-short
  lastAway: 0,                       // for "what it did while you were gone"
}
```

Rules to carry over from v2: unknown fields are dropped, an unreadable record hatches rather than
throws, and **anything from before a field existed reads as the safe default** — a v2 record has
no toys and no residents and must open perfectly.

---

## 5 · Sequencing

| Phase | What | Storage | Risk |
| --- | --- | --- | --- |
| **1** | `personality.js` + wire 11 seams + Nature section on `#/genome` + `tests/personality.test.js` | none | low — pure arithmetic, additive UI |
| **2** | Beats wired to characters; bond readout; days-known | none | low |
| **3** | Speck, ball, light | none | medium — new entities in `steer()` |
| **4** | Visitors: paste a code, guest cap, social finally visible | none | medium — first multi-Oglet frame budget |
| **5** | v3 record; the shelf; strays; "what it did while you were away" | **v3** | medium |
| **6** | `quirk` gene; breeding with the triple id | **v3+** | high — touches gallery counts, codec, identity |

Phase 1 is the one to start. It is the largest change in how the thing *feels* per line of code
written, it needs no migration, and it makes every later phase legible.

---

## 6 · Invariants not to break

Pulled from the code's own comments. Any proposal above that collides with one of these is wrong,
not the rule.

1. **No expression is ever picked at random.** Every mood traces to a drive. Personality scales
   rates; it never invents a cause.
2. **Rarity is never declared.** A tier is a reading of a weight. `shareOf()` computes character
   odds the same way — no typed percentages.
3. **The id redraws the creature, purely, forever.** §3C is the only proposal that touches this,
   and the triple-id form is what keeps it true.
4. **No reroll.** One Oglet is yours. Guests, strays and children are additions, never swaps.
5. **Nothing punishes absence.** No decaying meters, no streak you can break.
6. **Zero dependencies, zero network, no build step.** Every proposal above is plain ES modules
   and `localStorage`.
7. **Nothing smaller than 12px**, and `genome/` + `state/storage.js` stay pure and tested.

---

## 7 · Decisions that are yours

1. **Nature: derived or rolled?** I recommend derived, for `character.js`'s own reason. Rolling it
   would let you write personalities that are not implied by the three axes — richer, but capable
   of contradicting behaviour. **This decision gates §1.**
2. **Does a character enter the dex?** Recommend no — it keeps §1 free of a storage migration. Yes
   would make Nature a collectible alongside mutations, at the cost of a v3 record in phase 1.
3. **Hunger, or no hunger?** Recommend no. It is the standard way to make somebody return and it
   is the one that would make this a chore.
4. **Visitors before breeding?** Recommend yes, strongly — visitors are nearly free and breeding is
   the expensive one that changes the identity format.
5. **Is a stray that stays "yours"?** My read: no, and the Genome page proves it by only ever
   showing one creature. Worth being sure, because it decides whether §3 dilutes the premise.
6. **World cap.** 6 is my proposal against the 10–12 ceiling `beats.js` names. Lower is safer on a
   phone.
