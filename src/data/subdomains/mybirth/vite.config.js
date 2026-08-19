import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootModelsDir = path.resolve(__dirname, '../../../../public/models')
const builtModelsDir = path.resolve(__dirname, '../../../../dist/models')

const contentTypes = {
  '.glb': 'model/gltf-binary',
}

function serveSharedModelsPlugin() {
  // try each base dir in order and serve the first hit, so a stale or
  // partial dist/models never shadows files that exist in public/models
  const serveModel = (request, response, next, baseDirs) => {
    const requestUrl = request.url ?? '/'
    const pathname = new URL(requestUrl, 'http://mybirth.local').pathname

    if (!pathname.startsWith('/models/')) {
      next()
      return
    }

    const relativePath = pathname.replace(/^\/models\//, '')
    for (const baseDir of baseDirs) {
      const filePath = path.resolve(baseDir, relativePath)
      if (!filePath.startsWith(baseDir) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) continue

      response.statusCode = 200
      response.setHeader('Content-Type', contentTypes[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream')
      response.end(fs.readFileSync(filePath))
      return
    }
    next()
  }

  return {
    name: 'mybirth-shared-models',
    configureServer(server) {
      server.middlewares.use((request, response, next) => serveModel(request, response, next, [rootModelsDir]))
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        serveModel(request, response, next, [builtModelsDir, rootModelsDir])
      })
    },
  }
}

/**
 * Print the URL this app is actually opened at, not the port it happens to bind.
 *
 * The main dev server proxies mybirth.localhost to this one, which is how the app is reached
 * in dev and the shape it has in production. Vite prints the port it bound, which advertised a
 * second, lesser URL for the same app — same content, no sibling subdomains, nothing like the
 * real thing. Replace that line rather than add to it.
 *
 * The port is pinned with `strictPort` in the root vite.config.ts, and `npm run dev` and
 * `npm run dev:mybirth` both start that server alongside this one, so this is never a dead link.
 */
const MAIN_DEV_PORT = 5173

function printSubdomainUrlPlugin() {
  return {
    name: 'mybirth-subdomain-dev-url',
    configureServer(server) {
      server.printUrls = () => {
        server.config.logger.info(
          `  \x1b[32m➜\x1b[39m  \x1b[1mLocal\x1b[22m:   \x1b[36mhttp://mybirth.localhost:${MAIN_DEV_PORT}/\x1b[39m`,
        )
      }
    },
  }
}

export default defineConfig({
  plugins: [serveSharedModelsPlugin(), printSubdomainUrlPlugin()],
  base: './',
  server: {
    port: 5174,
    // strictPort, because the main dev server proxies <name>.localhost to this port and finds it
    // by reading it out of this file. Drifting to the next free port would leave that proxy
    // dialling a server that moved — a 502 with no clue why. Fail loudly on a clash instead.
    strictPort: true,
    // Reached through the main dev server at mybirth.localhost:5173 as well as directly here.
    // Pin the HMR socket to this port so live reload always connects here and never to that proxy.
    hmr: { clientPort: 5174 },
    open: false,
    allowedHosts: ['.localhost'],
  },
  build: {
    target: 'es2020',
    outDir: '../../../../dist/subdomains/mybirth',
    emptyOutDir: true
  }
})
