# HomeUP Design System — Claude Code Skill
**Fixed-Fee Property Agents · Singapore**

This skill governs all frontend work on `homeup.sg`. Before writing any component, layout, or style, internalise these tokens and rules. Do not deviate from them without explicit instruction.

---

## 0. Brand Context & Aesthetic Direction

**Who:** Singaporean homeowners (HDB upgraders, condo sellers, landed sellers) aged 30–55. Educated, financially literate, skeptical of salespeople. They want a *consultant*, not an agent.

**What to feel:** Trustworthy, calm, and premium — like a well-designed Singapore fintech or private bank landing page, not a pushy property portal.

**Aesthetic direction: "Warm Editorial Trust"**
- Editorial in structure (generous whitespace, strong typographic hierarchy, magazine-style layout pacing)
- Warm in palette (off-white backgrounds, amber accents, not cold corporate blue/grey)
- Grounded in clarity (pricing is transparent — the design should reflect that directness)
- Distinctly Singaporean but internationally credible

**The one thing users must remember:** *This is the agent that shows you the number upfront.*

---

## 1. Typography Scale

### Typefaces

```
Display / Headings:  "Plus Jakarta Sans"  (Google Fonts — humanist sans-serif, weights 700–800 for headings)
Body / UI:           "Plus Jakarta Sans"  (same family, weights 300–600 for body/UI text)
Mono (data/prices):  "JetBrains Mono"     (for fee amounts, CEA numbers, data tables)
```

Single-typeface system: hierarchy comes entirely from weight and size contrast, not a serif/sans mix. Gives a clean, minimal, Apple-like feel — premium without being old-fashioned.

**Import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Scale (Perfect Fourth ratio — 1.333 — from 16px base)

```css
:root {
  /* Font families */
  --font-display:  'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:     'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono:     'JetBrains Mono', 'Courier New', monospace;

  /* Type scale */
  --text-xs:    0.75rem;   /* 12px — labels, captions, legal */
  --text-sm:    0.875rem;  /* 14px — helper text, meta */
  --text-base:  1rem;      /* 16px — body default */
  --text-md:    1.125rem;  /* 18px — lead paragraph */
  --text-lg:    1.25rem;   /* 20px — card titles */
  --text-xl:    1.5rem;    /* 24px — section subtitles */
  --text-2xl:   2rem;      /* 32px — section headings */
  --text-3xl:   2.625rem;  /* 42px — page headings */
  --text-4xl:   3.5rem;    /* 56px — hero headings */
  --text-5xl:   4.5rem;    /* 72px — max hero (desktop) */

  /* Line heights */
  --leading-tight:   1.1;   /* display headings */
  --leading-snug:    1.25;  /* subheadings */
  --leading-normal:  1.5;   /* body text */
  --leading-relaxed: 1.7;   /* long-form paragraphs */

  /* Letter spacing */
  --tracking-tight:  -0.03em; /* display headings */
  --tracking-normal:  0;
  --tracking-wide:    0.05em;  /* caps labels, eyebrows */
  --tracking-wider:   0.12em; /* all-caps UI labels */

  /* Font weights */
  --weight-light:    300;
  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;
}
```

### Usage rules

| Role | Font | Size token | Weight | Notes |
|---|---|---|---|---|
| Hero heading | Plus Jakarta Sans | `--text-4xl` / `--text-5xl` | 800 | `tracking-tight`, `leading-tight` |
| Section heading | Plus Jakarta Sans | `--text-3xl` | 700 | |
| Card heading | Plus Jakarta Sans | `--text-lg` | 600 | |
| Body paragraph | Plus Jakarta Sans | `--text-base` | 400 | `leading-relaxed` |
| Lead/intro paragraph | Plus Jakarta Sans | `--text-md` | 400 | `leading-relaxed` |
| Eyebrow label | Plus Jakarta Sans | `--text-xs` | 500 | `tracking-wider`, ALL CAPS |
| Price display | JetBrains Mono | `--text-3xl` | 500 | `tracking-tight` |
| Fee amount (small) | JetBrains Mono | `--text-xl` | 400 | |
| Navigation | Plus Jakarta Sans | `--text-sm` | 500 | `tracking-wide` |
| Button text | Plus Jakarta Sans | `--text-sm` | 600 | `tracking-wide` |

