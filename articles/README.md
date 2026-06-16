# Articles

Each article is one Markdown file in this directory. Vite reads them at build time
(`src/articles.js`) — no CMS, no build step beyond `npm run build`.

## Add an article

1. Create `articles/<slug>.md`.
2. Start with frontmatter, then write the body in Markdown:

```markdown
---
title: Your article title
summary: One or two sentences used in previews and the home page list.
date: 2024-02-15
slug: your-article-slug
---

Body goes here in **Markdown**.
```

## Frontmatter fields

| field     | required | notes                                                        |
|-----------|----------|--------------------------------------------------------------|
| `title`   | yes      | Article heading.                                             |
| `summary` | yes      | Short description for listings and link previews.            |
| `date`    | yes      | `YYYY-MM-DD`. Drives ordering — newest first.                |
| `slug`    | no       | URL is `/article/<slug>`. Defaults to the filename.          |
| `image`   | no       | Hero image. Shown at the top of the article AND used as the link-preview (OG/Twitter) image. |

The article appears in the list and at `/article/<slug>` after a rebuild. That's it.

## Images

Put image files in `public/` — they're served from the site root. The convention is
`public/articles/<slug>/`, referenced with an absolute path:

- **Hero / preview image:** set `image: /articles/<slug>/hero.jpg` in the frontmatter.
  Use ~1200×630 for the best social-card crop.
- **Inline images:** standard Markdown in the body —
  `![alt text](/articles/<slug>/figure.jpg)`. They scale to the column width automatically.
