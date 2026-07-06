import type { DialogProps } from 'vaul'
import type { StateCreator } from 'zustand'
import type { THEME } from '../consts'
import {
  getPersistentSettings,
  updatePersistentSetting,
} from '../utils/settings'

export interface UiSlice {
  theme: THEME
  setTheme: (theme: THEME) => void
  settingsOpen: boolean
  setSettingsOpen: (settingsOpen: boolean) => void
  toggleSettingsOpen: () => void
  filtersOpen: boolean
  setFiltersOpen: (filtersOpen: boolean) => void
  toggleFiltersOpen: () => void
  favoritesOpen: boolean
  setFavoritesOpen: (favoritesOpen: boolean) => void
  toggleFavoritesOpen: () => void
  addCustomLinkTypeOpen: boolean | DialogProps['direction']
  setAddCustomLinkTypeOpen: (open: boolean | DialogProps['direction']) => void
  toggleAddCustomLinkTypeOpen: () => void
}

export const createUiSlice: StateCreator<UiSlice, [], [], UiSlice> = (
  set,
  get,
) => {
  const persistentSettings = getPersistentSettings()

  return {
    theme: persistentSettings.theme,
    setTheme: (theme: THEME) => {
      updatePersistentSetting('theme', theme)
      set({ theme })
    },
    // The settings, filter and favorites panels are mutually exclusive:
    // opening any one of them closes the other two.
    settingsOpen: false,
    setSettingsOpen: (settingsOpen: boolean) => {
      set(
        settingsOpen
          ? { settingsOpen, filtersOpen: false, favoritesOpen: false }
          : { settingsOpen },
      )
    },
    toggleSettingsOpen: () => {
      get().setSettingsOpen(!get().settingsOpen)
    },
    filtersOpen: false,
    setFiltersOpen: (filtersOpen: boolean) => {
      set(
        filtersOpen
          ? { filtersOpen, settingsOpen: false, favoritesOpen: false }
          : { filtersOpen },
      )
    },
    toggleFiltersOpen: () => {
      get().setFiltersOpen(!get().filtersOpen)
    },
    favoritesOpen: false,
    setFavoritesOpen: (favoritesOpen: boolean) => {
      set(
        favoritesOpen
          ? { favoritesOpen, settingsOpen: false, filtersOpen: false }
          : { favoritesOpen },
      )
    },
    toggleFavoritesOpen: () => {
      get().setFavoritesOpen(!get().favoritesOpen)
    },
    addCustomLinkTypeOpen: false,
    setAddCustomLinkTypeOpen: (
      addCustomLinkTypeOpen: boolean | DialogProps['direction'],
    ) => {
      set({ addCustomLinkTypeOpen })
    },
    toggleAddCustomLinkTypeOpen: () => {
      set({
        addCustomLinkTypeOpen: !get().addCustomLinkTypeOpen,
      })
    },
  }
}
