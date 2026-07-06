import config from '../../config'
import { getPersistentSettings } from '../../utils/settings'
import type { VoroforceCell } from '../types'

export type FilmData = Record<string, string | number>
export type FilmType = 'movie' | 'tv'

export type FilmFilters = {
  types: FilmType[]
  genres: string[]
}

export const ALL_FILM_TYPES: FilmType[] = ['movie', 'tv']

export const DEFAULT_FILM_FILTERS: FilmFilters = {
  types: ALL_FILM_TYPES,
  genres: [],
}

export class Film {
  type: FilmType
  uid: string
  cellId?: number
  tmdbId?: number
  tvmazeId?: number
  tvmazeUrl?: string
  imdbId?: string
  title: string
  tagline?: string
  overview?: string
  genres?: string[]
  year: number
  rating: number
  popularity: number
  poster: string
  backdrop: string

  constructor(data: FilmData) {
    this.type = data.type === 'tv' ? 'tv' : 'movie'
    if (this.type === 'tv') {
      this.tvmazeId = Number(data.id)
      this.tvmazeUrl = data.tvmaze_url ? String(data.tvmaze_url) : undefined
      this.uid = `tv-${this.tvmazeId}`
    } else {
      this.tmdbId = Number(data.id)
      this.uid = `movie-${this.tmdbId}`
    }
    this.imdbId = data.imdb_id ? String(data.imdb_id) : undefined
    this.title = String(data.title)
    this.tagline = data.tagline ? String(data.tagline) : undefined
    this.overview = data.overview ? String(data.overview) : undefined
    this.genres = data.genres ? String(data.genres).split(', ') : undefined
    this.year = Number(data.release_year)
    this.rating = Number(data.vote_average) * 10
    this.popularity = Number(data.popularity)
    this.poster = String(data.poster_path)
    this.backdrop = String(data.backdrop_path)
  }
}

let filmPoolPromise: Promise<FilmData[]> | undefined