---

## 2. Spacing System (8px Base Grid)

All spacing values are multiples of 8. The base unit is `--space-2` = 8px.

```css
:root {
  --space-0:   0;
  --space-px:  1px;
  --space-0-5: 2px;   /* hairlines, dividers */
  --space-1:   4px;   /* micro: icon gaps, tight badges */
  --space-2:   8px;   /* base unit */
  --space-3:   12px;  /* inline element padding */
  --space-4:   16px;  /* component internal padding (small) */
  --space-5:   20px;
  --space-6:   24px;  /* component internal padding (default) */
  --space-8:   32px;  /* section element gap */
  --space-10:  40px;  /* card padding */
  --space-12:  48px;  /* between major components */
  --space-16:  64px;  /* section padding (mobile) */
  --space-20:  80px;  /* section padding (desktop) */
  --space-24:  96px;  /* large section gaps */
  --space-32:  128px; /* hero padding */
  --space-40:  160px; /* max section padding */

  /* Layout */
  --container-max:   1200px;
  --container-wide:  1400px;
  --container-text:  720px;   /* max-width for long-form copy */
  --container-narrow: 560px;  /* CTA sections, forms */
  --gutter:           clamp(var(--space-6), 5vw, var(--space-16));
}
```

### Spacing usage rules

- **Never use arbitrary values.** If you need 28px, use `--space-8` (32px) or `--space-6` (24px).
- **Section vertical rhythm:** `padding-block: clamp(var(--space-16), 8vw, var(--space-32))`
- **Card padding:** `--space-8` (32px) desktop, `--space-6` (24px) mobile
- **Between heading and body text:** always `--space-4` (16px)
- **Between cards in a grid:** `--space-6` (24px) to `--space-8` (32px)
- **CTA button padding:** `--space-4` vertical, `--space-8` horizontal

---

## 3. Color Tokens

The palette is built on HomeUP's brand green (#0e853e) with warm neutrals and a deliberate amber accent. Every color used in the UI must come from these tokens.

