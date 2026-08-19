import { describe, expect, it } from 'vitest';
import { SWYMBLE_LABS } from '../../../data/labs';
import { fusedId } from './bubbleFusion';
import { chimeraName, portmanteau, spliceCategories, spliceSummaries, specimenFor } from './fusionLore';

const LABS = SWYMBLE_LABS.filter((lab) => lab.visibility !== 'private');
const ORDER = LABS.map((lab) => lab.id);

/** Every pair of real labs, which is what the reader can actually make. */
const PAIRS = LABS.flatMap((left, index) => LABS.slice(index + 1).map((right) => [left, right] as const));

describe('the chimera name', () => {
  it('welds the front of one name to the back of the other', () => {
    expect(portmanteau('OGLETS', 'MYBIRTH')).toBe('OGLIRTH');
    expect(portmanteau('CORTEX', 'WHAT2WATCH')).toBe('CORWATCH');
    expect(portmanteau('MYDOMPET', 'TERRITORY')).toBe('MYDOITORY');
  });

  it('closes the gaps in a title that is three words long', () => {
    expect(portmanteau('WATCH PAINT DRY', 'CORTEX')).toBe('WATCHPATEX');
  });

  it('collapses a repeated letter at the seam', () => {
    // 'AB' + 'BQ' would be ABBQ, which reads as a typo rather than as a name.
    expect(portmanteau('ABCD', 'XXBQ')).toBe('ABQ');
  });

  it('takes a slice from every member of a chain, not just the two ends', () => {
    const three = chimeraName(['MYDOMPET', 'OGLETS', 'WHAT2WATCH']);

    expect(three).toBe('MYDLEATCH');
    // Folding two at a time gave a three-way the same word as one of its own pairs.
    expect(three).not.toBe(portmanteau('MYDOMPET', 'WHAT2WATCH'));
  });

  it('survives the shortest and longest names on the page', () => {
    expect(portmanteau('A', 'B')).toBe('AB');
    expect(chimeraName(['OGLETS'])).toBe('OGLETS');
    expect(chimeraName([])).toBe('');
    expect(portmanteau('WATCHPAINTDRY', 'WATCHPAINTDRY').length).toBeLessThanOrEqual(16);
  });
});

describe('the spliced copy', () => {
  it('describes two products as though they were one thing', () => {
    expect(spliceSummaries('A wall of paint, and a timer.', 'A creature made of eyes, it watches you.')).toBe(
      'A wall of paint, a creature made of eyes.',
    );
  });

  it('cuts at a full stop as readily as at a comma', () => {
    // One summary opens with two sentences before its first comma. Splitting on the comma alone
    // dragged the whole first sentence into the blurb along with the start of the second.
    expect(spliceSummaries('A money tracker for Android. Every transaction lives on your phone.', 'A wall of paint.')).toBe(
      'A money tracker for Android, a wall of paint.',
    );
  });

  it('makes a category that is wrong and entirely plausible', () => {
    expect(spliceCategories('BROWSER CREATURE', 'MEDIA DISCOVERY')).toBe('MEDIA CREATURE');
  });
});

describe('a specimen', () => {
  it('resolves to a full card for every pair of labs on the page', () => {
    // Structure only. What the copy *says* is the author's business and is checked nowhere —
    // asserting a house style here is what made this file go red on good writing twice.
    for (const [left, right] of PAIRS) {
      const specimen = specimenFor(fusedId([left.id, right.id], ORDER), LABS);

      expect(specimen).not.toBeNull();
      expect(specimen!.name).not.toBe('');
      expect(specimen!.category).not.toBe('');
      expect(specimen!.tagline).not.toBe('');
      expect(specimen!.status).not.toBe('');
      expect(specimen!.highlights.length).toBeGreaterThan(0);
      expect(specimen!.members).toHaveLength(2);
    }
  });

  it('falls back to generated copy for a pairing nobody has written', () => {
    // The safety net, tested on its own rather than through the authored cards — which is what the
    // check above used to be doing, badly. An eighth lab makes seven of these on the day it lands.
    const [left, right] = PAIRS[0];
    const unwritten = specimenFor(fusedId([left.id, right.id], ORDER), [
      { ...left, id: 'ghost-left' },
      { ...right, id: 'ghost-right' },
    ]);

    expect(unwritten).toBeNull();

    const generated = specimenFor('fused:ghost-left+ghost-right', [
      { ...left, id: 'ghost-left' },
      { ...right, id: 'ghost-right' },
    ]);

    expect(generated?.authored).toBe(false);
    expect(generated?.name).toBe(portmanteau(left.title, right.title));
    expect(generated?.tagline).toMatch(/\.$/);
    expect(generated?.image).toBeUndefined();
  });

  it('is the same specimen every time, whichever way round it was squeezed', () => {
    const [left, right] = PAIRS[0];
    const one = specimenFor(fusedId([left.id, right.id], ORDER), LABS);
    const other = specimenFor(fusedId([right.id, left.id], ORDER), LABS);

    expect(one).toEqual(other);
  });


  it('is nothing at all for a single bubble or a lab that no longer exists', () => {
    expect(specimenFor('oglets', LABS)).toBeNull();
    expect(specimenFor('fused:oglets+deleted', LABS)).toBeNull();
  });
});
