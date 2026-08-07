// Reading and rewriting the `<meta>` tags in a built HTML file.
//
// Shared by the two scripts that both touch them: prerender-meta.mjs stamps per-route values into
// dist/<route>/index.html, and prerender-snapshot.mjs overwrites that same file with the rendered
// DOM and has to carry some of them back across. Two copies of this matching drifted once already
// (see preserveSocialMeta in prerender-snapshot.mjs for what that cost), so it lives here.
//
// Deliberately regex over a parser: the target is one `<head>` written by this repo, in a known
// shape, and the alternative is a DOM dependency in a build step that has no other use for one.
// Every helper matches `<meta attr="value" content="...">` with the attributes in that order,
// which is the order index.html uses and the order the browser's own serializer emits for the
// tags useRouteSeo.ts creates.

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const metaPattern = (attr, attrValue) =>
  new RegExp(`(<meta ${attr}="${escapeRegExp(attrValue)}" content=")([^"]*)(")`);

/** The `content` of `<meta attr="attrValue">`, or null when the tag is absent. */
export const readMetaContent = (html, attr, attrValue) => {
  const match = metaPattern(attr, attrValue).exec(html);
  return match ? match[2] : null;
};

/**
 * Rewrites the `content` of `<meta attr="attrValue">`. Returns the HTML unchanged (with a warning
 * naming the tag) when it is absent — a missing tag means index.html changed shape, which is worth
 * seeing in the build log rather than silently producing a page with no og:image.
 */
export const replaceMetaContent = (html, attr, attrValue, content, logPrefix = '[html-meta]') => {
  const pattern = metaPattern(attr, attrValue);

  if (!pattern.test(html)) {
    console.warn(`${logPrefix} Could not find <meta ${attr}="${attrValue}"> to stamp.`);
    return html;
  }

  return html.replace(pattern, (_match, pre, _old, post) => `${pre}${escapeHtml(content)}${post}`);
};
