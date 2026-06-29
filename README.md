# Office Signage

All office screen pages live in this one repo. Edit a page, push once, every screen updates.

## URLs for Yodeck

Once GitHub Pages is enabled, add these as **web page** widgets in Yodeck:

- **Rotating deck** (cycles through everything, with fade): `https://<account>.github.io/office-signage/`
- **A single page**: `https://<account>.github.io/office-signage/slides/<file-name>.html`

## How it's built

All slides share one look (the Recart logo, clock, animated background, fonts and
colors). That shared styling lives in `shared/` so you never copy it by hand:

- `shared/theme.css` — colors, fonts, layout tokens
- `shared/chrome.js` — logo, live clock, animated background (every slide loads this)
- `shared/hero.css`, `shared/board.css`, `shared/attendance.css`, `shared/map.css` — the template styles
- `shared/board.js` — renders the events / birthdays lists on board slides
- `shared/attendance.js` — draws the live attendance tree on attendance slides
- `shared/map.js` — draws the USA map + pins on map slides (needs D3 + topojson, loaded from a CDN in the slide head)
- `shared/popups.js` — cross-fades the three image slots on popups slides

A slide file only contains its **content**. There are five templates to start from:

| Template | Use it for | Style file | Extra script |
|----------|-----------|-----------|--------------|
| **hero** | one big message + an emoji (welcome, announcements) | `hero.css` | — |
| **board** | a list of upcoming events + birthdays | `board.css` | `board.js` |
| **attendance** | a single live metric from a Google Sheet, shown as a tree that grows/colors with the score | `attendance.css` | `attendance.js` |
| **map** | locations on a USA map (clients, offices) with a cycling highlight | `map.css` | `map.js` |
| **popups** | a gallery of screenshots/images on a cross-fading loop (three at a time) | `popups.css` | `popups.js` |

## How to add a new slide

1. Copy a starter template from `templates/` into `slides/`:
   - `templates/hero.html` → e.g. `slides/announcement.html`
   - `templates/board.html` → e.g. `slides/this-week.html`
   - `templates/attendance.html` → e.g. `slides/office-attendance.html`
   - `templates/map.html` → e.g. `slides/clients-map.html`
   - `templates/popups.html` → e.g. `slides/live-popups.html`
2. Edit only the parts marked with `<!-- EDIT -->`:
   - **hero**: the headline (wrap one word in `<span class="highlight">` for blue) and the emoji.
   - **board**: the `EVENTS` and `BIRTHDAYS` arrays in the script block. Each event needs
     an `icon`, a `date` (the text shown), a `label`, an optional `time`, and a `dateObj`
     (`new Date('YYYY-MM-DD')` — drives the countdown and auto-hides past events).
   - **attendance**: the `ATTENDANCE` object — `sheetId` plus the two tab `gid`s. The sheet
     must be shared "anyone with the link". `dataGid` tab needs `date`, `headcount`,
     `checkins` columns; `configGid` tab needs `month`, `working_days`. Data refreshes
     itself every few minutes — no redeploy needed once the sheet is wired up.
   - **map**: the `CLIENTS` array and the `.map-title` headline. Each entry needs a `name`,
     `city`, `lat`, `lon` (which place the pin on the US map automatically), and a `color`.
     The list highlights one entry at a time, cycling every few seconds.
   - **popups**: the `POPUPS` array and the `.popups-title` headline. Each entry needs a `src`
     (image path) and an `alt`. Put the image files in `assets/<folder>/` and reference them as
     `../assets/<folder>/<file>.png`. Three show at once and cross-fade through the list.
3. Add it to `slides.json` so the rotating deck picks it up:
   ```json
   [
     { "file": "slides/announcement.html", "seconds": 15 }
   ]
   ```
   `seconds` = how long it stays on screen before fading to the next.
4. Save, commit, and push. Screens update automatically.

## How to edit an existing slide

Open the file in `slides/`, change the content (or the `EVENTS`/`BIRTHDAYS` data on a
board slide), save, commit, push.

## How to remove a slide

