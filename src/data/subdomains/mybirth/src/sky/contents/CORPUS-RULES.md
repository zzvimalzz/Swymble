# How to write the corpus

Everything in this directory is copy a stranger reads on a phone, once,
while doing something else. This file is how to write it. `../../../VOICE.md`
governs the whole product; this one is specific to the tables in here, and
where the two disagree, this one is wrong and should be fixed.

The mechanical half is enforced by `tools/check-voice.mjs` and
`tests/seams.test.js`. Run both before you commit:

```
node tools/check-voice.mjs
npx vitest run tests/
```

---

## 1. What a card is made of

A reading card is four pieces from four tables, and each piece has exactly
one job. Nothing may do another piece's job.

```
headline    readings.json[area][tone][n][0]     the screenshot
body        readings.json[area][tone][n][1]     the whole reading
  + tail    motion.json[transit][applying][n]   when it peaks, in English
¶2          placements.json[area][point]        the permanent thing about you
¶3          depth.json.pattern[area][tone]      the recurring pattern, and the trap
mechanism   depth.json.mechanism                one line, inside the measurement
measurement computed                            the arithmetic, printed
```

**All three paragraphs are keyed by area.** That is what makes them
specific, and it is also how they could collapse into each other, so they
are written at three different distances from today:

| | | |
|---|---|---|
| ¶1 | **today** | what is happening, and what to do about it |
| ¶2 | **always** | the permanent placement that makes it land here |
| ¶3 | **every time** | the recurring shape, and the mistake people make |

The compact card shows the headline and the body. Tapping it adds ¶2 and
¶3 and the measurement. That is the whole product.

The mechanism is not a paragraph. It used to be: three encyclopaedia
entries keyed by point, tone and transit, concatenated into a hundred and
six words sitting directly above a measurement row that already stated the
same facts in numbers. It is one line inside that row now. If you find
yourself explaining what a conjunction is in a paragraph, you are writing
the version that made two thirds of every card machine.

## 2. The shape of a body

Four moves, in this order. Most bodies use three of them.

1. **Name what is happening**, in the reader's life, not in the sky.
2. **Say what follows from it.** This is the sentence that makes it a
   reading rather than an observation.
3. **Say what to do.** An imperative. This is the payload.
4. **Optional: the payoff.** What they get for doing it.

> **Pay the boring bill first.**
> It is the one that quietly turns into a larger problem while you deal
> with the interesting things. Do it before anything else today. The rest
> of the day gets easier immediately.

Name it, say what follows, say what to do, say what it buys. Forty words.

**The test:** read the body alone, with the headline covered and the
measurement covered. If a stranger cannot act on it before lunch, it is not
finished.

### Hard limits

| | |
|---|---|
| Headline | 72 characters, declarative, no question mark |
| Body | 120 to 300 characters, two to six sentences |
| Timing tail | 90 characters, no astrology |
| Second person | Every body, by pronoun or by imperative |

### The banned list

No em dashes, no en dashes in prose, no `--`. No emoji. No exclamation
marks. British spelling throughout: colour, recognise, centre, grey,
behaviour, defence. Hedges: *maybe*, *perhaps*, *possibly*,
*arguably*, *sort of*. Mystical vocabulary: *universe*, *energy*, *fate*,
*destiny*, *cosmos*, *vibration*, *manifest*. Throat-clearing: *it is worth
noting*, *interestingly*. Astrology inside a body or a tail: *orb*,
*applying*, *exact*, *trine*, *sextile*, *quincunx*, *conjunct*.

The linter fails the build on every one of these.

### Two rules with no regex behind them

**End on the noun, not on the qualification.** *"Stop auditioning. The part
is already yours."* Not *"you should probably stop auditioning for it, if
that makes sense."*

**One subject per body.** If the third sentence is about something the
second did not mention, it belongs on a different card.

## 3. No proper nouns, no invented numbers

`tools/validate-copy.mjs` reads every string in this directory and rejects
any capitalised word not in its stop list, and any number that did not come
from the chart.

This is not stylistic. The product's only real claim is that everything on
the page is checkable, and the same validator runs on generated copy, where
one invented name would end that claim. The bank is held to the rule so the
rule has no exceptions to argue about.

