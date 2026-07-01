# The Notes — ColorMyMath / getridoftheteacher.com

Plain-English notes about the site: how it works, what's here, and what we've learned. This is the one place to look. Edit this file on the computer, push, and the website shows the latest — the website copy and the computer copy are always the same file.

---

## How this page works

- The notes live in one file: **`the-notes.md`** in the `getridoftheteacher.com` folder.
- Edit that file on the computer → push to GitHub → Cloudflare updates the live page. Same file, both places.
- The **Ask box** at the top of the page lets the Cloudflare AI answer questions using whatever is written here.

---

## What's on the site

- **Games & lessons** — colorful math activities for young kids: counting, comparing, adding, subtracting, making 10, squares & cubes, clocks, sudoku, and more. Full list on the Games page.
- **Find a Game** (`find-a-game.html`) — an AI helper: a parent describes what their child is learning and it recommends the right game.
- **Audio Books** — free classic stories read aloud.
- **Language Learning** — picture-and-word vocabulary in other languages.
- **Shop** — links out to the ColorMyMath store for number and date shirts.

---

## How the site is built & published

- Hosted on **Cloudflare Pages**, with its own domain and SSL.
- Publishing = **push to GitHub**; Cloudflare rebuilds automatically. Local edits are invisible until pushed.
- The AI features run on **Cloudflare Workers AI** (the Llama model), through small functions in the `functions/` folder.

---

## Good to know

- Every number has its own color, and numbers are shown as that many colored dots. **Digits themselves are always black or white — never a color.**
- Counting lessons count **backwards** too, not just up.
- Testing is done on the **live site on the phone** — so changes have to be pushed first to be seen.

---

## To-do / ideas

- (Add your own notes here — anything you want to remember about the site goes in this list.)
