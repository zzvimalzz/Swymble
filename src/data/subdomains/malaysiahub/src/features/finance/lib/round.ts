/** Round to 2 decimal places (sen precision). Shared by the finance engines. */
export const round2 = (value: number): number => Math.round(value * 100) / 100;
