// Post-build step: emit a static, meta-rich HTML file per article so crawlers
// (social cards, SMS/iMessage unfurl) get real OG/Twitter tags. Crawlers don't run
// JS, so the SPA's client-rendered <head> is invisible to them — this bakes the tags in.
// Real visitors still load the same SPA shell and hydrate normally.
//
// nginx serves dist/article/<slug>.html for /article/<slug> via `try_files ... $uri.html`.
// ponytail: ~40 lines reusing the existing frontmatter parser beats a prerender framework.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '../src/frontmatter.js'

const SITE = 'https://maxfelker.com'
const DIST = 'dist'
const ARTICLES = 'articles'

const esc = (s = '') => s.replace(/"/g, '&quot;')
const shell = readFileSync(join(DIST, 'index.html'), 'utf8')

let count = 0
for (const file of readdirSync(ARTICLES).filter((f) => f.endsWith('.md'))) {
  const a = parse(readFileSync(join(ARTICLES, file), 'utf8'), file)
  if (!a.title) continue // skip README and other non-articles

  const url = `${SITE}/article/${a.slug}`
  const title = esc(a.title)
  const desc = esc(a.summary)
  const image = a.image ? (a.image.startsWith('http') ? a.image : SITE + a.image) : null

  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title} — Max Felker</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${desc}"/>`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${desc}"/>`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}">`)

  const extra = [
    `<meta property="og:type" content="article" />`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${desc}" />`,
    image && `<meta property="og:image" content="${image}" />`,
    image && `<meta name="twitter:image" content="${image}" />`,
  ].filter(Boolean).join('\n    ')
  html = html.replace('</head>', `    ${extra}\n  </head>`)

  mkdirSync(join(DIST, 'article'), { recursive: true })
  writeFileSync(join(DIST, 'article', `${a.slug}.html`), html)
  count++
}

console.log(`prerendered ${count} article page(s)`)
