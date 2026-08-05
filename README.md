# Swymble

**[swymble.com](https://swymble.com)** — the site for Swymble, a one-person software studio and
engineering lab based in Kuala Lumpur, Malaysia. It builds websites, apps and AI systems for
businesses as client work, and develops its own experimental products under Swymble Labs.

Built with React and Vite, deployed to GitHub Pages. Responsive, prerendered for crawlers, and
generated from a single set of data files under `src/data`.

## Swymble Labs

| Project | What it is | |
| --- | --- | --- |
| [Cortex](https://swymble.com/labs/cortex) | AI platform with persistent long-context memory and hybrid retrieval | In development |
| [MyBirth](https://swymble.com/labs/mybirth) | Rebuilds the day you were born as a shareable keepsake archive | [Live](https://mybirth.swymble.com) |
| [MyDompet](https://swymble.com/labs/mydompet) | Offline-first money tracker for Android and iOS, no account server | In development |
| [what2watch](https://swymble.com/labs/what2watch) | Tens of thousands of films and shows as one interactive voronoi wall | [Live](https://what2watch.swymble.com) |
| [Watch Paint Dry](https://swymble.com/labs/watchpaintdry) | A deliberately pointless relaxation toy | [Live](https://www.watchpaintdry.net) |
| [Territory](https://swymble.com/labs/territory) | Fitness app that turns real-world movement into map territory | Private alpha |

## Development

```bash
npm ci
npm run dev      # main site + the mybirth and what2watch subdomain apps
npm test         # data-integrity and route checks
npm run build    # everything, including prerendered HTML and generated SEO files
```

## Docs

- [`docs/swymble-hosting.md`](docs/swymble-hosting.md) — hosting, subdomains and Cloudflare setup
- [`docs/search-visibility.md`](docs/search-visibility.md) — how the site is made findable, and
  the Search Console / Bing / backlink steps that live outside this repo
- Each folder under `src/data` has its own README with the field reference for that section
