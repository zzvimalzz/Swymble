export const reload = () => window.location.reload()
export const isDefined = (x: unknown) => typeof x !== 'undefined' && x !== null

// TMDB media paths are relative and need a base URL prefix; TVmaze (and any
// other external source) already returns absolute URLs.
export const resolveMediaUrl = (baseUrl: string, path?: string) => {
  if (!path) return ''
  return /^https?:\/\//.test(path) ? path : `${baseUrl}${path}`
}
