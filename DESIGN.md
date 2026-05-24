---
version: alpha
name: MiNegocio Digital
description: "A dark-default, Mexican-Spanish-primary product surface anchored by a cartoon-phone mascot. Teal-leaning primary (#48a890, sampled from the mascot's body) with a beanie-red accent (#d94343) used only for urgency and errors — never as primary CTA. Type is Geist Sans throughout with Geist Mono reserved for IDs and code. Surfaces lean on tonal layers and hairline borders rather than heavy shadows; corners are softly rounded (xl/2xl for prominent panels) and the layout caps at 1800px so the wide-monitor reader doesn't get a 1280px ribbon. Voice is friendly-professional, tú-form, one-question-per-turn — the same rule the chat agent itself follows."

colors:
  primary: "#48a890"
  primary-hover: "#48a878"
  primary-light: "#60a890"
  primary-dark: "#309078"
  on-primary: "#ffffff"

  accent: "#d94343"
  on-accent: "#ffffff"

  canvas: "#000000"
  surface-1: "#0f0f0f"
  surface-2: "#171717"
  surface-3: "#1f1f1f"

  ink: "#ffffff"
  ink-muted: "#a3a3a3"
  ink-subtle: "#737373"
  ink-faint: "#525252"

  hairline: "#262626"
  hairline-strong: "#404040"

  semantic-success: "#22c55e"
  semantic-error: "#ef4444"
  semantic-warning: "#f59e0b"

typography:
  display-xl:
    fontFamily: Geist Sans
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.04em
  display-lg:
    fontFamily: Geist Sans
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.03em
  h1:
    fontFamily: Geist Sans
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.025em
  h2:
    fontFamily: Geist Sans
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Geist Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: Geist Sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Geist Sans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.01em
  label-micro:
    fontFamily: Geist Sans
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.01em
  mono-sm:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5

rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 20px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
  4xl: 48px
  outer-max: 1800px
  outer-px: 24px
  outer-px-md: 40px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.body-md}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.body-md}"
  button-ghost:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.body-md}"
  card:
    backgroundColor: "{colors.surface-1}"
    rounded: "{rounded.xl}"
    padding: 16px
  panel-floating:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.2xl}"
    padding: 16px
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: 12px
    typography: "{typography.body-md}"
  chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: 4px
    typography: "{typography.caption}"
---

# MiNegocio Digital — DESIGN.md

