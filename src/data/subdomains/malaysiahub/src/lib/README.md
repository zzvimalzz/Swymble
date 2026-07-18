# src/lib

Pure utilities: no React, no IO, no imports from any other `src/` layer
except `src/types` and `src/constants`. Safe to import from anywhere,
including `etl/`.

Unit-test everything here — pure functions are the cheapest tests in the
repo.
