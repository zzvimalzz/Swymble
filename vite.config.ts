/// <reference types="vitest/config" />
import crypto from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
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
 * The dev-server port a subdomain app listens on, read out of its own Vite config.
 *
 * Parsed rather than hardcoded here so the two cannot drift: the nested project owns its port and
 * this server follows it. `clientPort` (the HMR socket) is deliberately not matched — the regex is
 * case-sensitive and needs a word boundary. An app with no explicit port is simply not proxied.
 */
function readSubdomainAppDevPort(subdomain: string) {
  const subdomainRoot = path.join(SUBDOMAINS_SOURCE_ROOT, subdomain)

  for (const fileName of ['vite.config.ts', 'vite.config.js', 'vite.config.mjs']) {
    const configPath = path.join(subdomainRoot, fileName)

    if (!fs.existsSync(configPath)) {
      continue
    }

    const match = /\bport:\s*(\d{4,5})/.exec(fs.readFileSync(configPath, 'utf8'))
    return match ? Number(match[1]) : null
  }

  return null
}

/** Every subdomain that runs a dev server of its own, with the port it listens on. */
function listSubdomainApps() {
  if (!fs.existsSync(SUBDOMAINS_SOURCE_ROOT)) {
    return []
  }

  return fs
    .readdirSync(SUBDOMAINS_SOURCE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isSubdomainAppSource(path.join(SUBDOMAINS_SOURCE_ROOT, entry.name)))
    .map((entry) => ({ name: entry.name, port: readSubdomainAppDevPort(entry.name) }))
    .filter((app): app is { name: string; port: number } => app.port !== null)
}

/**
 * Hand a whole request to a subdomain app's own dev server.
 *
 * A subdomain app is a separate Vite project on a port of its own, so `mybirth.localhost:5173` used
 * to fall through to the main site's SPA fallback and quietly serve the *main* site — the one thing
 * worse than a 404. Proxying makes every subdomain in the repo, plain or app, reachable the way it
 * is in production: by hostname, from one port.
 *
 * **Only HTTP is proxied.** Each app aims its HMR socket straight at its own port
 * (`server.hmr.clientPort` in its config), so live reload never crosses this server and the two
 * Vite websocket endpoints never have to share one upgrade handler.
 */
function proxyToSubdomainApp(
  app: { name: string; port: number },
  request: http.IncomingMessage,
  response: http.ServerResponse,
) {
  const upstreamRequest = http.request(
    {
      // `localhost`, not `127.0.0.1`: Vite binds the loopback interface the OS prefers, and on
      // Windows that is `::1` only — an IPv4 dial is refused and every proxied request 502s.
      host: 'localhost',
      port: app.port,
      method: request.method,
      path: request.url ?? '/',
      headers: request.headers,
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers)
      upstreamResponse.pipe(response)
    },
  )

  upstreamRequest.on('error', () => {
    response.statusCode = 502
    response.setHeader('Content-Type', CONTENT_TYPES['.txt'])
    response.end(
      `${app.name} is not running on port ${app.port}.\n\n` +
        `Start everything with: npm run dev   (or just this app with: npm run dev:${app.name})\n`,
    )
  })

  request.pipe(upstreamRequest)
}

/**
 * Does this subdomain actually own the requested path?
 *
 * INTERNAL_PATH_PREFIXES exists to keep Vite's own machinery (`/@vite`, `/@fs/`, the main
 * site's `/src/`) from being rewritten onto a subdomain. But a plain subdomain is a whole site
 * of its own, and `src/` is the obvious name for its modules — oglets serves
 * `/src/main.js` from its own folder. So an internal-looking path is only refused when the
 * subdomain has no such file; `/@vite/client` never does, and `/src/main.js` under
 * oglets.localhost always does.
 */
