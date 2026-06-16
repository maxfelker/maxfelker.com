// Run: node src/articles.test.mjs
import assert from 'node:assert'
import { parse } from './frontmatter.js'

// folder-based article: slug from directory, bare image paths resolved
const a = parse(
  '---\ntitle: Hello World\ndate: 2024-02-15\nimage: hero.jpg\n---\n# Body\n\n![cap](fig.png)',
  'articles/my-slug/index.md',
)
assert.equal(a.title, 'Hello World')
assert.equal(a.slug, 'my-slug')                       // from the folder name
assert.equal(a.image, '/articles/my-slug/hero.jpg')   // bare hero resolved
assert.equal(a.ogImage, '/articles/my-slug/hero.jpg') // explicit hero is the preview image
assert.ok(a.html.includes('<h1>Body</h1>'))
assert.ok(a.html.includes('src="/articles/my-slug/fig.png"')) // inline image resolved

// video article with no hero: preview falls back to the YouTube thumbnail, no displayed hero
const v = parse(
  '---\ntitle: Talk\ndate: 2024-05-24\n---\n<iframe src="https://www.youtube.com/embed/bLcykUmZNrQ"></iframe>',
  'articles/talk/index.md',
)
assert.equal(v.image, undefined) // nothing rendered as a hero
assert.equal(v.ogImage, 'https://img.youtube.com/vi/bLcykUmZNrQ/maxresdefault.jpg')

// absolute paths and full URLs are left untouched
const b = parse('---\ntitle: T\nimage: /custom/x.jpg\n---\n![a](https://cdn/y.png)', 'articles/t/index.md')
assert.equal(b.image, '/custom/x.jpg')
assert.ok(b.html.includes('src="https://cdn/y.png"'))

// no frontmatter -> still parses, no title
const c = parse('No frontmatter here', 'articles/plain/index.md')
assert.equal(c.slug, 'plain')
assert.ok(!c.title)

console.log('articles parse: OK')
