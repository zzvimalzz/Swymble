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

export default defineConfig({
  plugins: [serveSharedModelsPlugin()],
  base: './',
  server: {
    port: 5174,
    open: false,
    allowedHosts: ['.localhost'],
  },
  build: {
    target: 'es2020',
    outDir: '../../../../dist/subdomains/mybirth',
    emptyOutDir: true
  }
})
