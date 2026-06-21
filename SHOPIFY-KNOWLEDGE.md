# Claude's Knowledge Base — ColorMyMath Shopify store (colormymath.com)

> My single reference for the Shopify store. Companion to `claude-knowledge.md` (the getridoftheteacher.com games site).
> Last consolidated: 2026-06-21. (No passwords/tokens here — this file is published publicly.)

---

## 1. Store basics
- **Store:** **colormymath.com** — Shopify theme "Lighten Your Life", **Basic** plan. Owner account: hughesmath.net@gmail.com.
- **~1,278 products total** (~1,124 are date/birthday shirts; the rest are art tees + 2 digital products).
- **Brand = ColorMyMath.** Lead with **birthday / date shirts**. Same dots-as-numbers concept as the games site.
- **Connected via the Shopify MCP** (I edit products/collections/tags through it with GraphQL `tagsAdd`, `collectionUpdate`, etc.). A custom-app **Admin API token route is a dead end** (the Dev Dashboard "automation token" doesn't authenticate the Admin API) — use the MCP connection.
- **What I CANNOT change via API → the user does these by hand in Shopify admin:** the store name, the legal/policy pages, and the **homepage title + meta description** (Online Store → Preferences).

## 2. The date/birthday shirts
- One shirt per **calendar day, Jan 1 – Dec 31**, in several **colors** (Pink, Blue, Red, Green, Purple, SkyBlue, Orange, Yellow, Brown — varies by date).
- Title pattern example: `"May 1st Pink T-Shirt at 5:01 501 0501"`. The **handle starts with padded MMDD** (e.g. `0501-…`), so MMDD is the reliable way to read a shirt's date.

## 3. SEO status
- **✅ Collection SEO — DONE (2026-06-20):** all **~30 collections** have custom `seo {title, description}` (12 months + Deep Blue, Pink, Gifts, Kids & Babies, Toys, Tech, word-art, etc.).
- **✅ Date-variation SEARCH TAGS — DONE (2026-06-21):** **every date shirt (~1,124) tagged** so the on-site search finds it no matter how a date is typed. ~11 formats per shirt:
  `Month D` · `D Month` · `ordth Month` · `Abbr D` · `Abbr ord` · `M/D` · `MM/DD` · `M-D` · `MM-DD` · `M.D` · `date:MMDD`.
  Plus **holiday tags** where they fit: Christmas (12/25), Christmas Eve (12/24), New Year + New Year's Day (1/1), New Year's Eve (12/31), Halloween (10/31), Valentine's Day (2/14), Veterans Day (11/11), April Fools (4/1), Pi Day + Einstein (3/14), Independence Day (7/4).
  *(Non-date art and the 2 digital products were intentionally skipped.)*
- **⬜ Homepage title/meta — STILL MANUAL** (only the owner can set it, in Online Store → Preferences). Suggested copy:
  - **Title:** `ColorMyMath — Birthday Number Tees & Colorful Math Art Shirts`
  - **Description:** `ColorMyMath turns numbers and dates into vibrant art on premium tees — birthday number shirts, monthly collections, and math-inspired designs. Find your day, your number, your color.`

## 4. Other store facts
- **Discount code `WELCOME10`** is live.
- **Title cleanup** toward the pattern `"{Month} {Day} Birthday Shirt — {Color}"` was started (partial — not all products renamed).
- **About page** added; a collection was renamed.
- **2 digital products live:** *ColorMyMath Premium* (full math-games access) and *Make It Your Colors* (custom design, ~$2; the picker is behind a simple shared login). Note: the custom product has shown **"Sold out" — needs an inventory fix** in Shopify.
- **Traffic is the real problem** (0 sales = not a product problem, a visibility problem). Plan lives at `Documents\Claude\COLORMYMATH-TRAFFIC-PLAN.md`.

## 5. Open threads / next ideas
- **Build the Classroom Number Tee set (1–100) + the place-value Square set** — art is done (`Downloads\shirt-art\out\`), the **products are not built yet**. Recommended: ~$24 each + a volume discount.
- Finish the **title cleanup** across all date shirts.
- Fix the **"Sold out"** custom-product inventory.
- Owner to set the **homepage title/meta** (copy above).

## 6. Related
- The free games site is **getridoftheteacher.com** → see `claude-knowledge.md` (same folder).
