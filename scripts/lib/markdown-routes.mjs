// Which routes have a Markdown twin, shared by the script that writes them
// (generate-markdown.mjs) and the script that advertises them (prerender-meta.mjs).
//
// It lives in its own module because the two must agree exactly. A page whose HTML advertises a
// .md that was never written sends an agent to a 404; a .md nothing links to is never found.

/** Routes with a hand-built Markdown view. Dynamic ones are covered by hasMarkdown() below. */
export const MARKDOWN_ROUTES = new Set(['/', '/about', '/labs', '/projects', '/blog']);

/**
 * `/contact` and `/resume` are deliberately absent. The contact page is a form — there is nothing
 * for an agent to read that /about.md and llms.txt do not already say — and the resume is
 * assembled from the career graph at render time, so a Markdown copy would be a second renderer
 * to keep correct rather than a second view of the same data.
 */
export const hasMarkdown = (routePath) =>
  MARKDOWN_ROUTES.has(routePath) || routePath.startsWith('/labs/') || routePath.startsWith('/blog/');

/** dist/<route>.md, with `/` mapping to dist/index.md. */
export const markdownFileFor = (routePath) =>
  routePath === '/' ? 'index.md' : `${routePath.replace(/^\//, '')}.md`;

export const markdownUrlFor = (siteUrl, routePath) => `${siteUrl}/${markdownFileFor(routePath)}`;
