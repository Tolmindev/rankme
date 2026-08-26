# RankMe editor modules

Source of truth for the tier editor. `js/app.js` is **generated**.

| File | Role |
|------|------|
| `_core.js` | Template, state, hash, expert preset |
| `_render.js` | Board, labels, pool, filters, portals |
| `_drag.js` | Pointer drag / drop |
| `_ui.js` | Row settings, size, confirm, share, download |
| `_persist.js` | Remix, save, drafts |
| `_export.js` | PNG export |
| `_leave.js` | Unsaved leave guard |
| `_boot.js` | Init, community, blank uploads |
| `_battle-cta.js` | Battle Mode button (own IIFE) |

After editing any `_*.js`:

```
node js/build-app.js
```

Do not paste patches into `js/app.js`.
