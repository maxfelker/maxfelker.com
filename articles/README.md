# Articles

Each article is a folder holding its Markdown and its images together. Vite reads them
at build time (`src/articles.js`) — no CMS, no build step beyond `npm run build`.

```
articles/
  your-article-slug/
    index.md
    hero.jpg
    figure.jpg
```

## Add an article

1. Create `articles/<slug>/index.md`. The folder name is the URL slug (`/article/<slug>`).
2. Start with frontmatter, then write the body in Markdown:

```markdown
---
title: Your article title
summary: One or two sentences used in previews and the home page list.
date: 2024-02-15
image: hero.jpg
---

Body goes here in **Markdown**.
```

## Frontmatter fields

| field     | required | notes                                                        |
|-----------|----------|--------------------------------------------------------------|
| `title`   | yes      | Article heading.                                             |
| `summary` | yes      | Short description for listings and link previews.            |
| `date`    | yes      | `YYYY-MM-DD`. Drives ordering — newest first.                |
| `slug`    | no       | URL is `/article/<slug>`. Defaults to the folder name.       |
| `image`   | no       | Hero image. Shown at the top of the article AND used as the link-preview (OG/Twitter) image. |

The article appears in the list and at `/article/<slug>` after a rebuild. That's it.

## Images

Drop image files into the article's own folder, next to `index.md`, and reference them
by **bare filename** — they're resolved to `/articles/<slug>/<file>` automatically:

- **Hero / preview image:** set `image: hero.jpg` in the frontmatter. Use ~1200×630 for
  the best social-card crop.
- **Inline images:** standard Markdown in the body — `![alt text](figure.jpg)`. They scale
  to the column width automatically.

(Absolute paths and full `https://` URLs are left as-is if you'd rather host elsewhere.)
