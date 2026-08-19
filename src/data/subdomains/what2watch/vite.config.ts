import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import analyzer from 'vite-bundle-analyzer'
import glsl from 'vite-plugin-glsl'
// import viteBasicSslPlugin from "@vitejs/plugin-basic-ssl";

/**
 * Print the URL this app is actually opened at, not the port it happens to bind.
 *
 * The main dev server proxies what2watch.localhost to this one, which is how the app is reached
 * in dev and the shape it has in production. Vite prints the port it bound, which advertised a
 * second, lesser URL for the same app — same content, no sibling subdomains, nothing like the
 * real thing. Replace that line rather than add to it.
 *
 * The port is pinned with `strictPort` in the root vite.config.ts, and `npm run dev` and
 * `npm run dev:what2watch` both start that server alongside this one, so this is never a dead link.
 */
const MAIN_DEV_PORT = 5173

function printSubdomainUrlPlugin(): Plugin {
  return {
    name: 'what2watch-subdomain-dev-url',
    configureServer(server: ViteDevServer) {
      server.printUrls = () => {
        server.config.logger.info(
          `  \x1b[32m➜\x1b[39m  \x1b[1mLocal\x1b[22m:   \x1b[36mhttp://what2watch.localhost:${MAIN_DEV_PORT}/\x1b[39m`,
        )
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [
      printSubdomainUrlPlugin(),
      react({}),
      tailwindcss(),
      glsl({
        minify: Boolean(env.VITE_COMPRESS_GLSL),
      }),
      ...(env.VITE_ANALYZE_BUNDLE ? [analyzer()] : []),
      // viteBasicSslPlugin()
    ],
    base: './',
    build: {
      outDir: '../../../../dist/subdomains/what2watch',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          app: resolve(__dirname, 'index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './app'),
        '√': resolve(__dirname, './voroforce'),
      },
    },
    server: {
      port: 5175,
      // strictPort, because the main dev server proxies <name>.localhost to this port and finds it
      // by reading it out of this file. Drifting to the next free port would leave that proxy
      // dialling a server that moved — a 502 with no clue why. Fail loudly on a clash instead.
      strictPort: true,
      // Reached through the main dev server at what2watch.localhost:5173 as well as directly here.
      // Pin the HMR socket to this port so live reload always connects here and never to that proxy.
      hmr: { clientPort: 5175 },
      open: false,
      allowedHosts: ['.localhost'],
      headers: {
        'Cross-Origin-Embedder-Policy': 'credentialless', // should be 'require-corp' but 'credentialless' allows for img hotlinking
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
  }
})