```css
:root {

  /* ——————————————————————————
     PRIMARY — Forest Green
     Trust, growth, Singapore (nature)
  —————————————————————————— */
  --color-primary-50:   #f0faf4;
  --color-primary-100:  #d9f2e4;
  --color-primary-200:  #b4e4c9;
  --color-primary-300:  #7dcfa7;
  --color-primary-400:  #45b47e;
  --color-primary-500:  #1e9957;   /* lighter brand variant */
  --color-primary-600:  #0e853e;   /* ← BRAND PRIMARY */
  --color-primary-700:  #0b6b31;
  --color-primary-800:  #085224;
  --color-primary-900:  #053618;
  --color-primary-950:  #031f0e;

  /* ——————————————————————————
     NEUTRAL — Warm Stone
     NOT cold grey. Warm, parchment-tinted.
     Use these for text, borders, backgrounds.
  —————————————————————————— */
  --color-neutral-0:    #ffffff;
  --color-neutral-50:   #faf9f7;   /* page background */
  --color-neutral-100:  #f3f0eb;   /* card/surface background */
  --color-neutral-200:  #e8e3db;   /* subtle borders */
  --color-neutral-300:  #d4ccc0;   /* dividers */
  --color-neutral-400:  #b0a596;   /* placeholder text */
  --color-neutral-500:  #8c7f70;   /* secondary text */
  --color-neutral-600:  #6b5f52;   /* muted body text */
  --color-neutral-700:  #4e4439;   /* secondary headings */
  --color-neutral-800:  #342c23;   /* primary body text */
  --color-neutral-900:  #1e1812;   /* headings */
  --color-neutral-950:  #100e09;   /* max contrast */

  /* ——————————————————————————
     ACCENT — Warm Amber
     Value, savings, "gold standard"
     Use sparingly: price highlights, badges, icons
  —————————————————————————— */
  --color-accent-50:   #fffbeb;
  --color-accent-100:  #fef3c7;
  --color-accent-200:  #fde68a;
  --color-accent-300:  #fcd34d;
  --color-accent-400:  #f5be1e;   /* default accent */
  --color-accent-500:  #e0a008;   /* accent pressed */
  --color-accent-600:  #b47d04;   /* accent dark (text on light) */

  /* ——————————————————————————
     SEMANTIC
  —————————————————————————— */
  --color-success:        var(--color-primary-600);
  --color-success-light:  var(--color-primary-50);
  --color-warning:        #f59e0b;
  --color-warning-light:  #fffbeb;
  --color-error:          #dc2626;
  --color-error-light:    #fef2f2;

  /* ——————————————————————————
     SURFACE ALIASES
     (use these in components — never raw tokens)
  —————————————————————————— */
  --bg-page:          var(--color-neutral-50);
  --bg-surface:       var(--color-neutral-0);
  --bg-raised:        var(--color-neutral-100);
  --bg-subtle:        var(--color-neutral-50);
  --bg-inverse:       var(--color-neutral-900);

  --border-subtle:    var(--color-neutral-200);
  --border-default:   var(--color-neutral-300);
  --border-strong:    var(--color-neutral-400);
  --border-brand:     var(--color-primary-600);

  --text-primary:     var(--color-neutral-900);
  --text-secondary:   var(--color-neutral-600);
  --text-muted:       var(--color-neutral-500);
  --text-on-primary:  var(--color-neutral-0);
  --text-on-dark:     var(--color-neutral-50);
  --text-brand:       var(--color-primary-600);
  --text-accent:      var(--color-accent-600);

  /* ——————————————————————————
     GRADIENTS
  —————————————————————————— */
  --gradient-brand:   linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%);
  --gradient-hero:    linear-gradient(160deg, var(--color-neutral-50) 0%, var(--color-primary-50) 100%);
  --gradient-card:    linear-gradient(180deg, transparent 50%, rgba(14,133,62,0.06) 100%);
  --gradient-dark:    linear-gradient(160deg, var(--color-neutral-900) 0%, var(--color-neutral-950) 100%);
}
```

### Color usage rules

- **Never** put primary green on primary green. Use `--color-primary-50` as background behind green elements.
- **Amber accent** (`--color-accent-400`) is only for: price callouts, savings badges, "highlight" spans. Max 2 uses per page section.
- **Neutral-50** is the page background — NOT pure white. Pure white is `--bg-surface` (cards, modals).
- **Dark sections** use `--bg-inverse` with `--text-on-dark`. Do not add a third dark background tone.
- **Borders** are almost always `--border-subtle`. Use `--border-default` only when the element needs clear separation.

---

## 4. Component Patterns

### 4.1 Buttons

Three variants. Do not create more without reason.

