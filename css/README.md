# RankMe CSS modules

| File | Responsibility |
|------|----------------|
| `rankme.css` | Entry only (`@import`). Link this from HTML. |
| `_tokens.css` | `:root`, reset, shared keyframes |
| `_chrome.css` | Header, footer, page shell, generic `.btn` |
| `_hero.css` | Tier hero, experts, Remix/Save row |
| `_tier.css` | Board, cards, toolbar, filters, pool, portals |
| `_battle.css` | Battle mode layout/UI |
| `battle-anim.css` | Card pick animations (link on `battle.html` after rankme) |
| `_home.css` | Home / discover / community |
| `_account.css` | Account, modals, toasts, download |
| `_create.css` | Create blank rank |

**Rules**
- One selector → one block per file context.
- Desktop in the module body; mobile only inside `@media` in the **same** file.
- Do not put overrides at the end of another module.

`battle.html` keeps:
```html
<link rel="stylesheet" href="css/rankme.css">
<link rel="stylesheet" href="css/battle-anim.css">
```