function subdomainOwnsPath(subdomain: string, requestUrl: string, allowBuiltSubdomain?: boolean) {
  const pathname = new URL(requestUrl, 'http://swymble.local').pathname
  const roots = [path.join(SUBDOMAINS_SOURCE_ROOT, subdomain)]

  if (allowBuiltSubdomain) {
    roots.push(path.resolve(__dirname, 'dist', 'subdomains', subdomain))
  }

  return roots.some((root) => {
    const resolved = path.resolve(root, `.${pathname}`)
    return resolved.startsWith(root) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()
  })
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

/** Every subdomain folder this server serves directly — i.e. the ones with no build of their own. */
function listPlainSubdomains() {
  if (!fs.existsSync(SUBDOMAINS_SOURCE_ROOT)) {
    return []
  }

  return fs
    .readdirSync(SUBDOMAINS_SOURCE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      const root = path.join(SUBDOMAINS_SOURCE_ROOT, name)
      return !isSubdomainAppSource(root) && fs.existsSync(path.join(root, 'index.html'))
    })
}

/** The stamp a plain subdomain's open tabs poll. Named here so the client and the build agree. */
const BUILD_STAMP_FILE = 'version.txt'

/**
 * A content hash of everything the subdomain just published, written beside it.
 *
 * **It is a hash and not a timestamp or a commit SHA on purpose.** A rebuild that changes nothing
 * has to produce the same stamp, or every deploy of an unrelated part of the site would reload
 * every open Oglets tab for no reason. Hashing the published bytes makes the stamp change when —
 * and only when — the thing the browser is running changes.
 *
 * Paths go into the digest as well as contents, so a rename is a change even when no file's bytes
 * move, and the list is sorted because `readdir` order is not a promise.
 */
function writeBuildStamp(publishedRoot: string) {
  const digest = crypto.createHash('sha256')

  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name)
      return entry.isDirectory() ? walk(full) : [full]
    })

  for (const file of walk(publishedRoot).sort()) {
    digest.update(path.relative(publishedRoot, file).split(path.sep).join('/'))
    digest.update(fs.readFileSync(file))
  }

  fs.writeFileSync(path.join(publishedRoot, BUILD_STAMP_FILE), `${digest.digest('hex').slice(0, 16)}\n`)
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

    const publishedRoot = path.join(distSubdomainsRoot, entry.name)

    fs.cpSync(
      subdomainRoot,
      publishedRoot,
      { recursive: true, filter: shouldPublishSubdomainFile },
    )

    writeBuildStamp(publishedRoot)
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

    if (!subdomain) {
      return
    }

    if (
      INTERNAL_PATH_PREFIXES.some((prefix) => requestUrl.startsWith(prefix)) &&
      !subdomainOwnsPath(subdomain, requestUrl, options.allowBuiltSubdomain)
    ) {
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
      const subdomainApps = listSubdomainApps()

      server.middlewares.use((request, response, next) => {
        const subdomain = resolveSubdomainFromHost(request.headers.host)
        const app = subdomain ? subdomainApps.find((entry) => entry.name === subdomain) : undefined

        if (!app) {
          next()
          return
        }

        proxyToSubdomainApp(app, request, response)
      })

      server.middlewares.use((request, response, next) => {
        rewriteRequest(request)

        if (serveStaticSubdomainFile(request, response)) {
          return
        }

        next()
      })

      // Every subdomain is reachable from this one port by hostname: a plain one is served
      // straight off disk by the middleware above, an app is proxied to its own dev server. Print
      // them all next to Vite's own URLs so the whole site is visible from one place.
      const printUrls = server.printUrls.bind(server)
      server.printUrls = () => {
        printUrls()
        const port = server.config.server.port ?? 5173
        for (const name of [...listPlainSubdomains(), ...subdomainApps.map((app) => app.name)].sort()) {
          server.config.logger.info(`  \x1b[32m➜\x1b[0m  \x1b[1m${name}\x1b[0m:  \x1b[36mhttp://${name}.localhost:${port}/\x1b[0m`)
        }
      }
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
    // Every subdomain is reached as <name>.localhost on THIS port, and the subdomain apps are
    // proxied from here, so the port is part of the contract rather than an implementation
    // detail. Pinned and strict: a clash is an error you can read, not a silently moved site.
    port: 5173,
    strictPort: true,
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