```css
/* ——————————————————————————
   BASE BUTTON
—————————————————————————— */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-8);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: all 160ms ease;
  text-decoration: none;
  border: 1.5px solid transparent;
}

/* ——————————————————————————
   PRIMARY — Filled Green
   Use for: main CTA ("Book a Call", "Get Started")
   Max 1–2 per section
—————————————————————————— */
.btn-primary {
  background: var(--color-primary-600);
  color: var(--text-on-primary);
  border-color: var(--color-primary-600);
  box-shadow: 0 1px 3px rgba(14,133,62,0.25), 0 4px 12px rgba(14,133,62,0.12);
}
.btn-primary:hover {
  background: var(--color-primary-700);
  border-color: var(--color-primary-700);
  box-shadow: 0 2px 6px rgba(14,133,62,0.3), 0 8px 20px rgba(14,133,62,0.15);
  transform: translateY(-1px);
}
.btn-primary:active {
  background: var(--color-primary-800);
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(14,133,62,0.2);
}
.btn-primary:focus-visible {
  outline: 3px solid var(--color-primary-300);
  outline-offset: 2px;
}

/* ——————————————————————————
   SECONDARY — Outlined
   Use for: secondary actions ("Learn More", "View Package")
—————————————————————————— */
.btn-secondary {
  background: transparent;
  color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}
.btn-secondary:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-700);
  color: var(--color-primary-700);
}
.btn-secondary:active {
  background: var(--color-primary-100);
}

/* ——————————————————————————
   GHOST — Text only
   Use for: navigation links, "learn more" in cards
—————————————————————————— */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}
.btn-ghost:hover {
  color: var(--text-primary);
  background: var(--color-neutral-100);
}

/* SIZES */
.btn-sm {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-xs);
}
.btn-lg {
  padding: var(--space-5) var(--space-10);
  font-size: var(--text-base);
  border-radius: 8px;
}

/* DISABLED */
.btn:disabled,
.btn[aria-disabled="true"] {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

---

### 4.2 Cards

```css
/* ——————————————————————————
   BASE CARD
—————————————————————————— */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: var(--space-8);
  position: relative;
  overflow: hidden;
}

/* ——————————————————————————
   PRICING CARD
   Structure:
   - eyebrow (e.g. "HDB Seller Package")
   - price (JetBrains Mono, large)
   - GST note (muted, small)
   - divider
   - feature list
   - CTA button
—————————————————————————— */
.card-pricing {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  text-align: center;
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.card-pricing:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  transform: translateY(-3px);
}
.card-pricing.featured {
  background: var(--gradient-brand);
  color: var(--text-on-primary);
  border-color: transparent;
}
.card-pricing .price {
  font-family: var(--font-mono);
  font-size: var(--text-3xl);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-tight);
  color: var(--text-brand);
  line-height: 1;
}
.card-pricing.featured .price {
  color: var(--color-accent-300);
}
.card-pricing .feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-align: left;
}
.card-pricing .feature-list li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.card-pricing.featured .feature-list li {
  color: var(--color-primary-100);
}
.card-pricing .feature-list li::before {
  content: '';
  width: 16px;
  height: 16px;
  min-width: 16px;
  background: var(--color-primary-600);
  border-radius: 50%;
  /* Use an SVG check via mask-image or an icon font */
}

/* ——————————————————————————
   TESTIMONIAL CARD
   Structure:
   - quote mark (decorative, large, green)
   - quote text
   - attribution (name)
—————————————————————————— */
.card-testimonial {
  background: var(--bg-raised);
  border: none;
  border-left: 3px solid var(--color-primary-200);
  border-radius: 0 12px 12px 0;
  padding: var(--space-8);
  position: relative;
}
.card-testimonial .quote-text {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  font-style: italic;
}
.card-testimonial .attribution {
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

/* ——————————————————————————
   AGENT CARD
   Structure:
   - circular photo
   - name (heading)
   - CEA number (mono, muted)
   - bio (small)
—————————————————————————— */
.card-agent {
  text-align: center;
  background: transparent;
  border: none;
  padding: var(--space-6);
}
.card-agent .agent-photo {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto var(--space-4);
  border: 3px solid var(--color-primary-100);
}
.card-agent .agent-name {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}
.card-agent .agent-cea {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  letter-spacing: var(--tracking-wide);
  margin-top: var(--space-1);
}
.card-agent .agent-bio {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

/* ——————————————————————————
   BENEFIT CARD (icon + heading + text)
—————————————————————————— */
.card-benefit {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: var(--space-8);
}
.card-benefit .icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--color-primary-50);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
  color: var(--color-primary-600);
}
.card-benefit h3 {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}
.card-benefit p {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}
```

---

### 4.3 Form Layouts

```css
/* ——————————————————————————
   FORM — Consultation Booking / Contact
—————————————————————————— */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  letter-spacing: var(--tracking-normal);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--space-4) var(--space-5);
  background: var(--bg-surface);
  border: 1.5px solid var(--border-default);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition: border-color 150ms ease, box-shadow 150ms ease;
  -webkit-appearance: none;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--color-neutral-400);
}