const fetchJson = async (path: string): Promise<FilmData[]> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_FILM_INFO_BASE_URL ?? '/json'}/${path}`,
    )
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error(`Error loading ${path}:`, error)
    return []
  }
}

const loadFilmPool = (): Promise<FilmData[]> => {
  if (!filmPoolPromise) {
    filmPoolPromise = Promise.all([
      fetchJson('movies.json'),
      fetchJson('shows.json'),
    ]).then(([movies, shows]) => [
      ...movies.map((movie) => ({ ...movie, type: 'movie' as const })),
      ...shows.map((show) => ({ ...show, type: 'tv' as const })),
    ])
  }
  return filmPoolPromise
}

const uniqueGenresCache = new Map<string, string[]>()

export const getAvailableGenres = async (): Promise<string[]> => {
  const cacheKey = 'all'
  const cached = uniqueGenresCache.get(cacheKey)
  if (cached) return cached

  const pool = await loadFilmPool()
  const genres = new Set<string>()
  for (const item of pool) {
    if (!item.genres) continue
    for (const genre of String(item.genres).split(', ')) {
      if (genre) genres.add(genre)
    }
  }
  const sorted = Array.from(genres).sort()
  uniqueGenresCache.set(cacheKey, sorted)
  return sorted
}

const matchesFilters = (item: FilmData, filters: FilmFilters): boolean => {
  const type: FilmType = item.type === 'tv' ? 'tv' : 'movie'
  if (filters.types.length && !filters.types.includes(type)) return false
  if (filters.genres.length) {
    const itemGenres = item.genres ? String(item.genres).split(', ') : []
    if (!filters.genres.some((genre) => itemGenres.includes(genre)))
      return false
  }
  return true
}

// The engine only ever assigns cell.id in the range [0, 215] (one 18x12
// subgrid's worth - see voroforce/common/lattice/lattice.js), cycling that
// range across however many cells are actually on screen. Only the first
// min(pool.length, 216) entries of a cell pool can therefore ever surface.
export const CELL_ID_CAPACITY = 216

// Deterministic Fisher-Yates shuffle (mulberry32 PRNG with a fixed seed).
// Shuffling the cell pool is what lets TV shows and less-popular movies
// actually appear on the wall: without it, the reachable [0, 215] id range
// maps straight onto the first 216 entries of the pool, which are all
// movies. A fixed seed keeps the wall identical across sessions so the
// dynamically loaded poster tiles always line up with the film mapping.
const seededShuffle = <T>(items: T[], seed = 0x5eed): T[] => {
  let state = seed
  const random = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const cellPoolCache = new Map<string, Promise<FilmData[]>>()

// The ordered pool cell ids index into: filtered by the given filters, then
// deterministically shuffled. Used by both the film-info mapping and the
// dynamic poster-tile loading so a cell's title and poster always agree.
export const getCellPool = (filters?: FilmFilters): Promise<FilmData[]> => {
  const activeFilters = filters ?? DEFAULT_FILM_FILTERS
  const cacheKey = JSON.stringify({
    types: [...activeFilters.types].sort(),
    genres: [...activeFilters.genres].sort(),
  })
  let pool = cellPoolCache.get(cacheKey)
  if (!pool) {
    pool = loadFilmPool().then((items) =>
      seededShuffle(
        items.filter((item) => matchesFilters(item, activeFilters)),
      ),
    )
    cellPoolCache.set(cacheKey, pool)
  }
  return pool
}

export const getCellFilm = async (
  cell: VoroforceCell,
  filters?: FilmFilters,
): Promise<Film | undefined> => {
  if (!cell) return undefined
  const filtered = await getCellPool(filters)
  if (!filtered.length) return undefined
  const data = filtered[cell.id % filtered.length]
  const film = new Film(data)
  film.cellId = cell.id
  return film
}

// Poster image URL for a cell's in-grid tile, resolved against the film the
// cell id currently maps to (under the persisted filters, which are the ones
// active after the filter panel's Apply reload). Movies use the TMDB image
// CDN (see https://developer.themoviedb.org/docs/image-basics), TV shows the
// TVmaze CDN; both serve CORS-enabled images usable as WebGL textures.
export const getCellPosterUrl = async (
  cellId: number,
): Promise<string | undefined> => {
  const filtered = await getCellPool(getPersistentSettings().filters)
  if (!filtered.length) return undefined
  const posterPath = String(filtered[cellId % filtered.length].poster_path)
  if (!posterPath) return undefined
  if (/^https?:\/\//.test(posterPath)) {
    // TVmaze absolute URL - swap the huge original for the grid-sized one
    return posterPath.replace('/original_untouched/', '/medium_portrait/')
  }
  return `${config.gridPosterBaseUrl}${posterPath}`
}

// Live counts for the filter panel: how many titles the given filters match
// (of which only the first CELL_ID_CAPACITY land on the wall).
export const getFilteredTypeCounts = async (
  filters?: FilmFilters,
): Promise<{ total: number; movies: number; shows: number }> => {
  const pool = await loadFilmPool()
  const activeFilters = filters ?? DEFAULT_FILM_FILTERS
  let movies = 0
  let shows = 0
  for (const item of pool) {
    if (!matchesFilters(item, activeFilters)) continue
    if (item.type === 'tv') shows++
    else movies++
  }
  return { total: movies + shows, movies, shows }
}

export type ReachableFilmMatch = {
  cellId: number
  title: string
  year: number
  type: FilmType
}

// Title search over the films actually present on the wall (the reachable
// [0, CELL_ID_CAPACITY) slice of the cell pool), for jump-to-title
// navigation.
export const searchReachableFilms = async (
  query: string,
  filters?: FilmFilters,
  limit = 8,
): Promise<ReachableFilmMatch[]> => {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return []
  const pool = await getCellPool(filters)
  const reachable = pool.slice(0, CELL_ID_CAPACITY)
  const matches: ReachableFilmMatch[] = []
  for (let cellId = 0; cellId < reachable.length; cellId++) {
    const item = reachable[cellId]
    const title = String(item.title)
    if (!title.toLowerCase().includes(trimmed)) continue
    matches.push({
      cellId,
      title,
      year: Number(item.release_year),
      type: item.type === 'tv' ? 'tv' : 'movie',
    })
    if (matches.length >= limit) break
  }
  return matches
}

// Returns a random cell id matching the given filters, for jump-to-random
// navigation. Returns undefined if nothing matches. Cell ids only range
// [0, 215] (see CELL_ID_CAPACITY above), so only matches within that range
// are reachable - anything beyond it is real data but has no cell to land on.
export const getRandomFilteredCellId = async (
  filters?: FilmFilters,
): Promise<number | undefined> => {
  const filtered = await getCellPool(filters)
  if (!filtered.length) return undefined
  const reachableCount = Math.min(filtered.length, CELL_ID_CAPACITY)
  return Math.floor(Math.random() * reachableCount)
}
