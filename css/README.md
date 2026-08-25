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
| `rankme.css` | Production bundle = concat of `_*.css` (no `@import`) |
| `rankme.modules.css` | Dev-only `@import` loader |

**Rules**
- One selector → one block per file context (desktop in the module body; mobile only inside `@media` in the **same** file).
- Rebuild `rankme.css` after editing any `_*.css`.
- Do not add `!important`. Exception: `[hidden] { display: none !important }` in `_tokens.css` (HTML attribute must beat later `display:flex/grid`).

`battle.html` keeps:
```html
<link rel="stylesheet" href="css/rankme.css">
<link rel="stylesheet" href="css/battle-anim.css">
```
