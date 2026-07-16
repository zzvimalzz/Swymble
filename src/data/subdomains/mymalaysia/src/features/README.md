# src/features

One folder per product module: `home/`, `explorer/`, `live/`, `economy/`,
`population/`, `environment/`, `infrastructure/`, `timeline/` (added as they
ship).

A feature owns everything specific to it — components, hooks, logic, local
types — and exposes a deliberately small public surface through its
`index.ts`. Route files in `src/app` import only from that surface.

Rules:

- **Features never import other features.** Anything two features need
  graduates to `src/components`, `src/hooks`, `src/lib`, or `src/services`.
- A feature may be deleted by removing its folder and its route — nothing
  else in the codebase should break.
