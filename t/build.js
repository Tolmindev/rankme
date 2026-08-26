#!/usr/bin/env node
/* Generate t/<id>.html from templates/*.json.
   New exclusive: add templates/<id>.json + assets, then: node t/build.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tplDir = path.join(root, 'templates');
const outDir = path.join(root, 't');
const skip = new Set(['catalog.json', 'achievements.json']);

function shell(id, title) {
  const safeTitle = String(title || id).replace(/</g, '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle} - RankMe</title>
<link rel="canonical" href="../tier.html?t=${id}">
<meta http-equiv="refresh" content="0;url=../tier.html?t=${id}">
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
<p>Loading ${safeTitle}…</p>
<p><a href="../tier.html?t=${id}" style="color:#e6a9e8">Open tier list</a></p>
</body>
</html>
`;
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const ids = fs.readdirSync(tplDir)
  .filter((f) => f.endsWith('.json') && !skip.has(f))
  .map((f) => f.slice(0, -5));

for (const id of ids) {
  const data = JSON.parse(fs.readFileSync(path.join(tplDir, id + '.json'), 'utf8'));
  fs.writeFileSync(path.join(outDir, id + '.html'), shell(id, data.title || id));
}

const keep = new Set(ids.map((id) => id + '.html').concat(['build.js', 'README.md']));
for (const f of fs.readdirSync(outDir)) {
  if (!keep.has(f) && f.endsWith('.html')) fs.unlinkSync(path.join(outDir, f));
}

console.log('wrote t/ (' + ids.length + '): ' + ids.join(', '));
