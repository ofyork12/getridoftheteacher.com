# Color My Sudoku

A modern, mobile-first rebuild of the old **Color My Sudoku** Android app
(the 2013 OpenSudoku-based Eclipse project). The original toolchain is dead, so
this is a clean rebuild as a **single web app that installs as a real app on
both Android and iPhone** (a PWA).

The signature ColorMyMath twist is here: **every number is shown as that many
colored dots** — 1 = red, 2 = orange, 3 = yellow, 4 = green, 5 = blue,
6 = purple, 7 = brown, 8 = pink, 9 = cyan — on both the board and the keyboard.

## Features
- Puzzle generator with a guaranteed **unique solution** — Easy / Medium / Hard
- **Colored dots** representation (ColorMyMath) or plain **Numbers** — toggle in Settings
- Pencil **notes**, **undo**, **hint**, **erase**
- Highlight wrong values, row/column/box peers, and matching numbers
- Remaining-count badges on each number; completed numbers dim out
- **Timer**, automatic **save/resume** (your game and settings are remembered)
- Works **offline** and installs to the home screen (icon = the 9 colored dots)

## Files
```
index.html              the whole game (HTML + CSS + JS, no build step)
manifest.webmanifest    PWA metadata (name, icons, colors)
sw.js                   service worker — offline caching
serve.js                tiny local Node server for testing
icons/                  home-screen / install icons (PNG)
img/                    dot1-9, num1-9, dotc, numc  (the dot & number art)
```

## Run it locally
```
node serve.js
```
then open http://localhost:8129

(Or just double-click `index.html` — but the install/offline features only work
when it's served over http, e.g. the command above or any web host.)

## Put it online (so you can play it on your phone)
Upload this whole folder to any static web host (GitHub Pages, Netlify, your
ColorMyMath site, etc.). On the phone:
- **iPhone (Safari):** Share → *Add to Home Screen*
- **Android (Chrome):** menu → *Install app* / *Add to Home screen*

It then opens full-screen like a normal app, works offline, and uses the dot icon.

> Updating later: when you change `index.html` or the art, bump `CACHE = 'cms-v2'`
> in `sw.js` to `cms-v3` (etc.). Otherwise phones keep showing the cached old
> version. (Same idea as the cache-buster you use on the game pages.)

## Turning it into real App Store / Play Store apps (optional, later)
The web app above already runs on both phones. If you want actual store listings,
wrap this same folder with **Capacitor** — no rewrite needed:

1. Install Node, then:
   ```
   npm create @capacitor/app
   ```
   and copy this folder's contents into the project's `www/` (web) directory.
2. `npx cap add android` and `npx cap add ios`
3. Open in **Android Studio** (`npx cap open android`) and **Xcode**
   (`npx cap open ios`, needs a Mac) to build the installable apps.

Requirements for publishing:
- **Google Play:** one-time **$25** developer account.
- **Apple App Store:** **$99/year** developer account **and a Mac** (Xcode).

If/when you want to go that route, I can set up the Capacitor project for you.

---
Rebuilt from `OpenSudokuModified` (color.my.cz.romario.opensudoku).
Original OpenSudoku credits: Roman Mašek, Vit Hnilica, Martin Sobola, Martin Helff.
