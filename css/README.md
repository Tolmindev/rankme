# RankMe CSS modules

| File | Responsibility |
|------|----------------|
| `_tokens.css` | `:root`, reset, `[hidden]`, shared keyframes |
| `_chrome.css` | Header, footer, page shell, generic `.btn` |
| `_hero.css` | Tier hero, experts, Remix/Save row |
| `_tier.css` | Board, cards, toolbar, filters, pool, portals |
| `_battle.css` | Battle mode layout/UI |
| `battle-anim.css` | Card pick animations (link on `battle.html` after rankme) |
| `_home.css` | Home / discover / community |
| `_account.css` | Account, modals, toasts, download |
| `_create.css` | Create blank rank |
| `rankme.css` | **AUTO-GENERATED** concat of `_*.css`. Do not edit. |

**Rules**
- One selector → one block per file context (desktop in the module body; mobile only inside `@media` in the **same** file).
- After editing any `_*.css`: `node css/build.js`
- Never paste patches into `rankme.css`. That is how glow / cubes / like animation silently vanished.
- Do not add `!important`. Exception: `[hidden] { display: none !important }` in `_tokens.css` (HTML attribute must beat later `display:flex/grid`).

`battle.html` keeps:
```html
<link rel="stylesheet" href="css/rankme.css">
<link rel="stylesheet" href="css/battle-anim.css">
```

Pick animations live only in `battle-anim.css`. Do not duplicate `.battle-card` / `.chosen` rules in `_battle.css`.
