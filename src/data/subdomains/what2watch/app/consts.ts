// Bright mode has been removed - what2watch is dark-only. THEME is kept as
// a single-member enum (rather than deleted outright) so the engine's
// generic per-theme uniform mechanism (see vf/utils/uniforms.ts) still
// typechecks without a wider refactor.
export enum THEME {
  dark = 'dark',
}
