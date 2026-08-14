# MyBirth voice and content rules

Everything a visitor reads on mybirth.swymble.com is governed by this file.
The mechanical half is enforced by `tools/check-voice.mjs`, which runs in
the test suite; the rest is judgement, written down so it survives the next
person to touch the copy.

---

## 1. The register

Elegiac and archival. *"The sky kept a record of the moment you began."*
The product is a keepsake somebody prints and frames, not an app that
speaks to them every morning in a knowing voice.

Write like a well-made almanac: certain about what it knows, silent about
what it does not, and never straining to sound profound.

**Do not imitate the deadpan cruelty of the horoscope apps.** It is a good
voice for a phone notification and a terrible one on a certificate a
grandparent is going to be given. We can be direct without being unkind.
The line between the two is whether the sentence would still be worth
reading if it turned out to be about somebody the reader loves.

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
| **Bodies: 130 characters, at most two sentences** | The reading is completed by two further clauses from other tables. Room has to be left for them |

## 3. Rules without teeth

Judgement, not regex.

- **End on the noun.** *"Stop auditioning. The part is already yours."*
  Not *"you should probably stop auditioning for it, if that makes sense."*
- **Second person, present tense.** Not future. The product describes a
  configuration that exists right now; it does not predict.
- **Write about the aspect, never about the reader.** Every line in
  `contents/readings.json` has to be true of the *measurement*. The
  specificity comes from the arithmetic printed underneath it, which is the
  whole trick: the copy can stay general because the evidence is exact.
- **Name the limit of a claim.** If a figure covers only the United States,
  the copy says so. See `provenance.js`, which now makes this structural.
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

| File | What |
|---|---|
| `src/sky/contents/readings.json` | 200 headline and body pairs, indexed by area then tone |
| `src/sky/contents/touches.json` | The clause naming which part of the chart was struck |
| `src/sky/contents/motion.json` | The clause about timing |
| `src/sky/contents/columns.json` | Longer standing pieces |
| `src/sky/contents/areas.json` | The nine areas of life, and the sectors behind each |
| `index.html` | The landing page and the shell |

The three reading tables multiply: nine areas by five tones by five
variants, times thirty-five touches, times fourteen motions. That is where
the variety comes from, not from generating anything on the fly.

## 6. Things the product does not say

- It does not predict events.
- It does not tell anybody what they are like.
- It does not claim authority it cannot show the working for.
- It does not say *"the only figure we did not work out ourselves"* or any
  other variation on repeating its own methodology at the reader. The
  provenance marker exists so the copy does not have to.
