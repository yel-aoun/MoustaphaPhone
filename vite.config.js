import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { pathToFileURL } from 'url'

function clientStoreApiPlugin() {
  return {
    name: 'client-store-api-routes',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const route = (req.url || '').split('?')[0].replace(/^\/+/, '').split('/')[0]
        if (!route) return next()

        const file = path.resolve(__dirname, 'api', `${route}.js`)
        if (!fs.existsSync(file)) return next()

        try {
          const moduleUrl = `${pathToFileURL(file).href}?t=${Date.now()}`
          const mod = await import(moduleUrl)
          await mod.default(req, res)
        } catch (error) {
          server.config.logger.error(error)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error.message || 'API route failed' }))
          }
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), clientStoreApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
