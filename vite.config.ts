import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const INTERNAL_PATH_PREFIXES = ['/@vite', '/@fs/', '/@id/', '/src/', '/node_modules/', '/subdomains/']
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

  if (labels.length > 2 && hostname.endsWith('.swymble.com')) {
    return labels[0]
  }

  return null
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

    fs.cpSync(
      path.join(SUBDOMAINS_SOURCE_ROOT, entry.name),
      path.join(distSubdomainsRoot, entry.name),
      { recursive: true },
    )
  }
}

function createStaticSubdomainPlugin(): Plugin {
  let command: 'build' | 'serve' = 'serve'

  const rewriteRequest = (request: { headers: { host?: string | undefined }; url?: string | undefined }) => {
    const subdomain = resolveSubdomainFromHost(request.headers.host)
    const requestUrl = request.url ?? '/'

    if (!subdomain || INTERNAL_PATH_PREFIXES.some((prefix) => requestUrl.startsWith(prefix))) {
      return
    }

    const subdomainIndexPath = path.join(SUBDOMAINS_SOURCE_ROOT, subdomain, 'index.html')

    if (!fs.existsSync(subdomainIndexPath)) {
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

    if (!resolvedFilePath || !fs.existsSync(resolvedFilePath) || !fs.statSync(resolvedFilePath).isFile()) {
      return false
    }

    const contentType = CONTENT_TYPES[path.extname(resolvedFilePath).toLowerCase()] ?? 'application/octet-stream'
    response.statusCode = 200
    response.setHeader('Content-Type', contentType)
    response.end(fs.readFileSync(resolvedFilePath))
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
        rewriteRequest(request)
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
  plugins: [react(), createStaticSubdomainPlugin()],
  base: '/',
  server: {
    allowedHosts: ['.localhost'],
  },
})
