const env = import.meta.env as unknown as {
  VITE_TELEMETRY_ENABLED?: string
  VITE_TELEMETRY_ENDPOINT?: string
  VITE_APP_VERSION?: string
}

export default {
  backdropBaseUrl: 'https://image.tmdb.org/t/p/w1280',
  posterBaseUrl: 'https://image.tmdb.org/t/p/w300_and_h450_bestv2',
  // TMDB size used for the tiny in-grid poster tiles (w342 comfortably covers
  // the 220x330 texture tile) - https://developer.themoviedb.org/docs/image-basics
  gridPosterBaseUrl: 'https://image.tmdb.org/t/p/w342',
  sourceCodeUrl: 'https://github.com/gnovotny/nothing-to-watch',
  tmdbUrl: 'https://themoviedb.org',
  tmdbFilmBaseUrl: 'https://www.themoviedb.org/movie/',
  imdbFilmBaseUrl: 'https://imdb.com/title/',
  contactEmail: 'hello@swymble.com',
  disableUI: false,
  telemetry: {
    enabled:
      env?.VITE_TELEMETRY_ENABLED === '1' ||
      env?.VITE_TELEMETRY_ENABLED === 'true',
    endpoint: env?.VITE_TELEMETRY_ENDPOINT || undefined,
    appVersion: env?.VITE_APP_VERSION || undefined,
  },
}
