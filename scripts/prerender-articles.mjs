// Post-build step: emit a static, meta-rich HTML file per article so crawlers
// (social cards, SMS/iMessage unfurl) get real OG/Twitter tags. Crawlers don't run
// JS, so the SPA's client-rendered <head> is invisible to them — this bakes the tags in.
// Real visitors still load the same SPA shell and hydrate normally.
//
// Also copies each article's co-located images into dist/articles/<slug>/ so they're
// served at the same stable path used in dev.
//
// nginx serves dist/article/<slug>.html for /article/<slug> via `try_files ... $uri.html`.
// ponytail: ~50 lines reusing the existing frontmatter parser beats a prerender framework.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '../src/frontmatter.js'

const SITE = 'https://maxfelker.com'
const DIST = 'dist'
const ARTICLES = 'articles'
const IMAGE = /\.(png|jpe?g|gif|webp|svg)$/i

const esc = (s = '') => s.replace(/"/g, '&quot;')
const shell = readFileSync(join(DIST, 'index.html'), 'utf8')

// Each article is a directory: articles/<slug>/index.md (+ images alongside).
const slugs = readdirSync(ARTICLES).filter((name) => {
  const dir = join(ARTICLES, name)
  try { return statSync(dir).isDirectory() && statSync(join(dir, 'index.md')).isFile() }
  catch { return false }
})

let count = 0
for (const slug of slugs) {
  const dir = join(ARTICLES, slug)
  const a = parse(readFileSync(join(dir, 'index.md'), 'utf8'), join(dir, 'index.md'))
  if (!a.title) continue

  // Copy co-located images to the stable served path.
  const outImages = join(DIST, 'articles', slug)
  for (const file of readdirSync(dir).filter((f) => IMAGE.test(f))) {
    mkdirSync(outImages, { recursive: true })
    copyFileSync(join(dir, file), join(outImages, file))
  }

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
