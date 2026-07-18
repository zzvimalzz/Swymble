# src/services

Data access — the only layer allowed to call `fetch`.

Planned occupants (Milestone 7): the dataset registry client, the R2 artifact
fetch layer with caching, and realtime API clients (weather, transit, rates).

Services return typed, validated domain objects (schemas from `src/types`),
never raw responses. Components and features consume services; they never
fetch directly.