.form-input:hover,
.form-select:hover {
  border-color: var(--border-strong);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px rgba(14,133,62,0.12);
}

.form-input.error {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px rgba(220,38,38,0.10);
}

.form-helper {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.form-error-msg {
  font-size: var(--text-xs);
  color: var(--color-error);
}

/* Layout: two-column grid on desktop */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}
@media (min-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
  .form-grid .full-width {
    grid-column: 1 / -1;
  }
}
```

---

### 4.4 Section Patterns

```css
/* EYEBROW label above section heading */
.eyebrow {
  display: block;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-brand);
  margin-bottom: var(--space-3);
}

/* SECTION HEADER — centered layout */
.section-header {
  text-align: center;
  max-width: var(--container-text);
  margin: 0 auto var(--space-12);
}
.section-header h2 {
  font-family: var(--font-display);
  font-size: clamp(var(--text-2xl), 4vw, var(--text-3xl));
  font-weight: 700;
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}
.section-header p {
  font-size: var(--text-md);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

/* SAVINGS BADGE — amber accent */
.badge-savings {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background: var(--color-accent-100);
  color: var(--color-accent-600);
  border-radius: 100px;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
}

/* COMPARISON TABLE */
.comparison-table {
  border-collapse: collapse;
  width: 100%;
  font-size: var(--text-sm);
}
.comparison-table th {
  background: var(--bg-raised);
  padding: var(--space-4) var(--space-6);
  font-weight: var(--weight-semibold);
  text-align: left;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-default);
}
.comparison-table th.highlight {
  background: var(--color-primary-600);
  color: var(--text-on-primary);
}
.comparison-table td {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  vertical-align: middle;
}
.comparison-table td.highlight {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  font-weight: var(--weight-medium);
}

/* NAVIGATION */
.nav {
  display: flex;
  align-items: center;
  padding: var(--space-4) var(--gutter);
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 100;
}
```

---

## 5. Avoid Generic AI Aesthetic

These are **hard prohibitions**. Violating them makes the site look like every other AI-generated marketing page.

### ❌ Never use these fonts
- Inter, Roboto, DM Sans (if it was used before), Nunito, Lato, Open Sans
- System font stacks as primary display typography
- Space Grotesk, Outfit, Poppins (AI clichés)

### ❌ Never use these colors
- Purple gradients on white (`#7c3aed`, `#8b5cf6`)
- Teal + purple combinations
- Flat Material Design blue (`#2196f3`)
- Random hex codes not from the token system above

### ❌ Never use these layout patterns
- Full-width hero with centered heading + subheading + two equal-width buttons, nothing else
- Three identical icon + heading + paragraph cards, same size, same spacing, no hierarchy
- Alternating left/right image-text sections with no visual variation
- Gradient blobs as background decoration (the floating purple/blue blobs)
- "Bento grid" with randomly filled boxes of different sizes for no reason

### ❌ Never write these copy/UI patterns
- "Revolutionize your [X]" or "Transform the way you [Y]"
- Generic stat badges: "10,000+ happy customers" in a centered pill badge
- Stars (★★★★★) next to every testimonial in the same way
- "Trusted by 200+ companies" with a row of greyscale logos

### ✅ Instead, do this

