/// <reference types="vitest/config" />
import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const INTERNAL_PATH_PREFIXES = ['/@vite', '/@fs/', '/@id/', '/src/', '/node_modules/', '/subdomains/', '/models/']
const SUBDOMAINS_SOURCE_ROOT = path.resolve(__dirname, 'src', 'data', 'subdomains')

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function resolveSubdomainFromHost(hostHeader?: string) {
  const hostname = hostHeader?.split(':')[0]?.trim().toLowerCase()

  if (!hostname) {
    return null
  }

  const labels = hostname.split('.').filter(Boolean)

  if (labels.length > 1 && labels[labels.length - 1] === 'localhost') {
    return labels[0]
  }

  // `www` is a canonical-host alias, not a subdomain app — see the matching guard in index.html.
  if (labels.length > 2 && hostname.endsWith('.swymble.com') && labels[0] !== 'www') {
    return labels[0]
  }

  return null
}

/**
 * Injects search-engine ownership-verification meta tags when the corresponding env vars are set,
 * and nothing at all when they are not. Verifying the property in Google Search Console and Bing
 * Webmaster Tools is what lets a sitemap actually be submitted (and indexing be requested) — the
 * single highest-leverage step for a domain that has no inbound links yet.
 *
 * Set GOOGLE_SITE_VERIFICATION / BING_SITE_VERIFICATION in the build environment (GitHub Actions
 * repository variables are enough; these tokens are not secrets, they end up in public HTML).
 */
function createSeoVerificationPlugin(): Plugin {
  const tags: { name: string; content: string }[] = []
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim()
  const bing = process.env.BING_SITE_VERIFICATION?.trim()

  if (google) tags.push({ name: 'google-site-verification', content: google })
  if (bing) tags.push({ name: 'msvalidate.01', content: bing })

  return {
    name: 'swymble-seo-verification',
    transformIndexHtml() {
      return tags.map((tag) => ({
        tag: 'meta',
        attrs: { name: tag.name, content: tag.content },
        injectTo: 'head' as const,
      }))
    },
  }
}

function buildSubdomainRequestPath(subdomain: string, url: string) {
  const parsedUrl = new URL(url, 'http://swymble.local')
  const resolvedPath = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname
  parsedUrl.pathname = `/subdomains/${subdomain}${resolvedPath}`
  return `${parsedUrl.pathname}${parsedUrl.search}`
}

