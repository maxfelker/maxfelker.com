import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const IMAGE_MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
}

// Serve images co-located in articles/<slug>/ at /articles/<slug>/<file> during dev.
// In prod, scripts/prerender-articles.mjs copies them into dist/articles/.
function articleImagesDev() {
  return {
    name: 'article-images-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url.split('?')[0]
        const ext = path.extname(url).toLowerCase()
        if (!url.startsWith('/articles/') || !IMAGE_MIME[ext]) return next()
        const file = path.join(process.cwd(), decodeURIComponent(url))
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next()
        res.setHeader('Content-Type', IMAGE_MIME[ext])
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), articleImagesDev()],
  server: {
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    port: 5173
  }
})
