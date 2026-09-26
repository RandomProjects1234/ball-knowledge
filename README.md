# ⚽ Ball Knowledge

Football quiz game: play solo or online with friends (PeerJS, no server needed).

**Play:** https://randomprojects1234.github.io/ball-knowledge/

## 26 modes
**Big games:** $20 Draft (1v1 auction: take turns or secret bids, 5-a-side GK/CB/CM/ST/ST, best-rated team wins) · Budget XI · Footle (Wordle for footballers) · Football Grid · Name Them All · Ball Knowledge Gauntlet
**Photo rounds:** Guess the Player (blur) · Zoomed In · Pixel Player
**Careers & clubs:** Career Path · Fill the Gap · Club Connection · Name the Club · Odd One Out
**Guess the player:** Who Am I? · Mystery Initials · Name Scramble · Name the Nation
**Ratings & numbers:** Higher or Lower · Rate the Card · Top Rated · Baby Face · Birth Year
**Trivia:** Trivia Blitz · True or False · Flag Frenzy

Icons (legends) can be turned on or off in the lobby.

## Run locally
```
python -m http.server 3502
```

Player photos come from Wikimedia Commons (via Wikipedia). Run `node tools/fetch-photos.mjs` to refresh them.
Ratings are approximate FC 26-style values. This project is not affiliated with EA Sports or FIFA.
