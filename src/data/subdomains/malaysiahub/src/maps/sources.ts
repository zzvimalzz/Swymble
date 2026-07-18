/**
 * Map data sources. URLs are relative (served from public/maps/) until the
 * R2 data lake ships (Milestone 8), when these switch to
 * `${env.NEXT_PUBLIC_DATA_BASE_URL}/maps/…` — only this file changes.
 */

export const BOUNDARY_SOURCES = {
  states: {
    id: "my-states",
    url: "/maps/malaysia-states.geojson",
    /** Property promoted to the feature id for feature-state. */
    promoteId: "code_state",
  },
  districts: {
    id: "my-districts",
    url: "/maps/malaysia-districts.geojson",
    promoteId: "fid",
  },
} as const;

export type BoundaryLevel = keyof typeof BOUNDARY_SOURCES;
