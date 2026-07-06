// One-off / re-runnable script: fetch fresh popular + now-playing movies from
// TMDB and APPEND them to public/json/movies.json.
//
// Usage:
//   TMDB_API_KEY=your_v3_key node scripts/fetch-tmdb-movies.mjs
//
// The key is a v3 TMDB API key (https://www.themoviedb.org/settings/api).
// It is only read here at build/data-refresh time - never bundled into the
// client, since this script writes a static JSON file consumed at runtime.
//
// IMPORTANT: this appends rather than replaces. The first 216 entries in
// movies.json correspond 1:1 (by array index) to the baked poster atlas at
// public/media/{high,mid,low}/*/0.dds and public/media/single/0-215.jpg -
// the only cells in the grid with a real pre-rendered thumbnail. Reordering
// or replacing those entries would desync the visible tile from its data.
// New movies fetched here only get correct data in the info popup/favorites,
// not a matching baked grid thumbnail (see README "What's different").

const API_KEY = process.env.TMDB_API_KEY
if (!API_KEY) {
  console.error(
    'Missing TMDB_API_KEY env var. Get a free key at https://www.themoviedb.org/settings/api',
  )
  process.exit(1)
}

const OUT_PATH = new URL('../public/json/movies.json', import.meta.url)
const FETCH_COUNT = 200 // new movies to add on top of the existing 216
const PAGES_PER_LIST = 6 // 20 movies per page

const BASE = 'https://api.themoviedb.org/3'

const fetchPages = async (endpoint, pages) => {
  const results = []
  for (let page = 1; page <= pages; page++) {
    const res = await fetch(
      `${BASE}${endpoint}?api_key=${API_KEY}&language=en-US&page=${page}`,
    )
    if (!res.ok) break
    const json = await res.json()
    if (!json.results?.length) break
    results.push(...json.results)
  }
  return results
}

const fetchDetails = async (id) => {
  const res = await fetch(
    `${BASE}/movie/${id}?api_key=${API_KEY}&language=en-US`,
  )
  if (!res.ok) return null
  return res.json()
}

const fs = await import('node:fs')
const existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf-8'))
const existingIds = new Set(existing.map((m) => Number(m.id)))
console.log(`${existing.length} existing movies (kept as-is, unreordered)`)

console.log('Fetching now-playing + popular movies from TMDB...')
const [nowPlaying, popular] = await Promise.all([
  fetchPages('/movie/now_playing', PAGES_PER_LIST),
  fetchPages('/movie/popular', PAGES_PER_LIST),
])

const byId = new Map()
for (const movie of [...nowPlaying, ...popular]) {
  if (!byId.has(movie.id) && !existingIds.has(movie.id)) {
    byId.set(movie.id, movie)
  }
}

const candidates = Array.from(byId.values())
  .filter((m) => m.poster_path && m.backdrop_path && m.vote_count > 50)
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, FETCH_COUNT)

console.log(`Fetching full details for ${candidates.length} movies...`)
const detailed = []
for (const movie of candidates) {
  const details = await fetchDetails(movie.id)
  if (details) detailed.push(details)
  await new Promise((r) => setTimeout(r, 50))
}

const newMovies = detailed.map((m) => ({
  id: m.id,
  title: m.title,
  vote_average: String(m.vote_average ?? 0),
  vote_count: m.vote_count ?? 0,
  backdrop_path: m.backdrop_path ?? '',
  imdb_id: m.imdb_id ?? undefined,
  overview: m.overview ?? '',
  popularity: String(m.popularity ?? 0),
  poster_path: m.poster_path ?? '',
  tagline: m.tagline || undefined,
  genres: (m.genres ?? []).map((g) => g.name).join(', '),
  production_countries: (m.production_countries ?? [])
    .map((c) => c.name)
    .join(', '),
  keywords: '',
  release_year: m.release_date ? m.release_date.slice(0, 4) : '',
}))

const movies = [...existing, ...newMovies]
fs.writeFileSync(OUT_PATH, JSON.stringify(movies))
console.log(
  `Wrote ${movies.length} movies total (${existing.length} original + ${newMovies.length} new) to ${OUT_PATH.pathname}`,
)
