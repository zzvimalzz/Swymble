# workers

Standalone Cloudflare Workers that are not the Next.js app. Each worker gets
its own folder with its own `wrangler.jsonc` and README.

Planned: a realtime proxy worker (weather, transit vehicle positions) that
fronts official public APIs with edge caching and normalised, typed
responses — keeping upstream quirks and rate limits away from browsers.

The Next.js app's own Worker is built by OpenNext from the repo root; it does
not live here.
