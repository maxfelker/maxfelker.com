import { marked } from 'marked'

// ponytail: key: value frontmatter only — all our fields are flat. Swap for gray-matter if we ever need nested YAML.
// Lives apart from articles.js so the Node self-check can import it without touching Vite's import.meta.glob.
export function parse(raw, path) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  const meta = {}
  let body = raw
  if (match) {
    for (const line of match[1].split('\n')) {
      const i = line.indexOf(':')
      if (i > -1) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
    body = match[2]
  }

  const slug = meta.slug || slugFromPath(path)

  // Images live next to README.md, so authors reference them by bare filename.
  // Resolve those to the stable served path; leave absolute paths and full URLs alone.
  const resolve = (src) => (/^(https?:|\/)/.test(src) ? src : `/articles/${slug}/${src}`)
  const image = meta.image ? resolve(meta.image) : undefined

  // ponytail: marked output is rendered as-is. Safe because articles are first-party Markdown in this repo, not user input.
  const html = marked.parse(body).replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/g, (_, a, src, b) => a + resolve(src) + b)

  // Link-preview image: explicit hero wins, then a YouTube thumbnail for video articles,
  // then the first inline image in the body (e.g. a GIF used as the de facto hero)
  // so link unfurls (iMessage/SMS) still get a card without extra frontmatter.
  const ogImage = image || youTubeThumbnail(html) || firstImage(html) || undefined

  return { ...meta, slug, image, html, ogImage }
}

// articles/<slug>/README.md -> <slug>; legacy articles/<slug>.md -> <slug>
function slugFromPath(path) {
  const parts = path.split('/')
  const file = parts.pop()
  return file === 'README.md' ? parts.pop() : file.replace(/\.md$/, '')
}

// First <img> src in the rendered body, already resolved to a served path.
function firstImage(html) {
  const m = html.match(/<img\b[^>]*\bsrc="([^"]+)"/)
  return m ? m[1] : null
}

// Pull the 11-char video id out of an embed/watch/share URL and return its hi-res thumbnail.
export function youTubeThumbnail(html) {
  const m = html.match(/(?:youtube\.com\/embed\/|youtu\.be\/|[?&]v=)([\w-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : null
}
