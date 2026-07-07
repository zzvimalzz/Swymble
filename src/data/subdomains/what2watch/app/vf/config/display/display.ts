import { VOROFORCE_MODE } from '../../consts'
import mainFrag from './main.frag'

export default {
  scene: {
    dev: {
      enabled: false,
    },
    main: {
      fragmentShader: mainFrag,
      uniforms: {
        iForcedMaxNeighborLevel: { value: 0 },
        fPixelSearchRadiusMod: {
          transition: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 2,
            },
          },
        },
        bMediaDistortion: { value: false },
        fMediaBboxScale: { value: 1 },
        // Bright mode has been removed - what2watch is dark-only, so this is
        // a fixed value rather than a per-theme lookup.
        fBaseColor: { value: [0.035, 0.026, 0.008] },
        fBorderRoundnessMod: {
          transition: true,
          modes: {
            default: {
              // value: 1,
              value: 0.75,
            },
            [VOROFORCE_MODE.select]: {
              // value: 3,
              value: 0.75,
            },
          },
        },
        fBorderThicknessMod: {
          transition: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 1,
            },
          },
        },
        fBorderSmoothnessMod: {
          transition: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 0.75,
            },
          },
        },
        fCenterForceBulgeStrength: {
          transition: true,
          targetFactor: 0.0125,
          initial: {
            value: 0.25,
          },
          modes: {
            default: {
              value: 0,
            },
            [VOROFORCE_MODE.preview]: {
              // value: 1.25,
              value: 0.75,
              // value: 0,
            },
            [VOROFORCE_MODE.select]: {
              value: 1.5,
            },
          },
        },
        fCenterForceBulgeRadius: {
          transition: true,
          targetFactor: 0.0125,
          initial: {
            value: 0.25,
          },
          modes: {
            default: {
              value: 0,
            },
            [VOROFORCE_MODE.preview]: {
              value: 0.75,
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 2,
            },
          },
        },
        fWeightOffsetScaleMod: {
          transition: true,
          modes: {
            default: {
              value: 0.25,
              // value: 0,
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 0,
            },
          },
        },
        fWeightOffsetScaleMediaMod: {
          value: 1,
        },
        fUnweightedEffectMod: {
          transition: true,
          initial: {
            value: 0,
          },
          modes: {
            [VOROFORCE_MODE.preview]: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 1,
            },
          },
        },
        fBaseXDistScale: {
          transition: true,
          modes: {
            default: {
              value: 1.5, // 0 = undefined, will use fallback
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 1.5,
            },
          },
        },
        fWeightedXDistScale: {
          transition: true,
          modes: {
            default: {
              value: 1.5, // 0 = undefined, will use fallback
            },
            [VOROFORCE_MODE.select]: {
              // value: 1,
              value: 1.5,
            },
          },
        },
        fRippleMod: {
          transition: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 0,
            },
          },
        },
        fNoiseOctaveMod: {
          transition: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 0,
            },
          },
        },
        fNoiseCenterOffsetMod: {
          transition: true,
          modes: {
            default: {
              value: 1,
            },
            [VOROFORCE_MODE.select]: {
              value: 0,
            },
          },
        },
      },
    },
    post: {
      enabled: false,
      fragmentShader: undefined,
      uniforms: {},
    },
  },
}
