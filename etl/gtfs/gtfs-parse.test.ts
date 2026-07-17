import { describe, expect, it } from "vitest";

import { compactLine, parseGtfsCsv, simplifyLine, type LonLat } from "./gtfs-parse";

describe("parseGtfsCsv", () => {
  it("parses headers, CRLF lines, and quoted fields with commas", () => {
    const rows = parseGtfsCsv(
      'route_id,route_long_name,route_color\r\nU3000,"Maluri ~ Ampang, via Jalan X",006CFF\r\n\r\n',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      route_id: "U3000",
      route_long_name: "Maluri ~ Ampang, via Jalan X",
      route_color: "006CFF",
    });
  });

  it("strips a UTF-8 BOM and handles escaped quotes", () => {
    const rows = parseGtfsCsv('﻿a,b\n"say ""hi""",2');
    expect(rows[0]).toEqual({ a: 'say "hi"', b: "2" });
  });

  it("returns [] for empty input", () => {
    expect(parseGtfsCsv("")).toEqual([]);
  });
});

describe("simplifyLine", () => {
  it("drops collinear points but keeps corners and endpoints", () => {
    const line: LonLat[] = [
      [0, 0],
      [0.001, 0.000001], // ~on the segment
      [0.002, 0],
      [0.002, 0.002], // corner
      [0.002, 0.004],
    ];
    const simplified = simplifyLine(line, 1e-4);
    expect(simplified[0]).toEqual([0, 0]);
    expect(simplified[simplified.length - 1]).toEqual([0.002, 0.004]);
    expect(simplified).toContainEqual([0.002, 0]);
    expect(simplified.length).toBeLessThan(line.length);
  });

  it("keeps 2-point lines untouched", () => {
    const line: LonLat[] = [
      [0, 0],
      [1, 1],
    ];
    expect(simplifyLine(line, 0.5)).toEqual(line);
  });
});

describe("compactLine", () => {
  it("rounds to 5 dp and removes consecutive duplicates", () => {
    const compacted = compactLine([
      [101.123456789, 3.987654321],
      [101.123458, 3.9876549], // same after rounding
      [101.2, 3.9],
    ]);
    expect(compacted).toEqual([
      [101.12346, 3.98765],
      [101.2, 3.9],
    ]);
  });
});