In practice:

- **Never name a planet, sign, house or aspect.** The card prints those
  from the chart. A line that named one could be printed against a
  different one and be wrong.
- **Never name a person, place, brand, day or month.**
- Ordinary English words that happen to start a sentence are fine, but the
  stop list has to know about them. If the voice suite reports `invented
  name "Postpone"`, add `"Postpone"` to `HARMLESS` in `validate-copy.mjs`
  and say why in the comment block. Ask one question before you add a word:
  could a generated line use it to assert a fact nobody checked? If yes, do
  not add it, rewrite the sentence.

## 4. Write to the house, not to the day

This is the rule the corpus fails first, and the failure is always the
same: a body that would work equally well on any of the nine cards. It
reads as filler because it is.

Every body must be **unusable on any other area's card.** If you can move
it to Home and it still parses, it is not a Love reading, it is a
horoscope.

The mechanism for that is concrete nouns from the area's own life. Not
metaphors about it, the actual furniture of it: an invoice, a rota, a
hallway, a draft, a message left on read.

A shared image is allowed when it is doing work. *"Work out the price
first"* is a legitimate Love reading. What is not allowed is copy literally
about earning sitting on the Work card because both involve an office.
`tests/seams.test.js` checks the vocabularies narrow enough to belong to
exactly one area.

### The nine briefs

Each area owns one or two of the twelve sectors. Write to the human
situation, not to the tradition.

**self** *(sector 1, "how you arrive in a room")*
How you come across before you have done anything. First impressions, being
read accurately or wrongly, taking up room, the gap between how you meant
to land and how you did. Not achievement, which is Work, and not confidence
as a mood, which is nothing.
Vocabulary: the room, how you come across, your name, the version of you.

**money** *(sector 2, "what you own, and what you will trade your time for")*
Earning, pricing, owning, spending. The number, said out loud. Rates,
invoices, the account, the recurring charge nobody cancelled, the cheap
version of a thing you use daily. Money you earn alone; money entangled
with another person is Closeness.
Vocabulary: the rate, the invoice, the account, the budget, the price.

**talk** *(sectors 3 and 11, "how the talking goes and who you run with")*
Messages, conversations, questions, explaining, being understood. And the
group: friends, the people you run with, who gets told first. Not the
intimate conversation with one partner, which is Love.
Vocabulary: the message, the reply, the question, the group, the thread.

**home** *(sector 4, "where you are from and where you sleep")*
The house and the family. Parents, roots, the place you sleep, the argument
that has been running since before you were born, the room that does not
work. Rest belongs here when it is about being somewhere, not about being
tired.
Vocabulary: the house, the kitchen, the hallway, home, the family.

**making** *(sector 5, "what you make and how you play")*
Making things and playing. Drafts, ideas, the blank page, the tangent, the
thing you make for no reason. Also the appetite for delight. Not the job,
which is Work, even when the work is creative.
Vocabulary: the draft, the idea, the page, the version, the tangent.

**work** *(sectors 6 and 10, "the daily work, and what it is building you a name for")*
The job and the standing. Deadlines, colleagues, the rota, the system you
patch by hand every week, what people think you do. Two sectors, so it
holds both the daily grind and the reputation, and readings that name the
distance between them are the best ones this area has.
Vocabulary: the deadline, the rota, the headcount, the meeting, your standing.

**love** *(sector 7, "the other person")*
One other person, and the space between the two of you. Asking, choosing,
being chosen, the plan you keep not making, the thing you assume they know.
Attraction lives here; what you do about it in private is Closeness.
Vocabulary: the other person, the invitation, the plan, going first.

**sex** *(sector 8, "closeness, pleasure, and what the two of you hold jointly")*
Wanting and being wanted. Also the entanglement: joint money, debts,
secrets, who decides. The card is labelled Closeness on the page because
the area is wider than the word sex, and the copy should be too.
Vocabulary: wanting, closeness, jealousy, what is shared, who decides.

