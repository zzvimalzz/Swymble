/**
 * Serialises a JSON-LD payload for injection into a `<script type="application/ld+json">` body.
 *
 * `JSON.stringify` does not escape `<`, so a `</script>` sequence anywhere in the data would end
 * the script element early and everything after it would be parsed as HTML. Every value in these
 * payloads is a repo-authored constant today, so there is no path for an outsider to put one
 * there — but that is a property of where the content currently comes from, not of the code, and
 * these become stored-XSS sinks the day any of it is sourced from a CMS, a fetched feed or a
 * contributed data file.
 *
 * `<` costs nothing and removes the question: JSON-LD consumers read it back as `<`, so the
 * emitted structured data is unchanged.
 *
 * Only needed where the JSON is interpolated into HTML. Assigning to `script.textContent` (as
 * useRouteSeo.ts does) never re-parses, and is safe without this.
 */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
