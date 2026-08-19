/**
 * The one width the labs page changes its behaviour at, in one place.
 *
 * It is shared because two files have to agree about it and they are nowhere near each other:
 * DesktopLabs decides whether to run gravity, and SiteView decides whether to render the button
 * that turns it on. When those two disagreed the phone got an anvil that did nothing.
 */

/** Below this, the deck is a single card and the page does not fall. The bubbles and the fusion
 *  egg run at every width — only gravity is desktop-only, because a page collapsing into a heap
 *  needs a pointer that can pick things back up and a viewport that does not move under it. */
export const LABS_COMPACT_QUERY = '(max-width: 780px)';
