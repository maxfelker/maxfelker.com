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
  const slug = meta.slug || path.split('/').pop().replace(/\.md$/, '')
  // ponytail: marked output is rendered as-is. Safe because articles are first-party Markdown in this repo, not user input.
  return { ...meta, slug, html: marked.parse(body) }
}
