# MyBirth voice and content rules

Everything a visitor reads on mybirth.swymble.com is governed by this file.
The mechanical half is enforced by `tools/check-voice.mjs`, which runs in
the test suite; the rest is judgement, written down so it survives the next
person to touch the copy.

---

## 1. The register

Short sentences. Second person. Present tense. Say the thing, say what
follows from it, say what to do about it, and stop. A reading is finished
when a person can act on it after one read, on a phone, without going back
to the top.

*"The wall at work is real today. Stop testing it and go around."*

This replaced an earlier register, and the replacement is deliberate rather
than drift. The old rule asked for something elegiac and archival, on the
grounds that the product is a keepsake somebody prints and frames. That
produced copy nobody could act on, and it produced it systematically: see
section 3 for the specific rule that did it.

The keepsake surfaces get the same voice as the daily ones. A certificate
written in a register the reader cannot parse is not more dignified than
one they can, it is just harder to read.

What has not changed is that we do not make things up. Being blunt is a
matter of style. Being wrong is a matter of the product having no reason to
exist, and section 4 is not negotiable.

## 2. Rules with teeth

Enforced by the linter. A violation fails the build.

| Rule | Why |
|---|---|
| **No em dashes.** No en dashes in prose, no `--` | They are the fingerprint of generated text and the reader clocks it |
| **No emoji** | See above, and they do not print |
| **No exclamation marks** | Nothing here is exciting enough to shout about |
| **British spelling** | `colour`, `recognise`, `centre`, `grey`, `behaviour`, `defence` |
| **No hedging.** No *maybe*, *perhaps*, *possibly*, *arguably*, *sort of* | A sentence worth printing is worth asserting. If it needs a hedge, it is not ready |
| **No mystical vocabulary.** No *universe*, *energy*, *fate*, *destiny*, *cosmos*, *vibration*, *manifest* | These are the words of a claim that cannot be checked. The entire product is the opposite bet |
| **Headlines: 72 characters, no question marks** | The headline is the screenshot. It is a short declarative or it is nothing |
| **Bodies: 120 to 300 characters, two to six sentences** | The body is the whole reading. One sentence has no room for an instruction; six is a page |
| **Every body addresses the reader** | By pronoun or by imperative. A reading with neither is a description of a measurement |
| **No astrology in a body or a timing tail** | No *orb*, *applying*, *exact*, *trine*. The measurement is printed underneath in full, which is where the vocabulary belongs |

## 3. Rules without teeth

Judgement, not regex.

- **Write about the reader.** This is the reversal. The old rule said the
  opposite: *"write about the aspect, never about the reader"*, on the
  reasoning that a line true of the measurement can never be wrong. It
  cannot, and it also cannot be read. Only 14 of 225 openings began with
  *you* or *your*, 97 began with *It*, *The* or *This*, and the result was
  a bank that made the reader translate before it meant anything.
  The evidence is still exact. It is printed underneath, where it always
  was. The copy no longer has to do that job as well.
- **Every body ends on an instruction or a payoff.** Not on a restatement
  of the first sentence. *"Stop auditioning. The part is already yours."*
- **Second person, present tense.** Not future. The product describes a
  configuration that exists right now; it does not predict.
- **One subject per paragraph.** If sentence three is about something
  sentence two did not mention, it belongs on another card.
- **Name the limit of a claim.** If a figure covers only the United States,
  the copy says so. See `provenance.js`, which makes this structural.
- **No throat-clearing.** No *"it is worth noting that"*, no *"interestingly"*.
- **Say the number.** *"4.54 degrees"* beats *"a small difference"*.

## 4. Generated copy: the architectural constraint

This section is not style advice. It is the rule that keeps the product's
only real claim intact, and it is not negotiable.

1. **All facts are computed deterministically into a structured fact
   object first.** Nothing is written from a prompt describing a person.

2. **A model receives that object plus this file, and nothing else.** It
   may not introduce a new noun, number, name, date, place or event. It
   rephrases what it was given. It does not know anything.

