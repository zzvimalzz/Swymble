/*
   VOICE.md section 4, rule 3, made real.

   The premise of the product is that everything on the page is checkable.
   A model asked to phrase a reading is useful; a model asked to *know*
   anything is a liability, because one invented date on a keepsake is the
   end of the only claim MyBirth has. So generated copy is never trusted on
   the strength of a good prompt. It is checked.

   The check is deliberately dumb and mechanical: every number and every
   proper noun in the output must already appear in the input the model was
   given. A dumb check that always runs beats a clever one that is skipped,
   and a model cannot talk its way past a set membership test.

   This lives in tools/ rather than src/ on purpose. Generation happens
   offline, into src/sky/contents/, reviewed by a human before it ships, so
   none of this belongs in the bundle a visitor downloads.
*/

/*
   Capitalised words that are not claims about the world.

   The first version of this check exempted any word at the start of a
   sentence, on the grounds that it is capitalised by grammar rather than by
   reference. That is true and it is also the hole a bad line walks through:
   "Saturn is squaring your Venus" opens with the invented name, and the
   opening of a sentence is the most likely place for one. So position is
   ignored now and every capitalised word is checked.

   Which means the stop list has to carry the weight. It is not guesswork:
   the ordinary-English half was extracted from every sentence opening in
   the shipped content bank, so the check cannot fire on our own voice, and
   any capitalised word the bank has never used gets looked at.

   The asymmetry is deliberate. A false positive discards a perfectly good
   generated line and we fall back to the written bank, which costs nothing.
   A false negative prints an invented name on something somebody frames.
   When in doubt, fire.
*/
const HARMLESS = new Set([
  // pronouns, articles, and the ordinary machinery of a sentence
  "I", "A", "An", "The", "It", "Its", "You", "Your", "Yours", "They", "Their",
  "We", "Our", "This", "That", "These", "Those", "There", "Then", "Than",
  "And", "But", "Or", "So", "Because", "If", "When", "While", "Where",
  "What", "Whatever", "Who", "Whom", "How", "Why", "Which", "Whether",
  "No", "Not", "Nor", "Yes", "Never", "Always", "Now", "Here",
  // calendar words, which are real nouns a reading may legitimately use
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December",
  "Today", "Tomorrow", "Yesterday", "Tonight",
  // every word the content bank has ever opened a sentence with
  "Accounts", "Agreeing", "Ambition", "Answer", "Ask", "Asking", "Assume",
  "At", "Attend", "Bank", "Be", "Beauty", "Being", "Belief", "Book",
  "Borrowed", "Both", "Caffeine", "Call", "Calling", "Certainty", "Check",
  "Choose", "Choosing", "Close", "Closeness", "Closing", "Coasting", "Cold",
  "Come", "Comfort", "Comparing", "Conductor's", "Cook", "Cooking",
  "Correcting", "Counting", "Craft", "Deal", "Decide", "Deflecting", "Depth",
  "Discipline", "Do", "Doing", "Draw", "Either", "Enthusiasm", "Even",
  "Every", "Eye", "Faith", "Find", "Finish", "Finishing", "Fix", "Fixing",
  "Follow", "For", "General", "Give", "Go", "Going", "Growth", "Half",
  "Happy", "Have", "Hedging", "Home", "Honest", "Hot", "Independence",
  "Intensity", "Introduce", "Invite", "Itineraries", "Jealousy", "Keeping",
  "Lead", "Learn", "Leaving", "Let", "Listening", "Long", "Look", "Loud",
  "Love", "Main", "Make", "Making", "Martyrdom", "Merging", "Momentum",
  "Money", "More", "Move", "Name", "Naming", "Neither", "New", "Next",
  "Nobody", "Notice", "Occupy", "One", "Only", "Open", "Optimism", "Out",
  "Overbooking", "Past", "Perfectionism", "Pick", "Plain", "Play", "Put",
  "Quiet", "Reach", "Read", "Reading", "Receiving", "Refusing", "Rehearsing",
  "Repetition", "Rest", "Reuse", "Roots", "Saving", "Say", "Saying",
  "Second", "Self", "Separating", "Settle", "Sex", "Sharp", "Ship", "Show",
  "Side", "Silence", "Sit", "Skip", "Sleeping", "Small", "Somebody",
  "Someone", "Something", "Sort", "Spend", "Splitting", "Start", "Stay",
  "Staying", "Still", "Stop", "Structure", "Take", "Talk", "Teach",
  "Thinking", "Tidy", "Trust", "Turning", "Twenty", "Two", "Use", "Vague",
  "Waiting", "Wanting", "Winning", "Withholding", "Work", "Working",
  "Write", "Writing", "Zoom",
  /*
     And from the files the bank gained later: quiet.json, signs.json,
     depth.json and the money readings. Same test applied by hand as the
     block above: an ordinary English word that is capitalised by grammar
     and makes no claim about the world. Adding one is maintenance. Adding
     a word that names something real would not be, and the way to tell
     the difference is to ask whether a generated line could use it to
     assert a fact nobody checked.
  */
  "Nothing", "Planets", "Outside", "Seven", "Round", "Buy", "Sell", "Pay",
  "Point", "Set", "Worth", "Split", "Things", "Transits", "Contacts",
  "Boundaries", "Send", "Just", "Leave", "Try", "Warmth", "Argue",
  "Traffic", "Twelve", "People", "Effort", "Conversation", "Testing", "Ease",
  "Occupied",
  /*
     And from the corpus rewrite, where the body stopped being one clause
     and became a paragraph that states a thing, says what follows from it,
     and then tells the reader what to do. Three or four sentences instead
     of one means three or four times as many sentence openings, and almost
     all of the new ones are imperative verbs, which is what a Co-Star style
     reading is mostly made of.

     Same test applied as the block above, one word at a time: an ordinary
     English word, capitalised by grammar, making no claim about the world.
     None of these could be used to assert a fact nobody checked.
  */
  "Accept", "Act", "Angles", "Averaging", "Blocked", "Build", "Cancelling",
  "Carrying", "Change", "Cheap", "Clear", "Control", "Correct", "Cut",
  "Decisions", "Each", "Enjoy", "Everybody", "Everything", "Expanding",
  "Fault", "Feeding", "Freedom", "From", "Held", "Judge", "Kindness",
  "List", "Listen", "Lower", "Nearly", "None", "Novelty", "Pleasure",
  "Postpone", "Praise", "Rearranging", "Reply", "Repurpose", "Ring",
  "Room", "Satisfying", "Sitting", "Slightly", "Sorting", "Specificity",
  "Starting", "Tell", "Ten", "Test", "Text", "Turn", "Volume", "Wait",
  "Watch",
  /*
     And from doubling the bank to ten variants a cell. Same test as every
     block above, one word at a time: ordinary English, capitalised by
     grammar, asserting nothing about the world. The number words are here
     for the same reason "Seven" and "Twelve" already were, which is that a
     sentence is allowed to begin by counting something the reader can see.
  */
  "Add", "Admitting", "Automate", "Badly", "Bring", "Carry", "Confidence",
  "Decline", "Describe", "Doubt", "Drop", "Explaining", "Feedback", "Five",
  "Get", "Giving", "Having", "Holding", "Houses", "In", "Individually",
  "Information", "Late", "Loyalty", "Meet", "Nine", "Offer", "Older",
  "Own", "Plan", "Present", "Protect", "Renegotiating", "Reread",
  "Rewrite", "Rewriting", "Save", "Separate", "Sign", "Space", "State",
  "Suggest", "Uncomfortable", "Unowned", "Update", "Updating", "Volunteer",
  /*
     And from rekeying the two lower paragraphs by area, which turned them
     from encyclopaedia entries into prose about a part of a life. Same
     test as every block above, one word at a time.
  */
  "About", "Appetite", "Charge", "Clarity", "Days", "Friction",
  "Friendships", "Knowing", "Less", "Most", "Openings", "Recognition",
  "Slow", "Talking", "Thirteen", "Trouble", "Whichever",
  /*
     And from friends.json, where the subject is somebody else and the
     reader is you. Note that "{name}", "{planet}" and "{sign}" are holes
     rather than words: the renderer fills them from a chart, which is how
     that table can name a placement without this check having anything to
     object to. A line that spelled one out could be printed against the
     wrong one, which is the whole reason this file exists.
  */
  "As", "Cancel", "Coming", "Help", "On", "Research", "Stopping", "With",
]);

