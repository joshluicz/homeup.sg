# HomeUP Site Outage — Post-Mortem (July 2026)

**Site:** https://homeup.sg  
**Status:** Resolved and deployed  
**Prepared for:** Dennis / HomeUP team  

---

## Executive summary

The site appeared "down" even though the server was returning HTTP 200. Several independent bugs stacked on top of each other during rapid deploys. The visible symptoms (blank page, stuck loading screen, broken dropdowns, stats stuck at 0, ugly `?_cb=` redirect URLs) had different root causes that only surfaced once the previous layer was fixed.

**Current status:** Working.

**Cloudflare Rocket Loader:** **Keep it off.** Do not re-enable.

---

## What users saw

| Symptom | What it looked like |
|---|---|
| Infinite loading screen | White splash with HomeUP logo, never dismissed |
| "Static" page | Navbar + WhatsApp visible, main content blank or frozen |
| Stats stuck at 0 | Hero count-up never ran |
| Sell/Buy broken | Dropdowns didn't open |
| `?_cb=1783225644495` URL | Redirect to ugly query param, still broken |
| Application error | "A client-side exception has occurred" |
| Chunk 404s in console | JS files returning 404 / wrong MIME type (`text/plain`) |

---

## Root causes (five stacked bugs)

### 1. Loading screen trapped the page

**Cause:** A full-screen loading splash in the root layout only dismissed via React JavaScript. If any client JS failed, the splash never went away — even though the HTML underneath was fine.

**Impact:** Users saw a permanent white screen on a page that was technically loading (HTTP 200).

---

### 2. Framer Motion SSR hid all content without JS

**Cause:** Framer Motion renders with inline `style="opacity: 0"` during server-side rendering. Without successful JavaScript hydration, the main content stayed invisible while the navbar shell (plain HTML/CSS) still showed.

**Impact:** After removing the loading screen, the page looked "half loaded" — nav visible, content blank.

---

### 3. Cloudflare Rocket Loader broke Next.js scripts

**Cause:** Rocket Loader rewrites and defers `<script>` tags. Next.js relies on precise script load order for its webpack chunks. Rocket Loader caused:

- Chunk requests returning 404 or `text/plain` instead of `application/javascript`
- `ChunkLoadError: Loading chunk failed`
- Radix dropdown menus (Sell/Buy) never initializing
- Hero animations never firing

**Impact:** This was the main reason client JavaScript failed in production. **Turning Rocket Loader off was the correct call.**

---

### 4. Loading screen dismiss crashed React

**Cause:** The loading screen dismiss logic called `el.remove()` on the overlay DOM node. React's loading screen component *also* tried to unmount the same node. The race condition produced:

```
NotFoundError: Failed to execute 'removeChild' on 'Node'
```

Which surfaced as: **"Application error: a client-side exception has occurred"**

**Impact:** This crash killed the entire app *after* chunks started loading again. Fixing issues 1–3 wasn't enough until this was deployed.

---

### 5. Broken chunk recovery made things worse (`?_cb=`)

**Cause:** An earlier "fix" redirected failed loads to `homeup.sg/?_cb=<timestamp>` hoping to bust cache. This **does not work** for script files:

- The HTML reloads with a new query param
- Chunk URLs in the HTML stay the same
- Browser disk cache still serves the old 404 for those chunk URLs
- User ends up on an ugly URL with a static-looking page (no interactivity)
- Clearing browser storage reset the retry counter → redirect loop started again

**Impact:** Users got stuck on broken `?_cb=` URLs even after clearing storage.

---

## How it was fixed

### Fix 1 — Loading screen (safe dismiss, no DOM removal)

- Fade out the splash via opacity/pointer-events only
- Let React unmount the node cleanly
- Inline bootstrap fallback at 6 seconds if React never hydrates
- **Removed all `el.remove()` calls**

**File:** `lib/loading-screen-dismiss.ts`

---

### Fix 2 — Framer Motion SSR visibility

- Set `initial={false}` on motion components so SSR content is visible before JS runs
- Hero stats default to real values (1,000 / 860 / 260) instead of 0

**Files:** `components/sections/Hero.tsx`, `components/ui/motion-primitives.tsx`, `components/sections/Testimonials.tsx`

---

### Fix 3 — Rocket Loader disabled

- Turned off in Cloudflare dashboard (Speed → Settings → Rocket Loader → Off)
- Added `data-cfasync="false"` on critical inline bootstrap scripts as a safeguard

**File:** `app/layout.tsx`

---

### Fix 4 — Proper chunk recovery (script cache bust, not page redirect)

When a Next.js script fails to load (e.g. cached 404 after deploy):

1. Re-inject the same script with `?v=<timestamp>` — actually bypasses browser cache
2. Only reload the page once as a last resort (clean URL, no `_cb`)
3. Strip legacy `?_cb=` from URL automatically
4. Middleware redirects any `/?_cb=*` → `/`