| Generic → | HomeUP version |
|---|---|
| Floating blob backgrounds | Subtle grain texture on `--bg-raised` sections; a single editorial image as section anchor |
| "3 equal icon cards" benefit section | 2-column editorial layout: large typographic number + benefit text, staggered vertically |
| Centered hero with two buttons | Left-aligned headline with price proof ("from $1,999") immediately visible, single primary CTA |
| Generic green checkmarks | Custom SVG mark that matches brand weight |
| "Book a call" CTA centered alone | CTA paired with a trust signal (e.g. "No commitment. 45-minute session.") |
| All sections same background | Alternate: `--bg-page` → `--bg-inverse` (dark) → `--bg-raised` → `--bg-page` for visual rhythm |

---

## 6. Responsive Breakpoints

```css
/* Mobile-first. Breakpoints match spacing context changes. */
:root {
  --bp-sm:  640px;   /* phablet — 2-col grids start */
  --bp-md:  768px;   /* tablet — nav changes, side-by-side sections */
  --bp-lg:  1024px;  /* desktop — full layout, multi-col pricing */
  --bp-xl:  1280px;  /* wide desktop */
  --bp-2xl: 1536px;  /* very wide — max-width container clamps */
}

/* Usage: */
@media (min-width: 768px) { ... }
@media (min-width: 1024px) { ... }
```

---

## 7. Elevation / Shadows

```css
:root {
  --shadow-sm:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:   0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:   0 8px 32px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.05);
  --shadow-xl:   0 20px 60px rgba(0,0,0,0.12);

  /* Brand-tinted shadow for primary elements */
  --shadow-brand-sm: 0 2px 8px rgba(14,133,62,0.18);
  --shadow-brand-md: 0 6px 20px rgba(14,133,62,0.18);

  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   20px;
  --radius-full: 9999px;
}
```

---

## 8. Tailwind Config (if using Tailwind CSS)

```js
// tailwind.config.js
const colors = require('tailwindcss/colors')

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        primary: {
          50:  '#f0faf4',
          100: '#d9f2e4',
          200: '#b4e4c9',
          300: '#7dcfa7',
          400: '#45b47e',
          500: '#1e9957',
          600: '#0e853e',  // brand
          700: '#0b6b31',
          800: '#085224',
          900: '#053618',
        },
        neutral: {
          50:  '#faf9f7',
          100: '#f3f0eb',
          200: '#e8e3db',
          300: '#d4ccc0',
          400: '#b0a596',
          500: '#8c7f70',
          600: '#6b5f52',
          700: '#4e4439',
          800: '#342c23',
          900: '#1e1812',
        },
        accent: {
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#f5be1e',
          500: '#e0a008',
          600: '#b47d04',
        },
      },
      spacing: {
        // Extended from default (already on 4px grid — use 8-unit multiples)
        '18': '72px',
        '22': '88px',
        '26': '104px',
        '30': '120px',
        '36': '144px',
      },
      fontSize: {
        'display-sm': ['2.625rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-md': ['3.5rem',   { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'display-lg': ['4.5rem',   { lineHeight: '1.0', letterSpacing: '-0.04em' }],
      },
    },
  },
}
```

---

## 9. Quick Reference — Dos and Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Use `--font-display` (Playfair) for all `<h1>`–`<h2>` | Use Inter or system fonts for headings |
| Use `--font-mono` (JetBrains Mono) for prices | Use bold sans-serif for price display |
| Amber for "savings" callouts only | Use amber as a general accent everywhere |
| Warm neutral backgrounds (`--color-neutral-50`) | Use pure `#ffffff` as page background |
| Left-align hero content with price visible above the fold | Center-align everything equally |
| One `btn-primary` per section, max | Two primary buttons side-by-side |
| All spacing from the 8px grid tokens | Arbitrary values like `margin-top: 22px` |
| `clamp()` for fluid type on headers | Fixed px sizes for responsive headings |
| Test on Samsung Galaxy A-series (common SG mid-range) | Only test on iPhone |