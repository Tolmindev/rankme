# Template shortcuts

Share URLs: `https://rankme.lol/t/sf-duel.html` — crawlers read OG here, browsers JS-redirect to `tier.html?t=sf-duel`.

Do **not** add `meta refresh` — Twitterbot follows it and loses the card image.

Add a new exclusive:
1. `templates/<id>.json` + assets
2. `catalog.json` entry
3. `assets/brand/og-<id>.jpg` (1200×630 JPEG of the cover)
4. `node t/build.js`

Do not put game pages in the repo root. Root `404.html` still maps old `/sf-duel.html` links on GitHub Pages.
