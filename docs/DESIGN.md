# Provisionly design system

All UI colors must come from CSS variables in [`app/design-tokens.css`](../app/design-tokens.css). **Do not hardcode hex values in components.**

Run `npm run check:colors` before shipping — it fails on hex literals, `text-white`, `bg-black`, and `rgb()`/`rgba()` in `components/`, `app/`, and `lib/`.

## Light palette

| Name | Hex | Role | Vibe |
|------|-----|------|------|
| Fjord Blue | `#1E293B` | Primary base / depth | Deep, grounding midnight blue |
| Sage Leaf | `#869A86` | Secondary / organic | Muted, sophisticated green |
| Oatmeal | `#F4EBE1` | Background / softness | Warm, premium cream |
| Snow White | `#FFFFFF` | Highlights / canvas | Crisp, clean white |
| Birch Wood | `#C4B5A6` | Neutral accent | Light, warm gray-tan |
| Charcoal | `#2B2B2B` | Structure / typography | Soft, high-end black |
| Cloudberry Orange | `#FF6B35` | Sharp contrast | Vibrant, electric arctic berry |

## Dark palette

| Name | Hex | Role | Vibe |
|------|-----|------|------|
| Deep Fjord | `#0F172A` | Main night canvas | Deep night slate background |
| Dark Sage | `#2A332A` | Secondary base / depth | Deep, muted foliage |
| Dark Charcoal | `#1A1A1A` | Structure / subtle lines | Soft premium black for outlines |
| Ash Wood | `#4A443A` | Intermediate accent | Dark warm brownish-gray |
| Soft Birch | `#A49586` | Light neutral | Pale desaturated beige-gray |
| Cloud White | `#F1F1F1` | Primary text / contrast | Soft high-light gray |
| Electric Teal | `#14B8A6` | Sharp contrast | Icy vibrant arctic blue |

## Semantic tokens

| Token | Light | Dark |
|-------|-------|------|
| `--background` | Oatmeal | Deep Fjord |
| `--foreground` | Charcoal | Cloud White |
| `--surface` | Snow White | Dark Sage |
| `--muted` | Birch tint (derived) | Dark Sage |
| `--muted-foreground` | Sage Leaf | Ash Wood |
| `--border` | Birch Wood | Dark Charcoal |
| `--primary` | Fjord Blue | Electric Teal |
| `--primary-foreground` | Snow White | Deep Fjord |
| `--secondary` | Sage Leaf | Soft Birch |
| `--accent` | Cloudberry Orange | Electric Teal |
| `--brand` | Cloudberry Orange (alias of `--accent`) | Electric Teal |
| `--focus-ring` | Cloudberry Orange (alias of `--accent`) | Electric Teal |
| `--overlay` | Charcoal ~40% alpha | Deep Fjord ~40% alpha |
| `--destructive` | Cloudberry Orange | Electric Teal |

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

- Manifest `background_color`: Oatmeal (`lightPalette.oatmeal`)
- Manifest `theme_color`: Fjord Blue (`lightPalette.fjordBlue`)
- Icons: [`lib/pwa/icon-markup.tsx`](../lib/pwa/icon-markup.tsx)
