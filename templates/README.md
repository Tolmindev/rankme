# RankMe templates

Adding a new exclusive tier list should take minutes, not hours.

## Quick add

1. **Images** → `assets/<id>/` (webp preferred, consistent size)
2. **JSON** → copy `sf-duel-ex.json` to `templates/<id>.json`
3. **Catalog** → one object in `templates/catalog.json`
4. Deploy. Open: `tier.html?t=<id>`

No new HTML page required. `boot.js` loads `templates/<id>.json` automatically.

## catalog.json fields

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | URL slug, same as JSON filename |
| `title` | yes | Card + page title |
| `description` | yes | Short, one sentence preferred |
| `cover` | yes | Path e.g. `assets/brand/My_Cover.webp` |
| `href` | yes | `tier.html?t=<id>` |
| `category` | yes | `games` / `anime` / `movies` / … |
| `tags` | yes | Array of strings for search |
| `itemCount` | yes | Number shown on card |
| `itemLabel` | yes | e.g. `fighters`, `champions` |
| `featured` | no | Sort boost on home |
| `exclusive` | no | Exclusive badge + RGB border |
| `parallax` | no | Cover parallax (desktop only) |

## Template JSON fields

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Same as catalog |
| `title` | yes | |
| `description` | yes | |
| `cover` | yes | |
| `cardPath` | yes | Folder with card images, trailing `/` |
| `cardShape` | yes | `portrait` or `square` |
| `cards` | yes | `[{id, file, name, faction?}, …]` |
| `footerLabel` | no | Export footer text |
| `exportName` | no | Default PNG filename |
| `parallax` | no | |
| `noFactions` | no | Hide faction filters |
| `factions` / `theme` | no | Optional filters |

Expert rankings live in Community (public lists flagged `is_expert`), not inside the template page.

## Checklist before ship

- [ ] Cover ~1200×630 (or same ratio as others)
- [ ] All `cards[].file` exist under `cardPath`
- [ ] `itemCount` matches `cards.length`
- [ ] Search finds title / tags on home
- [ ] Battle Mode opens from card
- [ ] Export PNG looks correct

## Do not

- Create per-game HTML (use `tier.html?t=`)
- Put huge PNGs in repo without compress
- Hardcode card lists in `app.js`

## Achievements

Logic lives in `js/achievements.js` (`RankMeAch`). Cards render in `js/holo-card.js` (`RankMeHolo`). **Do not add achievement code to `app.js`.**

### Quick add

1. Art → `assets/achievements/<file>.webp`
2. One object in `templates/achievements.json`
3. If the unlock already exists (`login`, `first-publish`) — done
4. New trigger → add `unlock` string, a `RankMeAch.onX` method, one call at the event

```json
{
  "id": "slug",
  "title": "Title",
  "desc": "One line.",
  "img": "assets/achievements/achiev_3.webp",
  "unlock": "first-publish"
}
```

Known `unlock` values: `login`, `first-publish`. Persist is `user_metadata.ach` + `localStorage` (survives delete/unpublish). Toast is Discord-style, bottom of the account page.