> Source of truth for visual identity. Both humans and AI agents read this file
> before producing UI. If a rule isn't here, it isn't decided — ask, don't
> invent. Follows the [DESIGN.md format](https://github.com/google-labs-code/design.md)
> (alpha).

## Overview

MiNegocio Digital is a SaaS for Mexican small-business owners that gives their
customers an always-on Spanish-speaking booking and FAQ assistant. The
visual identity is built around a single cartoon mascot — a smiling
green-screen smartphone wearing a red knit beanie — that anchors the brand
across every surface from the favicon to the embedded widget header.

The product surface is dark by default. Surfaces stack via tonal layers
(`surface-1` through `surface-3`) and hairline borders rather than heavy
shadows; the mascot's teal provides the only routine chromatic accent.
Composition is restrained but not minimalist — there is room for warmth
because business owners are betting their livelihood on this tool. Every
visible string is Mexican Spanish, tú-form, professional but never corporate.

Typography is **Geist Sans** at all sizes, with Geist Mono reserved for IDs,
slugs, code, and technical labels. No condensed sans, no Inter fallback, no
display-only third-party fonts unless added to this file first.

The product is dense for a chat surface (380px wide widget, 600px tall) so
the type scale leans tighter than a marketing site would — `body-md` is 14px,
captions are 12px, and the smallest reliable size is 11px for micro-labels.

## Colors

The palette is rooted in the mascot. Every color token is either sampled
from the mascot image (`public/mascot.png`) or chosen specifically to support
it on a dark canvas.

- **Primary — Mascot Teal (`#48a890`)**: The mascot's body color, the brand
  primary. Use sparingly: brand-mark surfaces, primary CTAs, focus rings,
  presence dots, and a faint ambient wash on branded panels. Never as a
  default background or container.
- **Accent — Beanie Red (`#d94343`)**: The mascot's beanie. Reserved for
  errors, urgent escalation, and destructive confirmation. Never the primary
  CTA — that would compete with the brand and overload red with marketing
  meaning.
- **Canvas (`#000000`)** and surfaces (`#0f0f0f` → `#1f1f1f`): The dark
  default. Layer surfaces tonally; never use both heavy shadow and a tonal
  step to express the same hierarchy.
- **Ink (`#ffffff`)** with muted (`#a3a3a3`), subtle (`#737373`), and faint
  (`#525252`): The four-step text hierarchy. Body text is `ink` at 90%
  opacity; secondary text uses `ink-muted` directly.
- **Hairline (`#262626`)** for dividers and `hairline-strong` (`#404040`)
  for emphasized borders.
- **Semantic** colors (`success`, `error`, `warning`) are standard
  Tailwind-aligned values, used only for system signals, never decoratively.

Light mode is intentionally undefined; if it ever ships, add a companion
DESIGN-LIGHT.md before implementing.

## Typography

**Geist Sans** for everything user-facing. **Geist Mono** only for
IDs, slugs, code, error codes, and technical labels — never for prose.

The scale runs from `display-xl` (48px / weight 600 / -0.04em tracking) at
the marketing hero end down to `label-micro` (11px / weight 500) for the
chat-widget caption line. All display sizes carry negative letter-spacing to
tighten Geist's slightly open default; body sizes use default tracking.

Wordmark treatment: when the brand name "MiNegocio" appears as text, use the
`h2` token or larger and apply `letterSpacing: -0.01em` to bring the Geist
letterforms in tight. Always cased exactly as **MiNegocio** (camel-case M
and N). Never all-caps unless inside a chip or label ≤ 12px.

## Layout

The outermost wrapper for every page caps at **1800px** with horizontal
padding of `outer-px` (24px) below the medium breakpoint and `outer-px-md`
(40px) at and above it. Inner content (paragraphs, narrow forms) may use
smaller caps for readability — the 1800px rule is only about the outermost
container so wide-monitor users don't get a 1280px ribbon.

The spacing scale is on multiples of 4px. Prefer the named tokens (`md`,
`lg`, `xl`) over arbitrary values. Use `gap-3` (12px) for grouped controls
and `gap-5` (20px) for unrelated stacked sections.

The chat widget is fixed at 380px wide × 600px tall (`max-h-[80dvh]`) with
`outer-px` of 14px (`px-3.5`). The widget is the densest surface in the
product; tokens may be applied at the smaller end of the scale.

## Elevation & Depth

Depth comes from **tonal layers and hairline borders**, not shadow.

- Page = `canvas`
- Resting card = `surface-1`, optionally with a 1px `hairline` border
- Elevated card / panel = `surface-2`, hairline border, no shadow
- Floating widget / modal = `canvas` background, 1px `hairline` border, soft
  shadow only on the outermost edge (`shadow-2xl shadow-black/50`) — never on
  internal cards

Avoid mixing tonal elevation and shadow on the same component; pick one.
The chat-widget panel uses both intentionally because it floats over an
arbitrary tenant page that we can't style.

## Shapes

The shape language is **soft and consistent**, not playful, not
architectural. Every interactive surface uses the rounded scale; nothing has
sharp 0px corners except inline icons.

- `rounded.sm` (6px) — inputs, chips, small buttons
- `rounded.md` (8px) — standard buttons, dropdown items
- `rounded.lg` (12px) — cards
- `rounded.xl` (16px) — brand tiles, prominent panels
- `rounded.2xl` (20px) — floating panels (chat widget, modal)
- `rounded.full` — pills, the chat-launcher bubble, the presence dot

Do not mix scales within a single composition: a card at `rounded.lg`
should contain buttons at `rounded.md`, not `rounded.sm`.

## Components

Component tokens are defined in YAML. The notes here capture the rationale
that doesn't fit in the token table.

- **`button-primary`**: Teal background, white text, used for the single
  most important action per screen. There should never be more than one
  primary button visible at one time.
- **`button-secondary`**: `surface-2` background. Use for confirm/cancel
  pairs and for any non-primary CTA. Pairs with `button-primary` in modals.
- **`button-ghost`**: Transparent background, `ink-muted` text. Used for
  navigation links, tertiary actions, close buttons.
- **`card`**: `surface-1` at `rounded.xl`, 16px padding. The default
  container for grouped content on the dark canvas.
- **`panel-floating`**: `canvas` background at `rounded.2xl`. Used by the
  chat widget and any modal that overlays foreign content.
- **`input`**: `canvas` background (not `surface-1` — inputs need to recede,
  not advance). `rounded.md`, 12px padding, `body-md` typography. Focus ring
  uses `primary` at 50% opacity, never `accent`.
- **`chip`**: `surface-2` background, `ink-muted` text, `rounded.full`,
  caption typography. Used for tags, status indicators, and inline metadata.

## Do's and Don'ts

- Do use `primary` (teal) as the single CTA color per screen.
- Do reserve `accent` (red) for errors, destructive confirmations, and
  urgent escalations. Never use it as a primary CTA.
- Do tighten Geist Sans with negative letter-spacing at all display sizes
  (`-0.025em` to `-0.04em`).
- Do use the mascot at the largest size the surface allows. Hiding the
  character at 32px when 96px would fit is a missed brand moment.
- Do write user-facing copy in Mexican Spanish, tú-form, one question per
  turn — the same rule the chat agent follows.
- Do verify the wordmark renders in Geist Sans by reading the actual font
  CSS, not the design intent.

- Don't apply non-uniform scaling to the mascot. Always use
  `object-contain` + `w-auto` when constraining one axis. The previous
  `logo.png` is deprecated specifically because its M was horizontally
  stretched.
- Don't commission or import a speech-bubble-plus-monogram lockup. The
  mascot is the mark; text wordmarks set in Geist are the supporting form.
- Don't apply background fills to the mascot. It has a transparent PNG;
  let the page background show through.
- Don't crop the character below the knees or above the beanie pom.
- Don't rotate, flip, mirror, or recolor the mascot.
- Don't place the mascot inside a hard-edged square. A soft `rounded-xl`
  tile with a low-contrast fill is acceptable (chat widget header
  pattern); a sharp 0px-corner box is not.
- Don't put both a heavy box-shadow and a tonal elevation step on the same
  card. Pick one.
- Don't use more than two font weights on a single screen.
- Don't introduce a third typeface. Geist Sans + Geist Mono are the only
  permitted families.
- Don't ship empty states that just say "No data." Every empty state
  needs Spanish microcopy explaining what would appear here and what the
  next user action is.
- Don't ship loading states that are bare spinners. Skeletons or labeled
  spinners only.
- Don't surface raw error codes to end users. Friendly Spanish copy with a
  recovery action.
- Don't mix `rounded` scales within a single composition.

---

## Mascot Usage

The mascot is the brand mark. There is no separate wordmark/logo asset; the
predecessor `logo.png` (speech-bubble with a horizontally stretched M) has
been removed.

- Canonical file: `public/mascot.png` — 896×1200 transparent PNG. The
  original pre-cutout source is preserved at `public/mascot-original.png`.
- Used as: favicon, apple-touch-icon, Open Graph image, landing-page hero,
  onboarding empty state, chat-widget header avatar.

Per-surface size guidance:

| Surface | Treatment |
|---|---|
| Landing hero (`/`) | ~256px square (`w-64 h-64 object-contain`), no container, no halo, no animation. Pair with `<h1>MiNegocio Digital</h1>` directly below. |
| Onboarding empty state | ~96px (`h-24 w-auto object-contain`), centered, no container. |
| Chat widget header | ~36–44px inside a `rounded-xl` tile with `bg-white/[0.06]` fill, with a green presence dot at the bottom-right corner. |
| Favicon / apple-touch-icon | Direct `/mascot.png`. (Future: pre-rendered square crops at 32, 180, 512 — not yet generated.) |
| OG / Twitter card | Direct `/mascot.png`. (Future: pre-rendered 1200×630 OG composite — not yet generated.) |

## Voice & Tone

- **Primary language: Mexican Spanish.** All user-facing copy ships in
  es-MX first. English in a user surface is a bug.
- **Friendly-professional.** The mascot is a cartoon, but the platform
  serves business owners betting their livelihood on it. Warm, never goofy.
  Confident, never corporate.
- **Use "tú" not "usted"** in chat surfaces — informal, accessible.
- **One thing at a time.** Microcopy asks one question per turn. Same rule
  the chat agent follows in `lib/ai/prompt-builder.ts`.
- **Avoid jargon.** Business owners aren't engineers. "Asistente," not
  "agente IA tool-calling." "Horarios," not "config."
- **No emoji in UI chrome.** Allowed in chat content if the agent decides
  to use them sparingly. Not in headers, buttons, navigation, or legal copy.

## Motion

- Motion is decorative, never required to understand state. Every meaningful
  state change has a non-motion fallback.
- Hover transitions: 150ms ease-out.
- Presence dots / pulses: 2s cycle, opacity 0.6 max — never aggressive.
- Layout shifts: avoid on first paint. Use skeletons or `min-h-*`
  placeholders.
- Respect `prefers-reduced-motion`. Not yet implemented globally — tracked.

## Accessibility Floor

These are minimums, not design choices:

- Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for UI components.
- Every interactive element has a visible focus ring (default Tailwind ring
  on `primary` at 50% opacity).
- Every icon-only button has an `aria-label` in Spanish.
- Headings form a coherent outline (h1 → h2 → h3, no skips).
- Skip-to-content link present on every page (not yet implemented — tracked).
- Live regions (`aria-live`) for async state changes (chat streaming, form
  errors).

## Not Yet Defined

These are intentionally undefined. Add a section here before building:

- Light mode palette.
- Illustration style beyond the single mascot.
- Photography rules.
- Sound design (chat notification chirp, etc.).
- Email template styling.
- Marketing-page typography scale (the doc above is product-focused).
- Localization beyond Spanish (English in particular).

When one of these becomes a real question, write the rule here before
writing code or asking an agent to design against it.

## How To Use This File

1. Every visual change must be checkable against this file.
2. If a rule is unambiguous, follow it. If it conflicts with what looks
   good in context, **edit this file first** to capture the new rule, then
   make the change.
3. If the question isn't covered, add a stub to "Not Yet Defined" and ask
   before inventing an answer.
4. Agents dispatched for design work must be given this file as part of the
   brief. The agent must report which sections its output complies with
   and which it deviates from (and why).
