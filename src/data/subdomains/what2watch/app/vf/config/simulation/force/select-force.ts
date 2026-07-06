export const selectForceSimulationStepConfig = {
  parameters: {
    alpha: 0.15,
    velocityDecay: 0.72,
    velocityDecayBase: 0.72,
    velocityDecayTransitionEnterMode: 0.75,
  },
  forces: {
    manageWeights: true,
    primaryCellWeightPushFactorEnabled: false,
    smoothPrimaryCell: false,
    requestMediaVersions: {
      enabled: true,
      handleMediaSpeedLimits: false,
      // effectively unlimited (see preview-force.ts): all cells stay on the
      // dynamic single-poster version
      v3ColLevelAdjacencyThreshold: 10000,
      v3RowLevelAdjacencyThreshold: 10000,
      v2ColLevelAdjacencyThreshold: 18,
      v2RowLevelAdjacencyThreshold: 18,
    },
    breathing: {
      enabled: false,
    },
    push: {
      strength: 0.05,
      selector: 'focused',
      yFactor: 1.5,
    },
    lattice: {
      strength: 1,
      yFactor: 1.5,
      xFactor: 1,
      maxLevelsFromPrimary: 50,
    },
    origin: {
      strength: 0.1,
      latticeScale: 3,
    },
  },
}
