import { z } from "zod";

/**
 * Payload schemas for each tabular dataset artifact — shared by the ETL
 * (which validates before publishing) and the app (which validates after
 * fetching). The envelope around these lives in ./dataset.
 */

/** Annual district population, in thousands of people (as published by DOSM). */
export const populationDistrictPayloadSchema = z.array(
  z.object({
    state: z.string().min(1),
    district: z.string().min(1),
    year: z.number().int().gte(2020).lte(2100),
    population: z.number().nonnegative(),
  }),
);
export type PopulationDistrictRow = z.infer<typeof populationDistrictPayloadSchema>[number];

/** Annual district real GDP by sector, RM millions at constant 2015 prices. */
export const gdpDistrictPayloadSchema = z.array(
  z.object({
    state: z.string().min(1),
    district: z.string().min(1),
    year: z.number().int().gte(2010).lte(2100),
    /** DOSM sector code: p0 overall, p1 agriculture, p2 mining, p3 manufacturing, p4 construction, p5 services. */
    sector: z.enum(["p0", "p1", "p2", "p3", "p4", "p5"]),
    value: z.number(),
  }),
);
export type GdpDistrictRow = z.infer<typeof gdpDistrictPayloadSchema>[number];

/** Gross monthly household income by district, RM. */
export const householdIncomeDistrictPayloadSchema = z.array(
  z.object({
    state: z.string().min(1),
    district: z.string().min(1),
    year: z.number().int().gte(2010).lte(2100),
    incomeMean: z.number().positive(),
    incomeMedian: z.number().positive(),
  }),
);
export type HouseholdIncomeDistrictRow = z.infer<
  typeof householdIncomeDistrictPayloadSchema
>[number];

/** Weekly retail fuel prices, RM per litre. */
export const fuelPricePayloadSchema = z.array(
  z.object({
    /** ISO date of the price-setting week (YYYY-MM-DD). */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    ron95: z.number().positive(),
    ron97: z.number().positive(),
    diesel: z.number().positive(),
  }),
);
export type FuelPriceRow = z.infer<typeof fuelPricePayloadSchema>[number];
