# Claude's Knowledge Base — getridoftheteacher.com / ColorMyMath

> My single reference for the kids' education site, so I can pick up context anytime.
> Published on the site at `getridoftheteacher.com/claude-knowledge.md`. Last consolidated: 2026-06-21 (from a real file scan of the repo).

---

## 1. Site basics
- **Repo / source:** `C:\Users\ColorMyMath\getridoftheteacher.com\`
- **Hosting:** **GitHub Pages** (repo `getridoftheteacher.com`, GitHub user `ofyork12`).
- **Deploy = commit + push to `origin/main`.** Local edits are invisible until pushed — **the user tests the LIVE site on their phone.** Auto-publish (commit+push) is authorized without asking each time (still confirm risky git ops).
- **Mirror convention:** every change in `getridoftheteacher.com\` is also copied to `Documents\Claude\Projects\ColorMy Math\`.
- **Cache rule:** after editing a `*-game.html` / `*-play.html` embedded via iframe, **bump the `?v=` cache-buster** in the container page, or phones show the cached old version.
- **Audio rule (tested on Android):** play recorded clips via **Web Audio** (`decodeAudioData` + `BufferSource`), NOT `<audio>` data: URIs; resume `audioCtx` on tap.
- **Art:** the user is an art person — **cute concrete/animated characters, NO stick figures / abstract.** I can't generate images; the user downloads them (e.g. Pixabay) and I wire them in.

## 2. The ColorMyMath concept
- Numbers are drawn as **that many colored dots.** Canonical map: **1 red · 2 orange · 3 yellow · 4 green · 5 blue · 6 (…) · 9 cyan** (full 1–9 map in memory `colormymath-number-colors`).
- Dots are **grouped in shapes that mirror the number-line cell** for that quantity (3 → triangle, 6 → triangle of 6, etc.). Shapes for **4/5/7/8/9 are still TBD — ask before guessing.**

## 3. What's on the site (real inventory)

**Landing / hub pages:** `index.html` (home) · `games.html` · `math.html` · `math-five.html` (fives) · `math-ten.html` (tens) · `math-puzzles.html` · `puzzles.html` · `premium-games.html` · `extras.html` · `colormymath/index.html` + `colormymath/gallery.html` · `index-multilang.html`

**Counting & number sense:** `counting-to-10` (game/play) · `count-to-5-dots.html` ("Roll to 5" marble-run, Box2D) · `number-practice.html` · `bigger-smaller.html` · `num7-preview.html`

**Addition:** `addition` · `easy-addition` (⚠️ source card 0024 shows 7+2=8 wrong — the GAME renders correct) · `goal1/2/3` (game/play)

**Subtraction:** `subtraction` · `subtraction-from-10` · `subtraction-short.html`

**Making 10 / partitions:** `making-10` (game/pairs/play) · `partitions-of-10` (game + variants 2–6, play variants, `-follow`) · `partitions-of-5-game.html` (**planck.js / Box2D physics — don't revert the engine**)

**Squares / cubes / multiplication:** `squares.html` · `squares-opposite.html` · `SquaresCubegame.html` · `claudesquaresgame.html` · `multiplication-cube.html` · `squares game2.html` · `squares - game.html`

**Clocks:** `colormymath-clock/` (shows the CURRENT time as falling colored dots — a clock, not a game) · `annies-clock/` · `about-time-clock/`

**Sudoku (numbers as colored dots):** `color-my-sudoku/` (+ `pick-colors.html`) · `i-like-pink-sudoku/` · `pick-your-colors-sudoku/`. (Also a standalone PWA rebuild lives at `Desktop\workspace\ColorMySudoku\`.)

**Audiobooks** (`audiobooks.html` + `_audiobook-template.html`, stream LibriVox audio from archive.org): **Tom Sawyer · Scarlet Pimpernel · Bartleby · Frederick Douglass · Monte Cristo.**

**Language learning** (a whole section): `language-learning.html` + `-fr/-ko/-zh`, game versions `language-learning-game-en-fr/-en-ko/-en-vi/-en-zh` (+ `-fr/-ko/-zh`), `language.html`, `vietnamese.html`.

**Other:** `my-colors.html` · `lesson-generator.html` · `wtv.html` · `v8l.html`

## 4. Known issues / open threads
- **ColorMyMath Fives Game** — a GAME about fives the user wants; NOT built, gameplay undefined → ask what the kid does on screen first. (Separate from the Clock — the user once mixed them up.)
- **Pending game features** on `counting-to-10-game.html` — raise before treating any lesson "done" (see memory `pending_game_features`).
- **Shapes for 4/5/7/8/9** dot groupings — undecided; ask.
- **Parallel near-duplicate lessons:** "Making 10" = `making-10-*`; "42"/partitions = `partitions-of-10-*`. Confirm the exact file before editing.
- **easy-addition** source scan error (Hughes card 0024) — game is correct, the printed card is wrong.

## 5. Related (not this site)
- Shopify store **colormymath.com** → see `SHOPIFY-KNOWLEDGE.md`.
- Counting-shorts video source = `Desktop\TheBasics\ColorMyMath_Web\index.html` (Annie's colors).
- Clock source = `Desktop\TheBasics\ColorMyMathClock_Web\index.html`.
