# ⚽ Ball Knowledge

Football quiz game: play solo or online with friends (PeerJS, no server needed).

**Play:** https://randomprojects1234.github.io/ball-knowledge/

## Modes
- **$20 Draft**: build an XI on a budget, then play a mini league
- **Guess the Player**: a blurred photo slowly sharpens
- **Career Path**: guess the player from their clubs
- **Who Am I?**: clues unlock one by one
- **Higher or Lower**: FC ratings and ages
- **Rate the Card**: guess the FC rating
- **Trivia Blitz**: World Cups, Ballon d'Ors, records, derbies, transfers
- **Football Grid**: find a player who fits both the row and the column
- **Ball Knowledge Gauntlet**: a mix of everything

Icons (legends) can be turned on or off in the lobby.

## Run locally
```
python -m http.server 3502
```

Player photos come from Wikimedia Commons (via Wikipedia). Run `node tools/fetch-photos.mjs` to refresh them.
Ratings are approximate FC 26-style values. This project is not affiliated with EA Sports or FIFA.
