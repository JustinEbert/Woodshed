# Woodshed — Claude Code Briefing

## what this is

Woodshed is an AI-powered personal practice trainer for musicians.
Starting with guitar, instrument-agnostic by design.
The AI trainer observes performance, adapts, and guides — it is not a feature,
it is the product. Built with deliberate practice science as the foundation.

Full spec: `docs/woodshed_spec_v0.2.md`
Full wireframe: `docs/woodshed_wireframe_v0.2.md`
Design prototypes:
  `docs/prototypes/woodshed_metronome_v6_backup.html`  ← metronome + tab (Story #11, #13)
  `docs/prototypes/woodshed_tab_v6.html`               ← tab component standalone (Story #13)

---

## tech stack

```
frontend:   React + Vite + Tailwind CSS + shadcn/ui
deployment: Vercel (PWA)
audio:      Web Audio API (local, on-device)
speech:     Web Speech API (local, on-device — voice input to AI trainer)
ai:         Anthropic Claude API (claude-sonnet-4-20250514)
            user supplies their own API key, stored locally
storage:    local JSON file (user metrics + history)
git:        GitHub
```

---

## project structure

```
woodshed/
  CLAUDE.md                     ← you are here
  README.md
  docs/
    woodshed_spec_v0.2.md       ← source of truth for all decisions
    woodshed_wireframe_v0.2.md  ← structure, layout, interaction flows
    prototypes/
      woodshed_metronome_v6_backup.html  ← working HTML prototype
  src/
    components/
      tab/                      ← tab component (scrolling tablature)
      metronome/                ← metronome component
      trainer/                  ← AI trainer text line + voice input
      shell/                    ← app shell (top bar, bottom bar, drawers)
    exercises/
      note-flash/               ← note flash exercise
      note-hunt/                ← note hunt exercise (later)
    state/                      ← global state (metronome BPM, active exercise)
    audio/                      ← Web Audio API engine
    ai/                         ← Claude API integration + summary schema
  public/
```

---

## architecture — critical decisions

**exercise view is the primary canvas**
the center of the app is the exercise view — it owns the primary area.
the exercise decides what renders inside it (tab component, note name, etc.).
the app shell (top/bottom bar, drawers) never imports exercise components directly.

**metronome is global infrastructure**
always running. BPM and pattern are global state.
all exercises and components subscribe to metronome state.
never starts/stops per exercise — only the user controls it.
exposed via a slide-up bottom drawer (v6 design — see prototype HTML).

**AI trainer is optional / graceful fallback**
online: full trainer experience, claude API calls after each rep summary.
offline: trainer suspends, "offline — self-directed mode" shown in UI.
all exercises, metronome, pitch detection work fully offline.
performance data recorded locally during offline, synced on reconnect.

**audio is always local**
pitch detection runs on-device via Web Audio API — never sent to API.
only structured performance summaries are sent to claude API.
summary schema defined in spec.

**voice is the primary user input to the trainer**
player has guitar in hand — no keyboard input.
trainer text line is a voice trigger (Web Speech API).
tap to browse (exercise select sheet) is the fallback.

---

## design system

### design philosophy

- dark, minimal, futuristic — automotive HUD aesthetic
- glanceable: zero cognitive load while playing
- every pixel intentional — no placeholder styling, no "good enough for now"
- reference the HTML prototypes as the visual baseline for any component
  that has a prototype. do not deviate without discussion.

### design process — required before implementation

**no story with UI output shall be implemented without a visual spec.**

before writing any component code:

1. **check for a prototype** — if `docs/prototypes/` has an HTML file for this
   component, that is the visual spec. match it exactly.
2. **if no prototype exists**, the story must include or reference a visual spec
   that defines: layout dimensions, typography choices (which font, size, weight,
   color token), spacing values, interaction behavior (hover/active/focus states,
   transitions, touch targets), and responsive behavior.
3. **if the story lacks a visual spec**, create a prerequisite story to produce
   one before implementation. do not improvise visual design during implementation.
4. **research before building** — before implementing any UI, review:
   - the CSS variables and tokens defined below
   - the type scale and spacing scale
   - existing components for consistency (font sizes, padding, gap values)
   - the prototype HTML files for established patterns
5. **design QA after building** — after implementation, visually verify:
   - font sizes and weights match the type scale
   - spacing uses only values from the spacing scale
   - colors use only CSS variable tokens (never raw hex in components)
   - touch targets meet minimum 44px
   - transitions follow the animation rules
   - the component looks intentional next to existing components

### color tokens

all colors via CSS variables. never use raw hex/rgb in component code.

```css
--color-background-primary     /* app background */
--color-background-secondary   /* elevated surfaces, cards, inputs */
--color-text-primary           /* headings, primary content */
--color-text-secondary         /* body text, labels */
--color-text-tertiary          /* hints, placeholders, disabled */
--color-border-secondary       /* prominent borders, active states */
--color-border-tertiary        /* subtle dividers, subdivision lines */
--color-accent                 /* teal #4ab8d4 — sparingly: beat pulse,
                                  playhead arrows, active toggle, hit ripple */
```

accent color rules:
- `--color-accent` is reserved for interactive/rhythmic feedback
- never use it for static decoration, backgrounds, or text
- the only accent-colored elements: beat pulse dot, playhead arrows,
  active play button, hit ripple, drum pattern bars

### type scale

```
11px  — labels, captions, uppercase meta text (letter-spacing: 0.05em)
13px  — body text, button labels, secondary content
14px  — tab fret numbers (monospace only)
20px  — large numeric displays (BPM readout)
```

- **sans-serif** (`--font-sans`): all UI text, buttons, labels
- **monospace** (`--font-mono`): fret numbers, BPM display, numeric controls
- **two weights only**: 400 (regular) and 500 (medium)
- never use bold (700), italic only for the offline status message
- all text uses color tokens, never raw values

### spacing scale

use only these values for padding, margin, and gap:

```
2px   — tight internal (bar insets, hairline offsets)
4px   — element gap (beat grid cells, subdivision spacing)
8px   — compact group spacing (button rows)
12px  — section spacing (between control groups within a panel)
16px  — panel padding (drawer horizontal padding, content margins)
24px  — major section padding (drawer bottom padding)
```

- horizontal page padding: 16px (via `px-4` or `padding: 0 16px`)
- max content width: 600px, centered
- do not invent spacing values outside this scale

### component dimensions

```
top bar height:     36px
bottom bar height:  44px
beat cell height:   24px
minimum touch target: 44px × 44px (buttons, tappable areas)
beat pulse dot:     10px diameter
icon size:          20px (stroke icons, not emoji)
drag handle:        32px × 3px, border-radius 2px
```

### icons

**no emoji icons.** all icons must be inline SVG.

- stroke-based, 20×20 viewBox, 1.5px stroke width
- `stroke="currentColor"`, `fill="none"`
- color inherited from parent via `currentColor`
- consistent visual weight across all icons
- icons needed: settings (gear), metronome (vertical bars or pendulum),
  back arrow, close/dismiss, up-down chevron

icon template:
```tsx
<svg width="20" height="20" viewBox="0 0 20 20" fill="none"
     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
     strokeLinejoin="round">
  {/* paths here */}
</svg>
```

### interaction & animation

**instant attack, fast decay — nothing lingers.**

| pattern              | attack          | release               |
|----------------------|-----------------|-----------------------|
| beat cell highlight  | 0ms (instant)   | 120ms ease            |
| beat pulse dot       | 0ms (instant)   | 400ms ease-out        |
| fret number active   | 0ms (instant)   | 120ms ease            |
| button press         | scale(0.98)     | 120ms ease            |
| drawer open/close    | 200ms ease-out  | 150ms ease-in         |
| hit ripple           | 0ms (instant)   | 300ms ease-out (expand + fade) |

- no hover effects on touch-first UI — `:active` only
- no spring/bounce animations
- no opacity fade-in for content (content appears instantly)
- drawer uses `transform: translateY()` for open/close, not conditional render

### buttons

two styles only:

**primary** (play/stop, main actions):
```
background: var(--color-text-primary)
color: var(--color-background-primary)
border: none
```
when active/toggled (e.g. "Stop" while playing):
```
background: var(--color-accent)
color: var(--color-background-primary)
```

**secondary** (±BPM, navigation, settings):
```
background: var(--color-background-secondary)
color: var(--color-text-primary)
border: 0.5px solid var(--color-border-secondary)
```

all buttons:
- font: `--font-sans`, 13px for labels, `--font-mono` 13px for numeric (±1, ±5)
- min-height: 36px, padding: 8px 16px (or 8px 0 for compact)
- border-radius: 0 for metronome/grid context, 8px for standalone buttons
- `:active { transform: scale(0.98) }`

### borders and dividers

- structural dividers (top bar, bottom bar): `0.5px solid var(--color-border-secondary)`
- beat cell borders: `1.5px solid var(--color-border-secondary)`
- subdivision lines: `1px, var(--color-border-tertiary)`
- no box-shadow anywhere

### drawer pattern

slide-up drawers (metronome, exercise select):
- backdrop: fixed overlay, transparent (no dimming), tap to dismiss
- panel: fixed bottom, full width, `var(--color-background-primary)` background
- top border: `0.5px solid var(--color-border-secondary)`
- drag handle: centered, 32×3px, `var(--color-border-secondary)`, tap to dismiss
- content: max-width 600px, centered, padding per spacing scale
- transition: `transform: translateY()` with timing from animation table
- always rendered in DOM (use transform, not conditional render)

### sharp corners rule

- border-radius: 0 on all metronome cells, beat grid, tab elements
- border-radius: 8px on standalone buttons outside grid context
- border-radius: 2px on drag handle only
- rounded-full on beat pulse dot only
- no other border-radius values

---

## tab component — built, needs porting to React

a working vanilla JS/HTML implementation exists in:
`docs/prototypes/woodshed_metronome_v6_backup.html`

the tab component behavior:
- horizontally scrolling right-to-left
- current note left-anchored under dual teal playhead arrows (top + bottom)
- arrows positioned by measuring rendered DOM (getBoundingClientRect)
- arrows pulse on quarter beat from metronome
- hit ripple: two concentric rings expand from note on correct play
- 80ms ease-out scroll transition on advance
- 6 strings, continuous unbroken lines, low E heavier (2px)
- no dashes on empty strings — bare string line only
- fret numbers OR note names depending on exercise config
- all notes uniform opacity — no fading

React component interface (provisional):
```jsx
<TabComponent
  sequence={[]}         // array of note objects [e, B, G, D, A, E_low]
  displayMode="fret"    // "fret" | "name"
  onNoteAdvance={fn}    // called when correct note played
  lookahead={9}         // columns visible ahead
  colWidth={52}         // px
/>
```

---

## metronome — built, needs porting to React

working implementation in prototype HTML.

pattern: kick 1, kick 3, kick 3& / snare 2, 4 / hats on 8ths
drum synthesis: kick (osc), snare (bandpass noise), hat (highpass noise)
scheduler: Web Audio API with 25ms lookahead, 16th-note resolution
visual: 4 rectangular cells, instant-on quarter beat highlight, 120ms fade
bar heights: kick 100%, snare 50%, hat 25% — additive teal opacity

---

## current state (as of project init)

- [x] spec written: docs/woodshed_spec_v0.2.md
- [x] wireframe written: docs/woodshed_wireframe_v0.2.md
- [x] tab component prototyped in HTML (see prototype)
- [x] metronome prototyped in HTML (see prototype)
- [ ] React project scaffolded
- [ ] tab component ported to React
- [ ] metronome ported to React
- [ ] app shell built
- [ ] exercise view wired
- [ ] note flash exercise v1
- [ ] pitch detection integrated
- [ ] AI trainer integrated

---

## development process

**one story at a time.**
stories are implemented individually, one per commit cycle. no simultaneous
multi-story work unless specifically agreed upon.

- each story must be completable on its own (dependencies are fine,
  simultaneous implementation of unrelated stories is not)
- before starting a story: state the issue number, title, and acceptance
  criteria. confirm what will be built, nothing more
- if a story cannot be implemented without also implementing another story,
  call it out before starting — propose either:
  (a) a dependency ordering, or
  (b) a revision to the story so it can stand alone
- commit message references the single issue being closed (e.g. `Closes #2`)
- stubs and placeholders from other stories are acceptable only as inert
  scaffolding (e.g. an empty slot, a disabled button) — they do not count
  as implementing those stories

**design quality gate.**
- stories with UI output require a visual spec (prototype or written spec)
  before implementation begins — see "design process" in design system section
- if a story has no visual spec, propose a prerequisite story to create one
- after implementation, run through the design QA checklist before committing
- never ship emoji icons, placeholder fonts, or inconsistent spacing

---

## github issues — epics

see GitHub Projects for full issue list.
epics:
- Woodshed App Shell
- Woodshed Metronome
- Note Flash Exercise
- Note Hunt Exercise (later)
- AI Trainer Integration