function resolveSubdomainFilePath(requestPathname: string) {
  if (!requestPathname.startsWith('/subdomains/')) {
    return null
  }

  const relativePath = requestPathname.replace(/^\/subdomains\//, '')
  const [subdomain, ...restSegments] = relativePath.split('/').filter(Boolean)

  if (!subdomain) {
    return null
  }

  const subdomainRoot = path.join(SUBDOMAINS_SOURCE_ROOT, subdomain)
  const requestedFile = restSegments.length > 0 ? path.join(...restSegments) : 'index.html'
  const resolvedFilePath = path.resolve(subdomainRoot, requestedFile)

  if (!resolvedFilePath.startsWith(subdomainRoot)) {
    return null
  }

  return resolvedFilePath
}

function resolveSubdomainIndexFallbackPath(requestPathname: string) {
  if (!requestPathname.startsWith('/subdomains/')) {
    return null
  }

  const lastSegment = requestPathname.split('/').filter(Boolean).at(-1) ?? ''

  if (path.extname(lastSegment)) {
    return null
  }

  const relativePath = requestPathname.replace(/^\/subdomains\//, '')
  const [subdomain] = relativePath.split('/').filter(Boolean)

  if (!subdomain) {
    return null
  }

  const subdomainRoot = path.join(SUBDOMAINS_SOURCE_ROOT, subdomain)
  const indexPath = path.resolve(subdomainRoot, 'index.html')

  if (!indexPath.startsWith(subdomainRoot)) {
    return null
  }

  return indexPath
}

function isSubdomainAppSource(subdomainRoot: string) {
  return fs.existsSync(path.join(subdomainRoot, 'package.json'))
}

/**
 * A plain subdomain is copied to dist wholesale, which would otherwise publish its test files
 * alongside the site — they import vitest, they are meaningless to a browser, and they would be
 * crawlable. Source folders named `tests` and any `*.test.js` are left behind; everything else,
 * including the site's own JS modules, ships.
 */
function shouldPublishSubdomainFile(source: string) {
  const name = path.basename(source)
  return name !== 'tests' && !/\.(test|spec)\.[cm]?[jt]sx?$/.test(name)
}

function copySubdomainSitesToDist() {
  if (!fs.existsSync(SUBDOMAINS_SOURCE_ROOT)) {
    return
  }

  const distSubdomainsRoot = path.resolve(__dirname, 'dist', 'subdomains')
  fs.rmSync(distSubdomainsRoot, { recursive: true, force: true })
  fs.mkdirSync(distSubdomainsRoot, { recursive: true })

  for (const entry of fs.readdirSync(SUBDOMAINS_SOURCE_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }

    const subdomainRoot = path.join(SUBDOMAINS_SOURCE_ROOT, entry.name)

    if (isSubdomainAppSource(subdomainRoot)) {
      continue
    }

    fs.cpSync(
      subdomainRoot,
      path.join(distSubdomainsRoot, entry.name),
      { recursive: true, filter: shouldPublishSubdomainFile },
    )
  }
}

function createStaticSubdomainPlugin(): Plugin {
  let command: 'build' | 'serve' = 'serve'

  const rewriteRequest = (
    request: { headers: { host?: string | undefined }; url?: string | undefined },
    options: { allowBuiltSubdomain?: boolean } = {},
  ) => {
    const subdomain = resolveSubdomainFromHost(request.headers.host)
    const requestUrl = request.url ?? '/'

    if (!subdomain || INTERNAL_PATH_PREFIXES.some((prefix) => requestUrl.startsWith(prefix))) {
      return
    }

    const subdomainRoot = path.join(SUBDOMAINS_SOURCE_ROOT, subdomain)
    const subdomainIndexPath = path.join(subdomainRoot, 'index.html')
    const builtSubdomainIndexPath = path.resolve(__dirname, 'dist', 'subdomains', subdomain, 'index.html')

    const canServeSource = fs.existsSync(subdomainIndexPath) && !isSubdomainAppSource(subdomainRoot)
    const canServeBuilt = options.allowBuiltSubdomain && fs.existsSync(builtSubdomainIndexPath)

    if (!canServeSource && !canServeBuilt) {
      return
    }

    request.url = buildSubdomainRequestPath(subdomain, requestUrl)
  }

  const serveStaticSubdomainFile = (
    request: { url?: string | undefined },
    response: { setHeader(name: string, value: string): void; statusCode: number; end(data: string | Buffer): void },
  ) => {
    const requestUrl = request.url ?? '/'
    const pathname = new URL(requestUrl, 'http://swymble.local').pathname
    const resolvedFilePath = resolveSubdomainFilePath(pathname)

    const fallbackFilePath = resolveSubdomainIndexFallbackPath(pathname)
    const filePath =
      resolvedFilePath && fs.existsSync(resolvedFilePath) && fs.statSync(resolvedFilePath).isFile()
        ? resolvedFilePath
        : fallbackFilePath && fs.existsSync(fallbackFilePath) && fs.statSync(fallbackFilePath).isFile()
          ? fallbackFilePath
          : null

    if (!filePath) {
      return false
    }

    const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
    response.statusCode = 200
    response.setHeader('Content-Type', contentType)
    response.end(fs.readFileSync(filePath))
    return true
  }

  return {
    name: 'swymble-static-subdomains',
    configResolved(resolvedConfig) {
      command = resolvedConfig.command
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        rewriteRequest(request)

        if (serveStaticSubdomainFile(request, response)) {
          return
        }

        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        rewriteRequest(request, { allowBuiltSubdomain: true })
        next()
      })
    },
    closeBundle() {
      if (command === 'build') {
        copySubdomainSitesToDist()
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), createStaticSubdomainPlugin(), createSeoVerificationPlugin()],
  base: '/',
  test: {
    // A subdomain app with its own vitest is excluded here and runs its own suite.
    // MyBirth does not have one: its tests live beside its code in
    // src/data/subdomains/mybirth/tests/ and this runner picks them up, so a single
    // `npm test` still covers everything. Adding a second copy of vitest to that
    // nested package for five files would buy nothing.
    exclude: ['**/node_modules/**', '**/dist/**', 'src/data/subdomains/what2watch/**'],
  },
  server: {
    allowedHosts: ['.localhost'],
  },
  build: {
    // No `manualChunks` for three.js any more. It used to be pinned to its own vendor chunk for
    // the lazy TechUniverse scene, but nothing on the desktop site imports three.js since that
    // section was removed, so the rule only produced an empty chunk and a build warning. The
    // package is still a dependency (the mybirth subdomain app uses it) — re-add the split if a
    // three.js scene ever comes back to the main site.
    chunkSizeWarningLimit: 700,
  },
})