Delete its line from `slides.json` (and optionally delete the file).

## Tip

Just ask Claude: *"change the lunch menu to X"* or *"add a new slide for the summer party"* — it edits the right files for you.

## For AI assistants working on this repo

Read this before making changes so each session stays consistent.

**Template-first rule.** When asked for a new slide, **reuse an existing template** (`hero`, `board`, or `attendance`).
- Map the request to the closest existing template and use it.
- If neither fits cleanly, **offer the existing templates first** and explain how they'd cover the request. Only create a **new** template if the user explicitly asks for a different design (the `attendance` template is an example: a genuinely new, data-driven layout the user asked for).
- New templates follow the same split: a content-only file in `slides/`, a `shared/<name>.css` for its visuals, and (if it needs logic) a `shared/<name>.js`. Always reuse `theme.css` + `chrome.js` for the shared chrome — never re-implement the logo/clock/background per slide.
- Per-slide config goes in the slide as a global the shared script reads (like `EVENTS`/`BIRTHDAYS` for board, `ATTENDANCE` for attendance) — keep the logic in `shared/`, the values in the slide.
- **Brand block is shared and identical everywhere.** Every slide's logo + label is the same `.brand` unit, defined once in `theme.css`:
  ```html
  <div class="brand">
    <div class="logo-wrap"></div>
    <div class="top-label">Budapest office</div>
  </div>
  ```
  Place it at the top-left of the slide's outer container (which must be padded `5vh 4.5vw`, like `.left` and `.tree-top`) and the branding lands in the exact same spot with the same spacing on every slide — so it doesn't jump as the rotating deck crossfades. New templates must use this block verbatim and must never restyle `.brand` / `.logo-wrap` / `.top-label`.

**Conventions that must hold (don't regress these):**
- The slide backdrop is one shared token, `--slide-bg` in `theme.css` (top-left blue glow over a diagonal base gradient). Every slide's outer container (`.screen`, `.tree-screen`) uses `background: var(--slide-bg)` so the look is identical as the deck rotates — don't set a per-slide background. The animated `bgCanvas` is kept **transparent** (it only draws the drifting dots + lines on top); if you make it paint a solid fill again it will cover the glow.
- `shared/theme.css` `.bg-canvas` needs explicit `width: 100%; height: 100%` — a `<canvas>` is a replaced element, so `inset: 0` alone renders it at the default 300×150 in the corner.
- Row reveal/stagger animation lives in **CSS** (`board.css`), driven by a `--i` index that `board.js` sets inline. Keep markup-building in JS free of inline `animation:` strings, and don't reintroduce `!important` on `.event-row.next` (it clobbers the reveal and the row disappears).
- `shared/theme.css` keeps the logo from shifting the label below it (e.g. "Budapest office"): the wrap needs `min-height` matching the SVG height clamp (so the empty wrap reserves space before `chrome.js` injects the logo), and `.logo-wrap svg` needs `display: block` (an inline SVG adds baseline descender space, making the wrap a few px taller once the logo lands). Both are required — the wrap must measure the same height empty and filled, or the label nudges on every iframe reload.
- The clock/date is one shared element: `<div class="clock" id="clock-el"></div>`, styled and positioned top-right in `theme.css` (`.clock` is `position: absolute`), filled by `chrome.js` with the long format ("18:34 · Monday 22 June 2026"). It must be a **direct child of the slide's outer container** (`.screen` / `.tree-screen`, which must be `position: relative`), never nested inside `.left`/`.right`/`.tree-top` (those are `position: relative`, so the clock would anchor to them and drift). Don't re-implement a per-slide clock.
- Slides are content-only. Editable spots are marked with `<!-- EDIT -->`. Keep styling in `shared/`.

**Verify visually.** After CSS/JS changes, serve locally (`python3 -m http.server` from the repo root) and screenshot the affected slides at 1920×1080 before reporting done — `slides/welcome.html` (hero), `slides/events.html` (board), `slides/office-attendance.html` (attendance, give it a few seconds to fetch the sheet and grow the tree).
