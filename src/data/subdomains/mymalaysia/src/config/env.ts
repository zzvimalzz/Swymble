import { z } from "zod";

/**
 * Public (client-safe) environment configuration.
 *
 * Every variable is statically inlined by Next.js at build time, so each one
 * must be referenced explicitly below — never via dynamic `process.env[key]`.
 * Defaults are the production values: a fresh clone builds without any .env.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("https://malaysiahub.swymble.com"),
  /**
   * Base URL of the data lake. Empty string = same-origin (artifacts are
   * committed under public/data and deploy with the site). Set to the R2
   * custom domain once bucket + DNS exist — nothing else changes.
   */
  NEXT_PUBLIC_DATA_BASE_URL: z.union([z.url(), z.literal("")]).default(""),
  /**
   * Progressive basemap: URL of a complete MapLibre style JSON (e.g. a
   * Protomaps style over PMTiles on R2). Empty = the flat data canvas.
   * The engine merges its data overlay on top — see mergeOntoBasemap.
   */
  NEXT_PUBLIC_BASEMAP_STYLE_URL: z.union([z.url(), z.literal("")]).default(""),
  /**
   * Progressive 3D terrain: URL of a raster-dem TileJSON (or pmtiles://
   * archive). Empty = no terrain. Enables setTerrain + hillshading.
   */
  NEXT_PUBLIC_TERRAIN_DEM_URL: z
    .union([z.url(), z.string().startsWith("pmtiles://"), z.literal("")])
    .default(""),
});

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DATA_BASE_URL: process.env.NEXT_PUBLIC_DATA_BASE_URL,
  NEXT_PUBLIC_BASEMAP_STYLE_URL: process.env.NEXT_PUBLIC_BASEMAP_STYLE_URL,
  NEXT_PUBLIC_TERRAIN_DEM_URL: process.env.NEXT_PUBLIC_TERRAIN_DEM_URL,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
