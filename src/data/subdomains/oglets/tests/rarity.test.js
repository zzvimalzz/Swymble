import { describe, expect, it } from 'vitest'
import {
  CATS,
  TIER_QUOTA,
  GENES,
  RARITY_LADDER,
  TIERS,
  geneOf,
  genomeOf,
  maxRarityPoints,
  newId,
  rarityOf,
  tierIndex,
  tierById,
  tierOfAllele,
  traitsOf,
} from '../src/genome/index.js'

describe('the tier ladder', () => {
  it('runs from Common to God, rarest last', () => {
    expect(TIERS.map((t) => t.id)).toEqual(['common', 'uncommon', 'rare', 'epic', 'legendary', 'void', 'god'])
  })

  /* A tier is a share of every roll, and the shares are the whole scale. Change one and every
     mutation in that band gets rarer or commoner without anyone touching a weight. */
  it('is a set of spawn shares that add up to exactly one roll', () => {
    const total = TIERS.reduce((sum, t) => sum + t.spawn, 0)
    expect(total).toBeCloseTo(1, 10)
    expect(tierById('common').spawn).toBe(0.6)
    expect(tierById('god').spawn).toBe(0.00001) // 0.001% of rolls
  })

  it('has shares that only ever fall', () => {
    for (let i = 1; i < TIERS.length; i++) expect(TIERS[i].spawn).toBeLessThan(TIERS[i - 1].spawn)
  })

  it('gives one more star for every step down the ladder', () => {
    TIERS.forEach((tier, i) => expect(tier.stars).toBe(i + 1))
  })
})

describe('the tier quota', () => {
  const tiersIn = (cat) => {
    const counts = {}
    for (const allele of GENES[cat]) {
      const id = tierOfAllele(allele).id
      counts[id] = (counts[id] ?? 0) + 1
    }
    return counts
  }

  /* Every gene has to offer something at every tier, or a tier is a word nobody ever wears.
     This is the test that caught the old 60%/40% cuts, where two Commons in one gene would have
     needed 120% of the probability mass and so Common was simply unreachable. */
  it('gives every gene at least two mutations in every tier', () => {
    for (const cat of CATS) {
      if (TIER_QUOTA.sparse.includes(cat)) continue // covered by the sparse rules below
      const counts = tiersIn(cat)
      for (const tier of TIERS) {
        expect(counts[tier.id] ?? 0, `${cat} · ${tier.name}`).toBeGreaterThanOrEqual(TIER_QUOTA.min)
      }
    }
  })

  /* A sparse gene is one whose ordinary outcome is NOTHING — `body`, and so far only `body`. It is
     excused the min rule in the bands it deliberately leaves empty, and it pays for that with
     three others: the bands it does populate still carry two, its default really is the
     overwhelming outcome, and the default sits at index 0 where every fallback path lands. */
  describe('a sparse gene', () => {
    it('has a default that is almost the whole roll, at index 0', () => {
      for (const cat of TIER_QUOTA.sparse) {
        const [fallback] = GENES[cat]
        expect(fallback.w, `${cat} default`).toBeGreaterThanOrEqual(TIER_QUOTA.sparseFloor)
        expect(geneOf(cat, 'no-such-allele'), `${cat} fallback`).toBe(fallback)
      }
    })

    /* Excused `min`, and still capped at the rare end — that is the rule it does not get out of.
       A sparse gene whose Void band filled up would be a catalogue wearing an exemption. */
    it('still cannot let its rare end become a catalogue', () => {
      for (const cat of TIER_QUOTA.sparse) {
        const counts = tiersIn(cat)
        for (const [tier, max] of Object.entries(TIER_QUOTA.maxRare)) {
          expect(counts[tier] ?? 0, `${cat} · ${tier}`).toBeLessThanOrEqual(max)
        }
      }
    })

    /* The band a body sits in IS the statement about it, so no two of them may share one. This is
       the rule that replaces `min` rather than a weaker version of it. */
    it('puts at most one mutation in each band it populates', () => {
      for (const cat of TIER_QUOTA.sparse) {
        const [fallback] = GENES[cat]
        for (const [tier, n] of Object.entries(tiersIn(cat))) {
          if (tier === fallback.tier) continue
          expect(n, `${cat} · ${tier}`).toBe(1)
        }
      }
    })

    it('leaves the whole gene summing to one anyway', () => {
      for (const cat of TIER_QUOTA.sparse) {
        const total = GENES[cat].reduce((sum, a) => sum + a.w, 0)
        expect(total, cat).toBeCloseTo(1, 10)
      }
    })
  })

  it('caps the rare end so a gene cannot be mostly treasure', () => {
    for (const cat of CATS) {
      const counts = tiersIn(cat)
      for (const [tier, max] of Object.entries(TIER_QUOTA.maxRare)) {
        expect(counts[tier] ?? 0, `${cat} · ${tier}`).toBeLessThanOrEqual(max)
      }
    }
  })

  it('lists every gene from commonest to rarest', () => {
    for (const cat of CATS) {
      const weights = GENES[cat].map((a) => a.w)
      expect([...weights].sort((a, b) => b - a), cat).toEqual(weights)
    }
  })
})

