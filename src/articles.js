import { parse } from './frontmatter'

// Vite reads every Markdown file under /articles at build time — no server, no CMS.
// import.meta.glob is a compile-time macro: it MUST be called unconditionally (no runtime guard).
const files = import.meta.glob('../articles/*.md', { query: '?raw', import: 'default', eager: true })

export const articles = Object.entries(files)
  .map(([path, raw]) => parse(raw, path))
  .filter((a) => a.title) // ponytail: skip non-article files like README.md (no frontmatter)
  .sort((a, b) => new Date(b.date) - new Date(a.date))

export const getArticle = (slug) => articles.find((a) => a.slug === slug)