/** Every number in a string, normalised so 6.30 and 6.3 compare equal. */
function numbers(text) {
  return (String(text).match(/-?\d[\d,]*(?:\.\d+)?/g) || [])
    .map((n) => Number(n.replace(/,/g, "")))
    .filter((n) => Number.isFinite(n));
}

/** Capitalised words that look like references to something in the world. */
function properNouns(text) {
  const out = new Set();
  for (const word of String(text).match(/\b[A-Z][a-zA-Z'’-]+\b/g) || []) {
    if (HARMLESS.has(word)) continue;
    // a compound is only as suspicious as its first part: "Second-guessing"
    // opens a sentence for the same grammatical reason "Second" does
    if (HARMLESS.has(word.split("-")[0])) continue;
    out.add(word);
  }
  return out;
}

/** Everything the model was allowed to know, flattened into one haystack. */
function haystack(facts) {
  const parts = [];
  const walk = (v) => {
    if (v == null) return;
    if (typeof v === "string" || typeof v === "number") { parts.push(String(v)); return; }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (typeof v === "object") { Object.values(v).forEach(walk); }
  };
  walk(facts);
  return parts.join("   ");
}

/**
 * Check generated copy against the facts it was generated from.
 *
 * Returns a list of problems. An empty list means the copy may be used;
 * anything else means it is discarded and the written bank is used instead.
 * There is no partial credit and no "probably fine" path: see VOICE.md.
 */
export function validateCopy(text, facts) {
  const problems = [];
  const source = haystack(facts);

  const allowedNumbers = new Set(numbers(source));
  for (const n of numbers(text)) {
    if (!allowedNumbers.has(n)) {
      problems.push({ kind: "invented number", value: n });
    }
  }

  const allowedNouns = properNouns(source);
  // the source is trusted, so its own capitalisation rules are looser:
  // anything capitalised anywhere in the facts counts as available
  for (const w of String(source).match(/\b[A-Z][a-zA-Z'’-]+\b/g) || []) allowedNouns.add(w);

  for (const w of properNouns(text)) {
    if (!allowedNouns.has(w)) {
      problems.push({ kind: "invented name", value: w });
    }
  }

  return problems;
}

/** True when the copy may be shown. Fails closed on anything unexpected. */
export function copyIsSafe(text, facts) {
  try {
    return validateCopy(text, facts).length === 0;
  } catch {
    return false;
  }
}
