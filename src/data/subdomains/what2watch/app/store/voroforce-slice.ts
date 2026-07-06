import { UAParser } from 'ua-parser-js'
import type { StateCreator } from 'zustand'

import { down, matchMediaQuery } from '../utils/mq'
import {
  getPersistentSettings,
  updatePersistentSetting,
} from '../utils/settings'
import type {
  ConfigUniforms,
  PerformanceMonitorApi,
  UserConfig,
  VoroforceInstance,
} from '../vf'
import {
  CELL_LIMIT,
  DEFAULT_VOROFORCE_MODE,
  DEVICE_CLASS,
  VOROFORCE_MODE,
  VOROFORCE_PRESET,
} from '../vf/consts'

export interface VoroforceSlice {
  ua: UAParser
  container?: HTMLElement
  setContainer: (container: HTMLElement) => void
  voroforce?: VoroforceInstance
  setVoroforce: (instance: VoroforceInstance) => void
  config?: VoroforceInstance['config']
  setConfig: (instance: VoroforceInstance['config']) => void
  voroforceMediaPreloaded: boolean
  setVoroforceMediaPreloaded: (preloaded: boolean) => void
  mode: VOROFORCE_MODE
  setMode: (mode: VOROFORCE_MODE) => void
  exitSelectMode: () => void
  voroforceDevSceneEnabled: boolean
  setVoroforceDevSceneEnabled: (enabled: boolean) => void
  playedIntro: boolean
  setPlayedIntro: (playedIntro: boolean) => void
  enteredApp: boolean
  setEnteredApp: (enteredApp: boolean) => void
  preset?: VOROFORCE_PRESET
  setPreset: (preset: VOROFORCE_PRESET) => void
  cellLimit?: CELL_LIMIT
  setCellLimit: (cellLimit: CELL_LIMIT) => void
  deviceClass?: DEVICE_CLASS
  setDeviceClass: (deviceClass: DEVICE_CLASS) => void
  estimatedDeviceClass?: DEVICE_CLASS
  setEstimatedDeviceClass: (deviceClass: DEVICE_CLASS) => void
  userConfig: UserConfig
  setUserConfig: (userConfig: UserConfig) => void
  configUniforms: {
    main: ConfigUniforms
    post: ConfigUniforms
    transitioning: ConfigUniforms
  }
  performanceMonitor?: PerformanceMonitorApi
  setPerformanceMonitor: (performanceMonitor: PerformanceMonitorApi) => void
}

export const REENTER_SESSION_KEY = 'w2w-reenter'

// One-shot: set right before an internal reload (see CoreSettingsWidget) so
// the app re-enters directly instead of showing the Enter landing again.
const consumeReenterFlag = () => {
  try {
    if (sessionStorage.getItem(REENTER_SESSION_KEY)) {
      sessionStorage.removeItem(REENTER_SESSION_KEY)
      return true
    }
  } catch {}
  return false
}

export const createEngineSlice: StateCreator<
  VoroforceSlice,
  [],
  [],
  VoroforceSlice
> = (set, get) => {
  const persistentSettings = getPersistentSettings()
  const initialMode = persistentSettings.playedIntro
    ? DEFAULT_VOROFORCE_MODE
    : VOROFORCE_MODE.intro

  // Sensible defaults so first-time visitors skip the old preset/film-count
  // picker entirely: Minimal (Mobile on small screens) with 1,000 films.
  // Both remain adjustable later via the Settings panel.
  const defaultPreset = matchMediaQuery(down('md')).matches
    ? VOROFORCE_PRESET.mobile
    : VOROFORCE_PRESET.minimal

  return {
    ua: new UAParser(),
    setContainer: (container: HTMLElement) => set({ container }),
    setVoroforce: (instance: VoroforceInstance) => set({ voroforce: instance }),
    setConfig: (config: VoroforceInstance['config']) => set({ config }),
    voroforceMediaPreloaded: false,
    setVoroforceMediaPreloaded: (voroforceMediaPreloaded: boolean) => {
      set({ voroforceMediaPreloaded })
    },
    mode: initialMode,
    setMode: (mode: VOROFORCE_MODE) => set({ mode }),
    exitSelectMode: () => {
      // Use deselect() rather than deselectAndPin(): pinning here immediately
      // re-arms freezePointer() on the very next pointermove (pinnedIsFocused()
      // is true right after pinning at the just-closed cell), which silently
      // stops hover-follow until a click unfreezes it. Plain deselect() keeps
      // the pointer live so hovering keeps working right away.
      get().voroforce?.controls?.deselect()
    },
    voroforceDevSceneEnabled: false,
    setVoroforceDevSceneEnabled: (voroforceDevSceneEnabled: boolean) => {
      const voroforce = get().voroforce
      if (voroforce) {
        voroforce.config.display.scene.dev.enabled = voroforceDevSceneEnabled

        if (voroforceDevSceneEnabled) {
          voroforce.display.scene.initDev()
        } else {
          voroforce.display.scene.stopDev()
        }
      }

      set({ voroforceDevSceneEnabled })
    },
    playedIntro: persistentSettings.playedIntro,
    setPlayedIntro: (playedIntro: boolean) => {
      updatePersistentSetting('playedIntro', playedIntro)
      set({ playedIntro })
    },
    // Whether the visitor clicked Enter on the landing overlay this session.
    // Not persisted - the landing always waits for an explicit click - EXCEPT
    // for internal reloads (preset/film-count changes), which set a one-shot
    // session flag so the user lands straight back in the app behind the
    // loading animation instead of the Enter screen.
    enteredApp: consumeReenterFlag(),
    setEnteredApp: (enteredApp: boolean) => set({ enteredApp }),
    preset: persistentSettings.preset ?? defaultPreset,
    setPreset: (preset: VOROFORCE_PRESET) => {
      updatePersistentSetting('preset', preset)
      set({ preset })
    },
    cellLimit: persistentSettings.cellLimit ?? CELL_LIMIT.xxxs,
    setCellLimit: (cellLimit: CELL_LIMIT) => {
      updatePersistentSetting('cellLimit', cellLimit)
      set({ cellLimit })
    },
    deviceClass: persistentSettings.deviceClass ?? DEVICE_CLASS.low,
    setDeviceClass: (deviceClass: DEVICE_CLASS) => {
      updatePersistentSetting('deviceClass', deviceClass)
      set({ deviceClass })
    },
    estimatedDeviceClass: DEVICE_CLASS.low,
    setEstimatedDeviceClass: (estimatedDeviceClass: DEVICE_CLASS) => {
      set({ estimatedDeviceClass })
    },
    userConfig: persistentSettings.userConfig,
    setUserConfig: (userConfig: UserConfig) => {
      updatePersistentSetting('userConfig', userConfig)
      set({ userConfig })
    },
    configUniforms: {
      main: {} as ConfigUniforms,
      post: {} as ConfigUniforms,
      transitioning: {} as ConfigUniforms,
    },
    setPerformanceMonitor: (performanceMonitor) => {
      set({ performanceMonitor })
    },
  }
}
