import { describe, expect, it } from 'vitest';
import { neckEdge, neckPath, type Circle } from './fusionNeck';

const a: Circle = { x: 200, y: 200, r: 60 };

/** How far apart two 60px circles are when they overlap by `depth` px. */
const at = (depth: number): Circle => ({ x: 200 + 120 - depth, y: 200, r: 60 });

/** Every number in a path, in order. */
const numbers = (path: string): number[] => (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe('the neck between two squeezed bubbles', () => {
  it('draws nothing until the two actually overlap', () => {
    expect(neckPath(a, at(-1), 1)).toBeNull();
    expect(neckPath(a, at(0), 1)).toBeNull();
    expect(neckPath(a, at(4), 1)).not.toBeNull();
  });

  it('draws nothing for circles that are not two circles', () => {
    // Concentric, and one swallowed whole: no crossing, so no notch to fill.
    expect(neckPath(a, { ...a }, 1)).toBeNull();
    expect(neckPath(a, { x: 200, y: 200, r: 20 }, 1)).toBeNull();
  });

  it('fills the notch on both sides, symmetrically about the centre line', () => {
    const path = neckPath(a, at(20), 0.5)!;

    // Two patches, each a move, a curve and a closing line.
    expect(path.match(/M/g)).toHaveLength(2);
    expect(path.match(/Q/g)).toHaveLength(2);
    expect(path.match(/Z/g)).toHaveLength(2);

    // The two circles sit on y = 200, so every point one patch puts above that line the other
    // puts the same distance below it.
    const ys = numbers(path).filter((_value, index) => index % 2 === 1);
    const above = ys.slice(0, ys.length / 2).map((y) => y - 200);
    const below = ys.slice(ys.length / 2).map((y) => y - 200);
    above.forEach((offset, index) => expect(offset).toBeCloseTo(-below[index], 6));
  });

  it('grows with the strain, so the reader can see the merge coming', () => {
    const reach = (strain: number) => Math.max(...numbers(neckPath(a, at(20), strain)!).filter((_v, i) => i % 2 === 1));

    expect(reach(1)).toBeGreaterThan(reach(0.5));
    expect(reach(0.5)).toBeGreaterThan(reach(0));
    // Clamped: a strain outside 0..1 must not blow the patch up.
    expect(reach(4)).toBeCloseTo(reach(1), 6);
  });

  it('gives the edge the same curve without the line that runs under the bubbles', () => {
    const edge = neckEdge(a, at(20), 0.5)!;

    expect(edge.match(/Q/g)).toHaveLength(2);
    expect(edge).not.toContain('Z');
    expect(edge).not.toContain('L');
    expect(neckEdge(a, at(-1), 1)).toBeNull();
  });
});