describe('how rare an Oglet is', () => {
  const genome = (over) => ({ shape: 'round', pupil: 'dot', iris: 'moss', core: 'ash', body: 'bare', ...over })

  it('scores one trait at a time, not by multiplying odds', () => {
    const { traits, points } = rarityOf(genome())
    expect(traits).toHaveLength(CATS.length)
    expect(points).toBe(traits.reduce((s, t) => s + t.points, 0))
  })

  it('keeps an ordinary Oglet ordinary', () => {
    // the commonest mutation of every gene — the plainest draw there is
    expect(rarityOf(genome()).tier.id).toBe('common')
  })

  /* Four Void traits is 24, which is exactly the God step — and about one Oglet in 10¹⁰. So an
     ordinary roll *can* reach the top in principle, and in practice never will: God means a
     God-line mutation, which is the point of having them.

     The `body` gene did not move this step, and that is the point of it being sparse: a Bare body
     is Common and scores nothing, so the four-gene arithmetic the ladder was cut against is
     exactly the arithmetic 98.5% of Oglets still do. */
  it('needs every gene at once for an ordinary roll to reach the top', () => {
    const luckiest = genome({ shape: 'wedge', pupil: 'heart', iris: 'void', core: 'pearl' })
    expect(rarityOf(luckiest).points).toBe(24)
    expect(rarityOf(luckiest).tier.id).toBe('god')
    // one notch back off that, and it is Void again
    expect(rarityOf({ ...luckiest, core: 'frost' }).tier.id).toBe('void')
  })

  it('tops out on a God-line mutation in every gene at once', () => {
    const best = { shape: 'pixel', pupil: 'hypno', iris: 'prism', core: 'spectrum', body: 'wisp' }
    expect(rarityOf(best).points).toBe(maxRarityPoints())
  })

  // A God-line mutation is a rendering, not a shape — it carries the whole creature.
  it('makes any Oglet with a God trait a God, whatever else it drew', () => {
    const plain = rarityOf(genome({ shape: 'pixel' }))
    expect(plain.tier.id).toBe('god')
    expect(plain.points).toBeLessThan(RARITY_LADDER[0].min)
  })

  // A ladder tuned to an old ceiling inflates every verdict on the site.
  it('tops out exactly at the God step, and no lower', () => {
    expect(maxRarityPoints()).toBeGreaterThanOrEqual(RARITY_LADDER[0].min)
    expect(RARITY_LADDER[0].min).toBeGreaterThan(RARITY_LADDER[1].min)
  })

  it('names the single most unusual trait', () => {
    const { rarest } = rarityOf(genome({ core: 'pearl' }))
    expect(rarest.allele.id).toBe('pearl')
  })

  it('has a ladder whose steps only ever rise, with a floor at zero', () => {
    const mins = RARITY_LADDER.map((s) => s.min)
    expect([...mins].sort((a, b) => b - a)).toEqual(mins)
    expect(mins.at(-1)).toBe(0)
  })

  it('never scores an Oglet above the ceiling it prints', () => {
    for (let i = 0; i < 2000; i++) {
      expect(rarityOf(genomeOf(newId())).points).toBeLessThanOrEqual(maxRarityPoints())
    }
  })

  it('splits each band evenly between the mutations in it', () => {
    for (const cat of CATS) {
      if (TIER_QUOTA.sparse.includes(cat)) continue // its empty bands fall to the default instead
      for (const tier of TIERS) {
        const band = GENES[cat].filter((a) => a.tier === tier.id)
        const share = band.reduce((sum, a) => sum + a.w, 0)
        expect(share, `${cat} · ${tier.name}`).toBeCloseTo(tier.spawn, 10)
      }
    }
  })

  it('reads every trait weight straight off the gene table', () => {
    for (const t of traitsOf(genome())) {
      expect(t.weight).toBe(GENES[t.cat].find((a) => a.id === t.allele.id).w)
      expect(tierIndex(t.tier)).toBeGreaterThanOrEqual(0)
    }
  })
})
