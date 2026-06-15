import { marked } from 'marked'

// Vite reads every Markdown file under /articles at build time — no server, no CMS.
// ponytail: guarded so the module also imports under plain Node (glob is Vite-only) for the self-check.
const files = typeof import.meta.glob === 'function'
  ? import.meta.glob('../articles/*.md', { query: '?raw', import: 'default', eager: true })
  : {}

// ponytail: key: value frontmatter only — all our fields are flat. Swap for gray-matter if we ever need nested YAML.
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
  const slug = meta.slug || path.split('/').pop().replace(/\.md$/, '')
  // ponytail: marked output is rendered as-is. Safe because articles are first-party Markdown in this repo, not user input.
  return { ...meta, slug, html: marked.parse(body) }
}

export const articles = Object.entries(files)
  .map(([path, raw]) => parse(raw, path))
  .sort((a, b) => new Date(b.date) - new Date(a.date))

export const getArticle = (slug) => articles.find((a) => a.slug === slug)
