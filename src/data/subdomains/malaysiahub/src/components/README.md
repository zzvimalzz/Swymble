# src/components

Shared presentational components with no feature knowledge.

- `ui/` — shadcn/ui primitives. Managed by the shadcn CLI; hand-edits are
  allowed but deliberate (note them in the PR).
- `layout/` — the global shell: navigation, footer, command palette, theme
  toggle.
- Anything else shared by ≥2 features lives at this root.

If a component knows about a specific dataset or module, it belongs in that
feature, not here.
