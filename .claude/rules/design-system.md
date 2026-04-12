---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
  - "docs/prototypes/**"
---

# Design System

Dark, minimal, futuristic — automotive HUD aesthetic.
Glanceable: zero cognitive load while playing.
If a prototype exists in `docs/prototypes/`, it is the visual spec — match exactly.

## design gate

Two gates must clear before a UI story is ready for implementation:

1. **Behavioral spec exists.** What does the feature do in concrete scenarios? If the epic has a `design-gate` story for interaction scenarios, it must be resolved first. No building until "what it does" is defined with storyboard examples.
2. **Visual spec exists.** No UI story without a prototype or visual spec. No prototype = propose a `design-gate` story to create one first.

Both gates use the `design-gate` label in GitHub and block implementation stories via dependency.

After implementation, verify: type scale, spacing scale, color tokens, 44px touch targets, animation timing.

## color tokens

All colors via CSS variables in `src/index.css`. Never raw hex/rgb in components.

Accent (`--color-accent`, teal) rules:
- Reserved for interactive/rhythmic feedback only
- Never for static decoration, backgrounds, or text
- Allowed: beat pulse dot, playhead arrows, active play button, hit ripple, drum bars, active string indicator

## typography

- Sans-serif (`--font-sans`): all UI text, buttons, labels
- Monospace (`--font-mono`): fret numbers, BPM display, numeric controls
- Two weights only: 400 (regular) and 500 (medium). Never bold (700).
- Italic only for the offline status message.

Type scale: 11px labels | 13px body | 14px tab frets (mono) | 20px large numeric | 76px flash card value

## spacing

Only these values: 2 / 4 / 8 / 12 / 16 / 24 px. Do not invent others.
Page padding: 16px. Max content width: 600px centered.

## dimensions

Top bar: 36px. Bottom bar: 44px. Beat cell: 24px. Flash card: 120px.
Touch target min: 44x44px. Beat dot: 10px. Icons: 20px. Drag handle: 32x3px.
String strip: 48px wide, 14px string spacing.

## icons

No emoji icons. Inline SVG only: 20x20 viewBox, 1.5px stroke, `stroke="currentColor"`, `fill="none"`.

## animation

Instant attack, fast decay. No spring/bounce. No opacity fade-in for content.

| pattern | attack | release |
|---------|--------|---------|
| beat cell / fret active | instant | 120ms ease |
| beat pulse dot | instant | 400ms ease-out |
| button press | scale(0.98) | 120ms ease |
| drawer open/close | 200ms ease-out | 150ms ease-in |
| hit ripple | instant | 300ms ease-out |
| flash correct | instant | 200ms ease-out (scale + teal) |
| flash wrong | instant | 280ms ease-out (shakeX + dim) |

No hover effects — `:active` only.

## buttons

**Primary** (play/stop): `background: var(--color-text-primary)`, inverted text. Active: accent background.
**Secondary** (controls): `background: var(--color-background-secondary)`, 0.5px border.
All: `--font-sans`, 11px or 13px. `:active { transform: scale(0.98) }`.

## borders and corners

- Structural dividers: `0.5px solid var(--color-border-secondary)`
- Beat cells: `1.5px solid var(--color-border-secondary)`
- Subdivision lines: `1px var(--color-border-tertiary)`
- No box-shadow anywhere
- Sharp corners everywhere except: 8px standalone buttons, 2px drag handle, round beat dot
