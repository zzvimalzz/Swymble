# src/assets

Importable static assets: SVG illustrations, logos, decorative graphics.
Imported by components so they participate in bundling and hashing.

Files that must be served verbatim at a fixed URL (favicons, manifest, OG
images) go in `public/` instead. Fonts load via `next/font`, not from here.
