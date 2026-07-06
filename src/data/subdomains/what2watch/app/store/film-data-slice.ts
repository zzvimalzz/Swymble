import type { StateCreator } from 'zustand'
import {
  getPersistentSettings,
  updatePersistentSetting,
} from '../utils/settings'
import { DEFAULT_FILM_FILTERS, type Film, type FilmFilters } from '../vf'

export interface FilmDataSlice {
  film?: Film
  setFilm: (film?: Film) => void
  filters: FilmFilters
  setFilters: (filters: FilmFilters) => void
}

export const createFilmDataSlice: StateCreator<
  FilmDataSlice,
  [],
  [],
  FilmDataSlice
> = (set) => {
  const persistentSettings = getPersistentSettings()

  return {
    setFilm: (film?: Film) => set({ film }),
    filters: persistentSettings.filters ?? DEFAULT_FILM_FILTERS,
    setFilters: (filters: FilmFilters) => {
      updatePersistentSetting('filters', filters)
      set({ filters })
    },
  }
}
