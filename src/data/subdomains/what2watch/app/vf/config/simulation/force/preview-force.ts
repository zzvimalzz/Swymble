export const previewForceSimulationStepConfig = {
  parameters: {
    alpha: 0.15,
    velocityDecay: 0.62,
    velocityDecayBase: 0.62,
    velocityDecayTransitionEnterMode: 0.85,
  },
  forces: {
    manageWeights: true,
    primaryCellWeightPushFactorEnabled: true,
    smoothPrimaryCell: true,
    requestMediaVersions: {
      enabled: true,
      // effectively unlimited: every cell near the pointer keeps targeting
      // the dynamic single-poster version (v3) instead of being demoted to
      // the baked atlas versions, so filtered/dynamic tiles stay correct
      v3ColLevelAdjacencyThreshold: 10000,
      v3RowLevelAdjacencyThreshold: 10000,
      v3SpeedLimit: 10000,
    },
    breathing: {
      enabled: true,
    },
    push: {
      strength: 0.1,
      yFactor: 2.5,
      alignmentMaxLevelsX: 40,
      centerXStretchMod: 0.4,
      speedFactor: 1,
    },
    lattice: {
      strength: 0.8,
      yFactor: 3.75,
      xFactor: 1,
      maxLevelsFromPrimary: 30,
    },
    origin: {
      strength: 0.8,
      yFactor: 1.5,
    },
  },
}
