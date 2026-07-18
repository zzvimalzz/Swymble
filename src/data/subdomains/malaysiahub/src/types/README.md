# src/types

Cross-cutting TypeScript types and Zod schemas: the dataset metadata model
(source, licence, last-updated, refresh schedule, quality status), geographic
entities (state, district), and other contracts shared between the app and
`etl/`.

Feature-local types stay in their feature. If a type is only used by one
module, it does not belong here.
