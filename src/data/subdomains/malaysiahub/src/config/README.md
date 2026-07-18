# src/config

Runtime configuration — values that could legitimately differ between
environments or deployments:

- `env.ts` — Zod-validated public environment variables. The only place
  `process.env` is read.
- `site.ts` — site identity: name, description, canonical URL, social links.
- `navigation.ts` — the route registry: every internal path, its label, and
  nav visibility. Components never hardcode internal paths.

Domain facts that can never differ per environment belong in
`src/constants`.
