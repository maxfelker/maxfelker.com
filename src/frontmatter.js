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

  // Images live next to index.md, so authors reference them by bare filename.
  // Resolve those to the stable served path; leave absolute paths and full URLs alone.
  const resolve = (src) => (/^(https?:|\/)/.test(src) ? src : `/articles/${slug}/${src}`)
  if (meta.image) meta.image = resolve(meta.image)

  // ponytail: marked output is rendered as-is. Safe because articles are first-party Markdown in this repo, not user input.
  const html = marked.parse(body).replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/g, (_, a, src, b) => a + resolve(src) + b)

  return { ...meta, slug, html }
}

// articles/<slug>/index.md -> <slug>; legacy articles/<slug>.md -> <slug>
function slugFromPath(path) {
  const parts = path.split('/')
  const file = parts.pop()
  return file === 'index.md' ? parts.pop() : file.replace(/\.md$/, '')
}
