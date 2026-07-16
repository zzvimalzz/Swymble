import { z } from "zod";

/**
 * Public (client-safe) environment configuration.
 *
 * Every variable is statically inlined by Next.js at build time, so each one
 * must be referenced explicitly below — never via dynamic `process.env[key]`.
 * Defaults are the production values: a fresh clone builds without any .env.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("https://mymalaysia.swymble.com"),
  /**
   * Base URL of the data lake. Empty string = same-origin (artifacts are
   * committed under public/data and deploy with the site). Set to the R2
   * custom domain once bucket + DNS exist — nothing else changes.
   */
  NEXT_PUBLIC_DATA_BASE_URL: z.union([z.url(), z.literal("")]).default(""),
});

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_DATA_BASE_URL: process.env.NEXT_PUBLIC_DATA_BASE_URL,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