3. **Output is validated against the fact object before it is accepted.**
   Every number and every proper noun in the generated text must appear in
   the input. `tools/validate-copy.mjs` does this check.

4. **Fail closed.** A violation is discarded and the written bank is used.
   There is no "probably fine" path.

5. **No model call on the render path.** Generation happens offline, into
   `src/sky/contents/`, and a human reads it before it ships.

The reason for all of this in one sentence: **one fabricated headline
destroys the premise, and nothing else about the product survives it.**
Everything on the page is checkable, or the page is worth nothing.

## 5. Where the copy lives

**`src/sky/contents/CORPUS-RULES.md` is the working manual for these
tables**: the shape of a body, the brief for each of the nine areas, what
each of the five tones actually means, and the checklist to run before
committing. This file is the register; that one is the method.

| File | What |
|---|---|
| `src/sky/contents/readings.json` | 450 headline and body pairs, area by tone by variant. The body is the whole reading |
| `src/sky/contents/motion.json` | The timing tail, in English |
| `src/sky/contents/placements.json` | Paragraph two: the permanent placement, area by natal point |
| `src/sky/contents/depth.json` | Paragraph three: the recurring pattern, area by tone. Plus the one-line mechanism note |
| `src/sky/contents/friends.json` | The friend card. Written, not yet wired up |
| `src/sky/contents/quiet.json` | The cards for areas the sky is not touching |
| `src/sky/contents/signs.json` | What the sign on a sector says about that part of a life |
| `src/sky/contents/lines.json` | The line of the day, written to a lock screen |
| `src/sky/contents/areas.json` | The nine areas of life, and the sectors behind each |
| `index.html` | The landing page and the shell |

## 6. Assembly, and the one rule that governs it

A card is built from more than one table, and that is where the previous
version of this product failed. It is worth writing down what went wrong,
because the failure was structural rather than a run of bad sentences.

The body used to be three fragments glued end to end: an opening keyed by
area and tone, a clause keyed by the natal body, a clause keyed by the
transit. 120 x 35 x 14 addresses out of 169 written pieces. Enormous
variety, and three failures that all showed on the page:

- **Two thirds of the paragraph was the machine.** The reading proper
  averaged thirteen words; the two clauses about the chart averaged
  twenty-seven between them.
- **The middle clause restated the first.** Not by chance. An aspect's
  *area* is derived from where its natal point sits, so keying one table by
  area and another by natal point gives two correlated dimensions, not two
  independent ones. For the angles it is total: the Ascendant is always the
  first sector and the Midheaven always the tenth, so every Midheaven card
  was a Work card, and it printed the work opening, the midheaven clause
  and the work paragraph. One address, three paraphrases.
- **The pronouns collided.** Every appended fragment opened on a
  back-reference, and the opening had usually spent its own *it* on
  something else: *"Pay the boring bill first. It is the one that turns
  into a larger problem if it waits. It is your sense of yourself under
  the pressure."*

**So: the body is one written paragraph, and combinatorics happen between
paragraphs rather than inside them.** If a fragment has to be compatible
with every fragment it could be printed beside, it cannot commit to
anything, and vagueness is the price. That is the trade the old design
made, and it is the whole reason the bank read as generic.

Two tables may still be joined in one paragraph only if they are keyed by
genuinely independent dimensions, and `tests/seams.test.js` checks the
overlap rather than trusting that they are.

**And a paragraph must know which part of a life it is about.** The second
version of this card failed the same way in a quieter place: paragraphs two
and three were keyed by the natal point and the aspect, with no area in the
address at all, so neither could name the house it was printed under. Which
house a given planet occupies differs per reader, so one sentence had to
serve all nine. Both are keyed by area now.

## 7. Things the product does not say

- It does not predict events.
- It does not tell anybody what they are like.
- It does not claim authority it cannot show the working for.
- It does not say *"the only figure we did not work out ourselves"* or any
  other variation on repeating its own methodology at the reader. The
  provenance marker exists so the copy does not have to.
- It is not cruel. Blunt and cruel are different, and the line is whether
  the sentence would still be worth reading if it turned out to be about
  somebody the reader loves.
