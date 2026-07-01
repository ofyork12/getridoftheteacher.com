# The Notes — ColorMyMath / getridoftheteacher.com

The shared brain for this website. Everything true about the site is written here once, in plain English, so that everyone and every helper — the website's own AI, and Claude on the computer — works from the exact same facts. Edit this one file on the computer, push, and the website shows the latest. The website copy and the computer copy are always the same file.

---

## What the site is

ColorMyMath is a set of colorful, gentle math games and lessons for young children (roughly preschool through early grade school). The teaching idea: **every number has its own color, and a number is shown as that many colored dots.** Kids build number sense by seeing quantities, not just symbols.

The site lives at **getridoftheteacher.com**. There is also a separate store at **colormymath.com** (Shopify) that sells number and date shirts.

---

## The core rules (never break these)

- **Every number 1–9 has a fixed color** (1 red … 9 cyan); a number is drawn as that many colored dots.
- **Digits themselves are ALWAYS black or white — never colored.** Only the dots get color.
- **Counting lessons count backwards too**, not only up — there is always a down/back mode.
- **Publishing = push to GitHub.** Cloudflare rebuilds the live site automatically. Edits on the computer are invisible on the phone until pushed.
- Testing happens on the **live site on a phone**, so changes must be pushed before they can be checked.

---

## The games & lessons (what each one teaches)

Grouped roughly easiest → hardest.

**First steps**
- **Start Here** (`start-here.html`) — the recommended order to learn everything, the ColorMyMath way.
- **Numbers 1 to 10** (`number-practice.html`) — meeting the numbers 1–10 and how many each is.
- **Counting to 10** (`counting-to-10.html`) — counting 1–10 in color; counts backward too.
- **Roll to 5** (`count-to-5-dots.html`) — a fun marble game: pick 1–5 balls, roll them, watch them total up.
- **Bigger / Smaller** (`bigger-smaller.html`) — compare two groups; click the one with more.
- **Make It Your Colors** (`my-colors.html`) — pick your own color for each number, used across all the games (paid feature).

**Counting & adding**
- **Counting to 20** (`count-to-20.html`) — counting past ten to 20 with a second ten-frame.
- **Five and Under** (`math-five.html`) — the numbers up to 5 and adding within 5.
- **Easy Addition** (`easy-addition.html`) — gentle first adding: adding 1, doubles, make-10 buddies, adding 2/3/4.
- **Addition (1 to 5)** (`addition.html`) — add one dot at a time up to 5.
- **Subtraction** (`subtraction.html`) — start at 5 and take one away at a time down to 0.

**Ten and its facts**
- **Ten and Under** (`math-ten.html`) — numbers and facts to 10; each lesson has a game, a video, and a play-along.
- **Doubles** (`goal2.html`) — a number plus itself: 1+1, 2+2, 3+3, 4+4, 5+5.
- **Making 10** (`making-10.html`) — find every pair of number buddies that add up to 10.
- **Make 10 — Two Numbers** (`making-10-pairs.html`) — a game: pick the two numbers that make 10.
- **Every Way to Make 10** (`partitions-of-10.html`) — all the ways to split 10 into two parts.
- **Subtraction from 10** (`subtraction-from-10.html`) — start at 10, take away down to 0.

**Puzzles, time & bigger numbers**
- **Clocks** (`clocks.html`) — telling time, the ColorMyMath way.
- **Color My Sudoku** (`sudoku.html`) — sudoku where each number is that many colored dots.
- **Logic Puzzles** (`math-puzzles.html`) — logic games with the colored-dot numbers.
- **Squares & Cubes** (`multiplication-3d.html`) — a number as a flat square or a cube you can spin.
- **Squares** (`squares-2d.html`) — square numbers as dots (1, 4, 9, 16, 25 …).
- **3D Cubes** (`multiplication-cube-2.html`) — a number cubed as a spinning cube, e.g. 4×4×4 = 64.

**Other sections**
- **Find a Game** (`find-a-game.html`) — the AI helper below.
- **Audio Books** (`audiobooks.html`) — free classic stories read aloud.
- **Language Learning** (`language-learning.html`) — picture-and-word vocabulary in Vietnamese, Chinese, Korean, French.
- **Full Math Games Access** (`premium-games.html`) — every game and level together (Teacher's Edition).
- **Shop** (`shop.html`) — links out to the colormymath.com store.

---

## The AI helpers on the site

Both run on **Cloudflare Workers AI** (a Llama model), through small files in the `functions/` folder. They both use the same on/off switch — one **Workers AI binding** named `AI` set once in the Cloudflare dashboard.

- **Find a Game** (`find-a-game.html` → `functions/api/find-game.js`) — a parent describes what their child is learning; the AI recommends the best-fitting games from the list above, easiest first, and only ever links to real pages.
- **Ask the Notes** (`the-notes.html` → `functions/api/ask-notes.js`) — answers questions using only what's written in this file. This is how the website AI reads the shared brain.

---

## The clocks (in detail)

There are **four clocks**, plus a hub page (`clocks.html`) that lists them. Every clock shows time the ColorMyMath way — as quantities and colors, not just digits.

- **About Time Clock** (`about-time-clock/`) — **the main, blessed one.** Time falls as colored pieces and tumbles with real physics: the hour is a number-group picture on the left, the tens-of-minutes are colored "ten" triangles in the middle, and the ones are colored dots in their ColorMyMath shapes on the right. Tap to re-drop the time, tilt to tumble, press & hold for speed and freeze. It installs as an app (PWA) on a phone or computer.
  - It has a **design-picker page** (`compare.html`) that shows **5 different layouts** side by side. **Design #1, "Landscape Classic," is the chosen, live one — we're keeping it and not changing anything.** (`clocklab.html` is just the helper page those little previews are pulled from.)
- **ColorMyMath Clock** (`colormymath-clock/`) — an earlier version. Shows the time as ColorMyMath number-groups that fall and bounce on a light background. Tap to drop, shake, or tilt.
- **Annie's Clock** (`annies-clock/`) and **Quantitative / Analog Clock** (`colormymath-quantitative-clock/`) — two analog clock faces (white face) with a **🎨 color button**: tap a number and pick its color, or reset the colors.

Only the About Time Clock has a design-picker page; the other three are single pages — just the clock itself, no notes hidden inside them.

---

## Folder breadcrumbs (this is the master)

**This file is the master — the shared brain.** Every content folder in the site has a small breadcrumb note (`_NOTES.md`, or a pointer added to an existing `README.md`) that says "the master notes live at `the-notes.md` / `/the-notes.html` — go there." So whoever lands in any folder is sent back here. When something changes in a folder, update THIS file so everyone stays in sync.

---

## How the site is built & published

- Hosted on **Cloudflare Pages**, own domain + SSL.
- Source folder on the computer: `C:\Users\ColorMyMath\getridoftheteacher.com` (mirrored to `Documents\Claude\Projects\ColorMy Math`).
- Publish by pushing to the GitHub repo; Cloudflare deploys automatically.

---

## To-do / ideas

- (Anything to remember about the site goes here. Add freely — both the website AI and Claude will read it.)
