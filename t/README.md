# Template shortcuts

Pretty URLs: `rankme.lol/t/sf-duel.html` → `tier.html?t=sf-duel`.

Add a new exclusive:
1. `templates/<id>.json` + assets
2. `catalog.json` entry
3. `node t/build.js`

Do not put game pages in the repo root. Root `404.html` still maps old `/sf-duel.html` links on GitHub Pages.
