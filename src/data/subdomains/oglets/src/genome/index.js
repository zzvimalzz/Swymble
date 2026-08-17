/* The genome layer's front door. Everything here is deterministic and free of the DOM, so the
   repo's vitest suite covers it (this project has no DOM test environment — the rule is that
   anything worth testing gets extracted into a pure function like these).

   Import from this barrel rather than from the individual files unless you are inside the
   genome folder yourself; it is the seam that lets the tables be split further without every
   caller changing. */

export { CAT_LABELS, CATS, CODED, GENES, RANGES, geneOf } from './genes.js'
export {
  AXES,
  AXIS_ENDS,
  CHARACTERS,
  EXTREME,
  axesOf,
  characterById,
  characterOf,
  shareOf,
  shares,
} from './character.js'
export { COMBO_COUNT, RADIX, comboAt, comboIds, comboOrder, comboRank, comboScore } from './combos.js'
export { CODE_LENGTH, decode, encode } from './codec.js'
export { AGEING, ID_BYTES, genomeOf, groupId, hatchId, isId, newId, streamFor } from './derive.js'
export { hash } from './hash.js'
export { nameOf } from './names.js'
export { RARITY_LADDER, maxRarityPoints, rarityOf, traitsOf } from './rarity.js'
export { combinations, odds, randomGenome, rollFrom } from './roll.js'
export { TIERS, TIER_QUOTA, chanceText, oddsText, tierById, tierIndex, tierOfAllele } from './tiers.js'
