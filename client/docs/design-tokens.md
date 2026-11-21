# Market Radar — design tokens (v0.1, 21 Nov 2026)

Source: logo colours from powercoders.svg; everything else derived.

```css
:root {
  /* Brand (logo) */
  --color-action: #B23149;         /* buttons, active nav, links, selection · 6.1:1 on white */
  --color-action-strong: #8E2639;  /* hover/pressed, error text and border · 8.5:1 */
  --color-action-subtle: #F8EBEE;  /* selected bg, error bg */
  /* Neutrals (from logo grey) */
  --color-text: #343534;           /* text, focus ring · 12.3:1 */
  --color-text-muted: #5E5F5D;     /* secondary text, placeholders · 6.4:1 */
  --color-border-strong: #767775;  /* input borders, icons · 4.5:1 */
  --color-border: #D9D9D7;         /* dividers, card borders (decorative) */
  --color-bg: #F6F6F5;             /* page background */
  --color-surface: #FFFFFF;        /* cards, inputs */
  /* Status — always with icon + text */
  --color-success: #1F6B3E;  --color-success-subtle: #EAF3ED;   /* fresh data */
  --color-warning: #7A4F00;  --color-warning-subtle: #FBF3E2;   /* outdated data */
  /* errors reuse --color-action-strong / --color-action-subtle */

  /* Type — system stack until Powercoders confirms a brand font */
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  /* display 40/48 700 · h1 32/40 700 · h2 24/32 700 · h3 18/24 700 · body 16/24 400 · label 14/20 600 (minimum) */

  /* Spacing — 8 px base */
  --space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 24px;
  --space-5: 32px; --space-6: 48px; --space-7: 64px;

  /* Geometry */
  --radius: 0;  --border: 1px;  --focus: 3px solid var(--color-text);  /* outline-offset 2px */
  --target-min: 44px;
}
```

Breakpoints: mobile < 640 · tablet 640–1023 · desktop ≥ 1024.
Layout: header 72 px (64 px mobile) · sidebar 264 px / 72 px collapsed · content padding 40×48 desktop, 32 tablet, 24×16 mobile · gap between blocks 32 px (24 mobile) · card padding 24 (16 mobile).