**belief** *(sectors 9 and 12, "what you hold true, and the far-off")*
What you hold true, and what is far away. Study, travel, the long view, the
rule you inherited without checking whose it was. Also solitude and the
part of a life nobody watches. Not opinions, which are Talk.
Vocabulary: what you believe, the long view, the far-off, the rule, doubt.

## 5. Adding variants

`readings.json` is `[area][tone][variant]`, ten variants per cell. Ten
rather than five because `chooseVariant` in `reading.js` prefers a variant
the reader has never seen and falls back to the least recently used, so the
number of variants is exactly the number of visits to a cell before a
sentence repeats.

Adding an eleventh is a good day's work and no code change. Adding a tenth
to only some cells is worse than useless: the rotation is per cell, so an
uneven bank means some areas repeat sooner with nothing on the page to say
why. Fill a cell or leave it.

**The five tones, and what actually distinguishes them.** These are not
five moods. They are five different pieces of advice, and a body written to
the wrong one is wrong even when it reads well.

| Tone | Aspect | What the reading has to do |
|---|---|---|
| `charged` | conjunction | Something is amplified. Name it and say what to do about the volume. No direction of its own, so never "this is good" or "this is bad" |
| `open` | sextile | Something is available and will not force itself. The instruction is nearly always **ask**, **start**, or **go**, and the point is that it is cheap today and will not be |
| `friction` | square | Something is resisting. Never "push harder". The answer is the smaller, duller thing: go around, do less, wait a day, check the arithmetic |
| `easy` | trine | Something costs nothing today. The instruction is to **spend it on the hard thing**, because ease unspent is ease wasted |
| `pull` | opposition | Two real things want opposite hours. Never resolve it. Name the trade and make the reader choose which one gets today |

Write the tone first and the area second. A `friction` body that says push
harder is broken no matter how good the sentence is.

## 6. Writing a timing tail

`motion.json`, keyed by transiting body then direction: `[0]` still
building, `[1]` already past. Five variants each.

It is the last thing on the card and the sentence a reader is most likely
to finish. Plain English. No astrology. Name no body, because the card
prints it. Match the speed to the body: the Moon does hours, Venus does a
few days, Saturn does months, Pluto does seasons.

> This peaked earlier and the rest of the day is gentler.

Not *"past exact now, and thinning out through the afternoon"*, which is
accurate, and which nobody outside this repository can parse.

`reading.js` walks this list rather than seeding it, so two cards in one
render can never land on the same tail while a direction has more variants
than the day has cards using it. Five is comfortably above that on a normal
day; if a morning ever runs more than five cards off one body moving in one
direction, this table is the one to grow.

## 7. Writing paragraph two: the placement

`placements.json`, keyed area then natal point. Ninety-two entries.

It answers one question: **what is permanently true about you that made
today land in this part of your life?** Unlike the reading above it, this
was true last year and will be true next year. That is what makes it the
most personal paragraph on the card.

> **money / venus**
> What you are drawn to sits in the part of your chart about what you own.
> You buy for pleasure rather than for use. That is not a fault, and it
> does mean your budget works better when the pleasure is built into it on
> purpose.

- **Plain language, second person.** No astrology, no planet names.
- **Self-contained.** No opening back-reference. Never start with *It is*,
  *This one* or *They*, because there is nothing above it to reach back to.
- **Say something a reader recognises about themselves**, in the furniture
  of that area of life.
- **It must not restate the reading above it.** That one is about today.
  This one is about always.

### Why it is keyed this way, and why the old key could not work

This table used to be `touches.json`, keyed by natal point and tone alone,
and it was the paragraph readers called generic. The reason was structural.

An aspect's area comes from where the natal point sits, and **which area
that is differs per person**: one reader's Venus lives in their money
sector, another's in their self sector, another's in their talk sector. A
table keyed by the point alone is therefore one sentence that has to be
true whether the card above it says Money, Self or Talk. It could only ever
talk about wanting in the abstract.

The exception proved it. The Ascendant is always the first sector and the
Midheaven always the tenth, **for everybody**, and those two were the only
entries in the old table that read specific. Same writer, same tone, same
day: the difference was entirely whether the address knew the house.

### Ninety-two, not a hundred and eight

