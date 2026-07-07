import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import ErrorBoundary from './cmps/common/error-boundary'
import { NotFound } from './cmps/views/not-found/not-found'
import config from './config'
import { animateDocTitleSuffix } from './utils/anim'
import { initTelemetry } from './utils/telemetry/init-telemetry'
import { initVoroforce } from './vf'
import { Voroforce } from './voroforce'
import './styles.css'

initTelemetry()

// what2watch has no client-side routes - the wall is the whole app, always
// served at the root of the subdomain (or of /subdomains/what2watch when hit
// directly on the main GitHub Pages host). Anything else is a broken link.
const KNOWN_PATHS = ['/', '/subdomains/what2watch']
const normalizedPath =
  window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '') ||
  '/'
const isKnownPath = KNOWN_PATHS.includes(normalizedPath)

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search)
  const disableUIOverrideParam = urlParams.get('disableUI')
  if (!isKnownPath) {
    // biome-ignore lint/style/noNonNullAssertion: exists
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <NotFound />
      </StrictMode>,
    )
  } else if (!config.disableUI && !disableUIOverrideParam) {
    // biome-ignore lint/style/noNonNullAssertion: exists
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
          <Voroforce />
        </ErrorBoundary>
      </StrictMode>,
    )
  } else {
    // headless/disableUI mode never mounts <Intro>, which is what normally
    // tears down the static boot loader in index.html
    document.getElementById('boot-loader')?.remove()
    void initVoroforce({ force: true })
  }
  animateDocTitleSuffix()
})
