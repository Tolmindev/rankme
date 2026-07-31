# RankMe templates

Each exclusive tier list is one JSON file.

## Add a new exclusive

1. Put images in `assets/your-game/`
2. Copy `sf-duel-ex.json` → `your-game.json`
3. Fill: id, title, description, cover, cardPath, cardShape (`portrait`|`square`), cards[], optional factions/theme/experts
4. Add card to `catalog.json`
5. Link from index: `tier.html?t=your-game`

Open: `/tier.html?t=your-game`

Old URLs (`sf-duel.html` etc.) redirect automatically.