Ten planets across nine areas, plus the Ascendant in `self` and the
Midheaven in `work`, which are the only areas those two can ever fall in.
The other sixteen are unreachable and writing them would be writing copy
no reader can be shown. `tests/seams.test.js` asserts the count exactly, in
both directions.

## 8. Writing paragraph three: the pattern

`depth.json` under `pattern`, keyed area then tone. Forty-five entries.

It answers: **what does this kind of day do in this part of your life, over
time, and what is the mistake people make in it?** Not what to do today,
which is paragraph one's job.

> **work / friction**
> What blocks you here is structural rather than personal, nearly always:
> a bad process wearing somebody's face. The trap is working harder at a
> thing that is actually waiting on a decision nobody has made.

Name the trap. Every one of these is more useful when it ends on the
failure mode than when it ends on reassurance.

**The overlap test is real and it will catch you.** Paragraphs one and
three are both keyed by area and tone, which is exactly the correlation
that produced the original bug. `tests/seams.test.js` measures content-word
overlap between paragraph three and both paragraphs above it, at every
address the renderer can produce, and fails at fifty per cent. During this
rewrite it caught `pattern.work.easy` at sixty-four per cent, because the
entry had drifted into being another instruction for today.

### The mechanism line

Also in `depth.json`, under `mechanism`. Five tone notes and ten transit
notes, one short sentence each, rendered inside the measurement row rather
than as prose.

This is the only place astrology vocabulary belongs, because it is an
annotation on numbers that are printed right beside it. Keep each under a
hundred and ten characters. If it needs a paragraph, it is being written at
the wrong altitude.

## 9. The friend bank

`friends.json`. Written, not yet wired to anything; the file's own note
lists what still has to be built.

Same keying as the reading, area then tone, because a friend card is the
same engine pointed at a second chart. What changes is the grammar:

- **The friend is third person. You are second person.**
- **Every body ends on something the reader can do**, never on what the
  friend should do. The friend is not holding the phone.
- **Never diagnose somebody who is not in the room.** The card says what
  the sky is doing to a chart, not what a person is.

### Tokens

`{name}`, `{planet}` and `{sign}` are holes the renderer fills from a
chart. They are how this one table gets to name a placement at all: the
copy never asserts one, so it cannot be wrong about one. A line that spelled
out a sign could be printed against a different sign. A hole cannot.

Use no other token. `{nane}` does not throw, it prints, so the seams suite
checks every brace in this file against the three the renderer knows and
checks that no other table contains a brace at all.

### The bridge is a separate line

The obvious way to write this is as one paragraph, with the clause about
your chart sitting inside the sentences about theirs. It reads well on its
own, and it is the exact assembly this whole document exists because of: a
fragment keyed off one thing wedged into a paragraph keyed off another. The
body is complete without it, and the bridge renders underneath, labelled.

## 10. The quiet cards

`quiet.json` and `signs.json` are the cards for the four or five areas the
sky is not touching on a normal morning. They are not an apology and they
are not an error state. They are the reading.

Four cases, chosen by the chart:

| | |
|---|---|
| `near` | a planet of yours here, an angle close but outside orb |
| `still` | a planet of yours here, nothing near it |
| `visiting` | nothing of yours here, planets crossing today |
| `empty` | nothing of yours here, nothing crossing |

`signs.json` supplies what the area is like the rest of the time, and it is
written to the reader: *"You keep what you hold here rather than spend
it"*, not *"the sign on it protects what it holds"*. Same claim, and only
one of the two is a sentence about a person.

## 11. Before you commit

- [ ] `node tools/check-voice.mjs` says clean
- [ ] `npx vitest run tests/` passes
- [ ] Every new body works with the headline covered
- [ ] Every new body is unusable on any other area's card
- [ ] Every new body ends on an instruction or a payoff
- [ ] Nothing names a planet, sign, house, aspect, person or place
- [ ] The tone is the one the aspect actually means, per section 5
- [ ] You read the new cell top to bottom, all ten, looking for two that
      are the same reading in different words
- [ ] A new placement or pattern is at its own distance from today, per
      section 1: always, or every time, never today
