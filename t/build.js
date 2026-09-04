#!/usr/bin/env node
/* Generate t/<id>.html from templates/*.json.
   New exclusive: add templates/<id>.json + assets, then: node t/build.js

   These pages are the share URL. Twitter/Facebook bots do not run JS and
   must see OG tags here — do not meta-refresh to tier.html (bots follow it). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tplDir = path.join(root, 'templates');
const outDir = path.join(root, 't');
const skip = new Set(['catalog.json', 'achievements.json']);

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/</g, '<');
}

function shell(id, title, description) {
  const name = esc(title || id);
  const desc = esc(description || 'The easiest way to rank what you love.');
  const page = `https://rankme.lol/t/${id}.html`;
  const img = `https://rankme.lol/assets/brand/og-${id}.jpg`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name} - RankMe</title>
<link rel="canonical" href="${page}">
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="RankMe">
<meta property="og:url" content="${page}">
<meta property="og:title" content="${name} - RankMe">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${name} - RankMe">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${img}">
<script>
(function () {
  var id = ${JSON.stringify(id)};
  try { sessionStorage.setItem('rankme_t', id); } catch (e) {}
  var p = new URLSearchParams(location.search);
  p.set('t', id);
  location.replace('../tier.html?' + p.toString() + location.hash);
})();
</script>
</head>
<body style="margin:0;background:#0e0c14;color:#a79fc4;font-family:system-ui,sans-serif;text-align:center;padding:48px">
<p>Loading ${name}…</p>
<p><a href="../tier.html?t=${id}" style="color:#e6a9e8">Open on RankMe</a></p>
</body>
</html>
`;
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const catalog = JSON.parse(fs.readFileSync(path.join(tplDir, 'catalog.json'), 'utf8'));
const byId = Object.fromEntries((catalog.templates || []).map((t) => [t.id, t]));

const ids = fs.readdirSync(tplDir)
  .filter((f) => f.endsWith('.json') && !skip.has(f))
  .map((f) => f.slice(0, -5));

for (const id of ids) {
  const data = JSON.parse(fs.readFileSync(path.join(tplDir, id + '.json'), 'utf8'));
  const meta = byId[id] || {};
  fs.writeFileSync(
    path.join(outDir, id + '.html'),
    shell(id, meta.title || data.title || id, meta.description || data.description || '')
  );
}

const keep = new Set(ids.map((id) => id + '.html').concat(['build.js', 'README.md']));
for (const f of fs.readdirSync(outDir)) {
  if (!keep.has(f) && f.endsWith('.html')) fs.unlinkSync(path.join(outDir, f));
}

console.log('wrote t/ (' + ids.length + '): ' + ids.join(', '));
