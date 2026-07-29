# Provisionly design system

All UI colors must come from CSS variables in [`app/design-tokens.css`](../app/design-tokens.css). **Do not hardcode hex values in components.**

Run `npm run check:colors` before shipping — it fails on hex literals, `text-white`, `bg-black`, and `rgb()`/`rgba()` in `components/`, `app/`, and `lib/`.

## Light palette — "Soft Nordic"

| Name | Hex | Role | Vibe |
|------|-----|------|------|
| Linen White | `#F3F5F8` | Main canvas | Warm, airy Nordic background |
| Haze Blue | `#E0E7FF` | Soft accent | Gentle lavender-blue wash |
| Frost Slate | `#2B354F` | Structural lines | Deep blue-gray typography and depth |
| Driftwood | `#D8DEE9` | Pale neutral | Light cool gray dividers |
| Sea Mint | `#A1DBC2` | Fresh organic green | Soft garden green surface tint |
| Slate Muted | `#6B7A94` | Readable secondary | Muted labels (derived in tokens) |
| Lingonberry Red | `#E13C33` | Sharp contrast | Bold Nordic berry pop |

## Dark palette — "Midnight Frost"

| Name | Hex | Role | Vibe |
|------|-----|------|------|
| Night Slate | `#1A1D29` | Main canvas | Deep night background |
| Midnight Black | `#11141D` | Deep structure | Elevated card surfaces |
| Deep Frost | `#333B53` | Subtle lines | Cool border and divider tone |
| Weathered Copper | `#6A6C79` | Muted bronze accent | Organic secondary accent |
| Glacier Gray | `#B1B7C4` | Cool neutral accent | Muted secondary text |
| Icy White | `#E4EAF2` | Crisp primary text | High-contrast readable text |
| Lingonberry Red | `#E13C33` | Sharp contrast | Bold Nordic berry pop |

## Semantic tokens

| Token | Light | Dark |
|-------|-------|------|
| `--background` | Linen White | Night Slate |
| `--foreground` | Frost Slate | Icy White |
| `--surface` | Pure White (`#FFFFFF`) | Midnight Black |
| `--surface-elevated` | Pure White | Deep Frost tint |
| `--muted` | Driftwood tint (derived) | Deep Frost tint (derived) |
| `--muted-foreground` | Frost Slate ~58% mix | Glacier Gray |
| `--label` | Frost Slate ~72% mix | Icy White ~75% mix |
| `--border` | Driftwood | Deep Frost |
| `--primary` | Frost Slate | Icy White |
| `--secondary` | Sea Mint | Weathered Copper |
| `--accent` | Lingonberry Red | Lingonberry Red |
| `--brand` | Lingonberry Red (alias of `--accent`) | Lingonberry Red |
| `--focus-ring` | Lingonberry Red (alias of `--accent`) | Lingonberry Red |
| `--overlay` | Frost Slate ~40% alpha | Night Slate ~55% alpha |
| `--shadow-sm` / `--shadow-md` | Soft cool shadows | Soft dark shadows |
| `--destructive` | Lingonberry Red | Lingonberry Red |

Tailwind utilities are registered in [`app/globals.css`](../app/globals.css) (`bg-surface`, `text-accent`, `border-border`, etc.) alongside `var(--*)` in class strings.

## Typography

- **Sans (Geist):** UI chrome — nav dock, buttons, labels, section headers, inputs
- **Serif (Source Serif 4):** Body copy — list titles, recipe text, settings descriptions

## Usage rules

### Primary vs brand vs accent

- **`--primary`:** Solid CTA buttons (Add, Save, Sign in), toggle switch “on” state. Not for wordmarks or inline links.
- **`--brand`:** Wordmarks (“Provisionly”), text links (back, settings, guest CTA), navigation emphasis.
- **`--accent`:** Info/success banners (`border-[var(--accent)]/30 bg-[var(--accent)]/10`), checkboxes, loading spinners.
- **`--focus-ring`:** Input and interactive focus outlines (alias of `--accent`).
- **`--secondary`:** Decorative surface tints (`bg-[var(--secondary)]/20`), avatar chips — not for body text.
- **`--label`:** Section headers (uppercase labels in lists/recipes).
- **`--overlay`:** Modal and sheet scrims (`bg-[var(--overlay)]`).
- **Destructive actions:** `var(--destructive)` variant; destructive button text uses `var(--destructive-foreground)`.

### Layout

- **Cards and inputs:** `var(--surface)` on `var(--background)` with `var(--shadow-sm)` optional
- **Floating dock:** `var(--surface-elevated)` with `var(--shadow-md)`
- **Category headers:** `text-[var(--label)]` — do not use per-category DB colors in the UI.

## Allowed exceptions (hex literals)

| File | Reason |
|------|--------|
| `app/design-tokens.css` | Source of truth for palette |
| `lib/design/palette.ts` | PWA manifest / themeColor constants |
| `lib/pwa/icon-markup.tsx` | Server-rendered PWA icons (ImageResponse) |

PWA manifest and layout `themeColor` import from `lib/design/palette.ts` only.

## PWA

- Manifest `background_color`: Linen White (`lightPalette.linenWhite`)
- Manifest `theme_color`: Frost Slate (`lightPalette.frostSlate`)
- Icons: [`lib/pwa/icon-markup.tsx`](../lib/pwa/icon-markup.tsx)
