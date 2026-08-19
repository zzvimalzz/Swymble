/**
 * Copy for the specimen card — what appears when two labs are squeezed into one bubble on /labs.
 *
 * Everything else about a fusion is *derived from the two labs themselves* (see
 * components/desktop/Labs/fusionLore.ts): the name is a portmanteau of their titles, the blurb is
 * the front of one summary welded to the back of the other, and the highlights are one claim from
 * each. Twenty-one pairs and every chain beyond them cannot be written by hand, and a generated
 * mash of two real products is funnier than anything that could be.
 *
 * Only the fixed furniture lives here.
 */

export const LAB_FUSION = {
  /**
   * The chip where a lab card carries its status, for a specimen that has not set its own `tag`.
   * It is not one of the real statuses on purpose — nothing should ever be tempted to filter or
   * link this thing.
   */
  status: 'UNSTABLE',
} as const;
