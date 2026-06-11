# Provisionly design system

All UI colors must come from CSS variables in [`app/design-tokens.css`](../app/design-tokens.css). **Do not hardcode hex values in components.**

Run `npm run check:colors` before shipping — it fails on hex literals, `text-white`, `bg-black`, and `rgb()`/`rgba()` in `components/`, `app/`, and `lib/`.

## Light palette — "Fresh Nordic Garden"

| Name | Hex | Role | Vibe |
|------|-----|------|------|
| Mist White | `#F0F4F8` | Main canvas | Cool, airy Nordic background |
| Haze Blue | `#E0E7FF` | Soft accent | Gentle lavender-blue wash |
| Frost Slate | `#2B354F` | Structural lines | Deep blue-gray typography and depth |
| Driftwood | `#D8DEE9` | Pale neutral | Light cool gray dividers |
| Sea Mint | `#A1DBC2` | Fresh organic green | Soft garden green accent |
| Cloud Blue | `#CBD5E1` | Muted gray-blue | Secondary labels and hints |
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
| `--background` | Mist White | Night Slate |
| `--foreground` | Frost Slate | Icy White |
| `--surface` | Pure White (`#FFFFFF`) | Midnight Black |
| `--muted` | Driftwood tint (derived) | Deep Frost tint (derived) |
| `--muted-foreground` | Cloud Blue | Glacier Gray |
| `--border` | Driftwood | Deep Frost |
| `--primary` | Frost Slate | Icy White |
| `--primary-foreground` | Pure White | Night Slate |
| `--secondary` | Sea Mint | Weathered Copper |
| `--accent` | Lingonberry Red | Lingonberry Red |
| `--brand` | Lingonberry Red (alias of `--accent`) | Lingonberry Red |
| `--focus-ring` | Lingonberry Red (alias of `--accent`) | Lingonberry Red |
| `--overlay` | Frost Slate ~40% alpha | Night Slate ~55% alpha |
| `--destructive` | Lingonberry Red | Lingonberry Red |

Tailwind utilities are registered in [`app/globals.css`](../app/globals.css) (`bg-surface`, `text-accent`, `border-border`, etc.) alongside `var(--*)` in class strings.

## Usage rules

### Primary vs brand vs accent

- **`--primary`:** Solid CTA buttons (Add, Save, Sign in), toggle switch “on” state. Not for wordmarks or inline links.
- **`--brand`:** Wordmarks (“Provisionly”), text links (back, settings, guest CTA), navigation emphasis.
- **`--accent`:** Info/success banners (`border-[var(--accent)]/30 bg-[var(--accent)]/10`), checkboxes, loading spinners.
- **`--focus-ring`:** Input and interactive focus outlines (alias of `--accent`).
- **`--secondary`:** Category section headers in lists, member avatar chips (`bg-[var(--secondary)]/20 text-[var(--secondary)]`).
- **`--overlay`:** Modal and sheet scrims (`bg-[var(--overlay)]`).
- **Destructive actions:** `var(--destructive)` variant; destructive button text uses `var(--destructive-foreground)`.

### Layout

- **Cards and inputs:** `var(--surface)` on `var(--background)`
- **Category headers:** Uniform `text-[var(--secondary)]` — do not use per-category DB colors in the UI.

## Allowed exceptions (hex literals)

| File | Reason |
|------|--------|
| `app/design-tokens.css` | Source of truth for palette |
| `lib/design/palette.ts` | PWA manifest / themeColor constants |
| `lib/pwa/icon-markup.tsx` | Server-rendered PWA icons (ImageResponse) |

PWA manifest and layout `themeColor` import from `lib/design/palette.ts` only.

## PWA

- Manifest `background_color`: Mist White (`lightPalette.mistWhite`)
- Manifest `theme_color`: Frost Slate (`lightPalette.frostSlate`)
- Icons: [`lib/pwa/icon-markup.tsx`](../lib/pwa/icon-markup.tsx)
