// One-off / re-runnable script: fetch the TVmaze bulk show index and
// (re)write public/json/shows.json in the shape films.ts expects.
//
// Usage:
//   node scripts/fetch-tvmaze-shows.mjs
//
// TVmaze's index API is free and keyless (https://api.tvmaze.com/shows).
// Unlike movies.json, shows.json has no baked poster atlas to stay in sync
// with, so this script safely replaces the whole file on each run.

const OUT_PATH = new URL('../public/json/shows.json', import.meta.url)
const TARGET_COUNT = 216
const MAX_PAGES = 15 // ~250 shows per page

const all = []
for (let page = 0; page < MAX_PAGES; page++) {
  const res = await fetch(`https://api.tvmaze.com/shows?page=${page}`)
  if (!res.ok) break
  const batch = await res.json()
  if (!batch.length) break
  all.push(...batch)
  await new Promise((r) => setTimeout(r, 200)) // be polite
}

console.log(`Fetched ${all.length} shows total`)

const withPoster = all.filter(
  (s) => s.image?.original && s.rating?.average && s.genres?.length,
)

withPoster.sort((a, b) => {
  const scoreA = a.rating.average * Math.log10((a.weight ?? 1) + 1)
  const scoreB = b.rating.average * Math.log10((b.weight ?? 1) + 1)
  return scoreB - scoreA
})

const top = withPoster.slice(0, TARGET_COUNT)

const stripHtml = (html) => (html ? html.replace(/<[^>]+>/g, '').trim() : '')

// Normalize genre naming to match TMDB's style used in movies.json
// (TVmaze uses "Science-Fiction", TMDB uses "Science Fiction").
const normalizeGenre = (genre) => genre.replace(/Science-Fiction/g, 'Science Fiction')

const shows = top.map((s) => ({
  id: s.id,
  title: s.name,
  vote_average: s.rating?.average ? String(s.rating.average) : '0',
  vote_count: s.weight ?? 0,
  backdrop_path: s.image?.original ?? s.image?.medium ?? '',
  imdb_id: s.externals?.imdb ?? undefined,
  overview: stripHtml(s.summary),
  popularity: String(s.weight ?? 0),
  poster_path: s.image?.original ?? s.image?.medium ?? '',
  tagline: s.network?.name
    ? `${s.type} on ${s.network.name}`
    : s.webChannel?.name
      ? `${s.type} on ${s.webChannel.name}`
      : s.type,
  genres: (s.genres ?? []).map(normalizeGenre).join(', '),
  production_countries:
    s.network?.country?.name ?? s.webChannel?.country?.name ?? '',
  keywords: '',
  release_year: s.premiered ? s.premiered.slice(0, 4) : '',
  tvmaze_url: s.url,
}))

const fs = await import('node:fs')
fs.writeFileSync(OUT_PATH, JSON.stringify(shows))
console.log(`Wrote ${shows.length} shows to ${OUT_PATH.pathname}`)