**Files:** `lib/chunk-recovery.ts`, `middleware.ts`

---

### Fix 5 — Stricter HTML caching

- HTML responses set to `no-store` so Cloudflare doesn't serve stale HTML referencing old chunk hashes from a previous deploy
- Static assets (`/_next/static/*`, `/images/*`) still cache for 1 year — only HTML is no-store

**File:** `next.config.mjs`

---

## Compromises and trade-offs

| Change | Trade-off | Severity |
|---|---|---|
| `initial={false}` on Framer Motion | Entrance fade/slide animations only run after hydration, not on first paint | Low — cosmetic |
| HTML `no-store` | Every page visit fetches fresh HTML from origin (JS/CSS/images still cached aggressively) | Low — HTML is small |
| Loading screen min 1.5s | Splash stays briefly even if page is ready faster | Low — intentional branding |
| Inline recovery scripts | ~1KB extra JS on every page load | Negligible |
| Chunk retry with `?v=` | Rare duplicate script fetch on recovery; one console 404 before retry succeeds | Low — edge cases only |
| `?_cb=` middleware redirect | One extra redirect for anyone on old broken URLs | None — cleanup only |
| Stats default to 1,000/860/260 | Shows real numbers before count-up animates; avoids flashing 0 | None — better UX |

**Nothing was compromised on:** SEO structure, security, data integrity, or core functionality.

---

## Can we turn Rocket Loader back on?

**No. Keep it off permanently.**

Rocket Loader is designed for legacy sites with many render-blocking scripts. Next.js already:

- Code-splits automatically
- Loads scripts with correct async/defer semantics
- Uses webpack chunk loading that depends on exact script execution order

Rocket Loader intercepts and rewrites those scripts. That breaks:

- Webpack chunk loading → `ChunkLoadError`
- React hydration
- Radix UI (dropdowns, dialogs)
- Framer Motion animations
- Any client-side feature that depends on JavaScript

The `data-cfasync="false"` attribute only protects the two inline bootstrap scripts we control. It does **not** protect the dozens of Next.js-generated script tags. Rocket Loader would break those again.

**Better alternatives for speed (already in place):**

- Next.js built-in optimization
- Cloudflare CDN for static assets (chunks cache 1 year)
- Image optimization via `next/image`

---

## Deploy timeline

| Phase | What was deployed | User experience |
|---|---|---|
| Initial | Loading screen with no fallback | Permanent white splash if JS fails |
| Fix 1 | Removed loading screen | Blank main content (motion SSR issue) |
| Fix 2 | Motion SSR fix + loading screen restored | Better, but Rocket Loader still breaking JS |
| Fix 3 | Chunk recovery + Rocket Loader guidance | Partial — `_cb` redirect loop |
| Fix 4 | removeChild fix | Crash fixed, but `_cb` loop remained |
| Fix 5 | Script cache-bust recovery + `_cb` redirect strip | **Working** |

Note: One critical fix (removeChild) sat unmerged for a period — that's why crashes persisted even after Rocket Loader was turned off.

---

## If this happens again after a deploy

1. Hard refresh: **Cmd/Ctrl + Shift + R**
2. Or open an incognito/private window
3. Chunk recovery should auto-retry failed scripts — no manual storage clearing needed
4. Verify Cloudflare Rocket Loader is still **Off**
5. Optionally purge Cloudflare cache after major deploys: **Caching → Configuration → Purge Everything**

---

## Files changed (reference)

| File | Purpose |
|---|---|
| `lib/loading-screen-dismiss.ts` | Safe splash dismiss, no DOM removal |
| `lib/chunk-recovery.ts` | Script retry with cache bust |
| `components/ui/LoadingScreen.tsx` | Restored splash with React lifecycle |
| `components/ui/motion-primitives.tsx` | SSR visibility fix |
| `components/sections/Hero.tsx` | Stats defaults + motion fix |
| `app/layout.tsx` | Bootstrap scripts with `data-cfasync="false"` |
| `middleware.ts` | Strip `?_cb=` redirects |
| `next.config.mjs` | HTML no-store cache headers |
| `scripts/disable-cloudflare-rocket-loader.mjs` | API script to disable Rocket Loader |

---

## Bottom line

Four separate bugs stacked during rapid iteration:

1. **Rocket Loader** was the original production killer
2. **removeChild crash** killed the app even after chunks loaded
3. **Broken `_cb` recovery** trapped users on broken URLs
4. **Framer Motion SSR** made content invisible without JS

All are fixed now. **Rocket Loader stays off** — there is no safe way to use it with Next.js.

---

*Report generated July 2026. Site verified working via Chrome DevTools MCP after final deploy.*
