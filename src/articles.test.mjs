// Run: node src/articles.test.mjs
import assert from 'node:assert'
import { parse } from './articles.js'

const a = parse('---\ntitle: Hello World\ndate: 2024-02-15\n---\n# Body\n\nText.', 'x/my-slug.md')
assert.equal(a.title, 'Hello World')
assert.equal(a.date, '2024-02-15')
assert.equal(a.slug, 'my-slug')            // falls back to filename
assert.ok(a.html.includes('<h1>Body</h1>')) // markdown body rendered

const b = parse('No frontmatter here', 'x/plain.md')
assert.equal(b.slug, 'plain')
assert.ok(b.html.includes('No frontmatter here'))

console.log('articles parse: OK')
