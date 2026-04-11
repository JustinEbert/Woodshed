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
  `docs/prototypes/woodshed_flashcard_proto_v1.html`   ← flash card component (Story #20)

---

## tech stack

```
frontend:   React + Vite + Tailwind CSS + shadcn/ui
deployment: GitHub Pages (PWA) — https://justinebert.github.io/Woodshed/
            auto-deploys from main via .github/workflows/deploy.yml
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
    prototypes/                 ← working HTML prototypes (visual specs)
  src/
    components/
      flashcard/                ← flash card component (note challenge display)
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

**exercise view is the primary canvas.**
the center of the app is the exercise view — it owns the primary area.
the exercise decides what renders inside it (flash card, tab, note name, etc.).
the app shell (top/bottom bar, drawers) never imports exercise components directly.

**metronome is global infrastructure.**
always running. BPM and pattern are global state.
all exercises and components subscribe to metronome state.
never starts/stops per exercise — only the user controls it.
exposed via a slide-up bottom drawer.

**AI trainer is optional / graceful fallback.**
online: full trainer experience, claude API calls after each rep summary.
offline: trainer suspends, "offline — self-directed mode" shown in UI.
all exercises, metronome, pitch detection work fully offline.

**audio is always local.**
pitch detection runs on-device via Web Audio API — never sent to API.
only structured performance summaries are sent to claude API.

**voice is the primary user input to the trainer.**
player has guitar in hand — no keyboard input.
trainer text line is a voice trigger (Web Speech API).
tap to browse (exercise select sheet) is the fallback.

---

## supported platforms

these are the platforms Woodshed officially supports. new stories with UI
or audio output must be verified on all supported platforms before closing.

| platform | browser | install method | offline | status |
|----------|---------|----------------|---------|--------|
| Android (Pixel 9 Pro, Android 15) | Chrome (latest) | PWA — Add to Home Screen | full | **supported** |
| Desktop (macOS) | Chrome (latest) | browser tab | n/a (dev reference) | **supported** |

**offline support definition:** after one online visit, all exercises,
metronome, and pitch detection work with no network. the AI trainer
suspends and shows self-directed mode. voice input (Web Speech API)
degrades gracefully — not available offline on Android Chrome.

**not yet supported:**
- iOS / Safari (Web Audio API and PWA install behavior differ significantly)
- Firefox (no testing done)
- Windows desktop

when a story's acceptance criteria include platform verification, test
on all supported platforms listed above. if a platform is added here,
a QA story (like #40) should gate its entry before it's listed as supported.

---

## development process

### one story at a time

- one story per commit. one commit per story.
- state the issue number, title, and acceptance criteria before starting.
- confirm scope with the user before writing code.
- if a story depends on another, call it out. propose a dependency order
  or a revision so each story stands alone.
- stubs from other stories are acceptable only as inert scaffolding
  (an empty slot, a type definition). they do not count as implementing
  those stories.

### implementation discipline

- build ONLY what the acceptance criteria specify. nothing more.
- every line of code must trace to an acceptance criterion.
- if you discover needed work not in the acceptance criteria:
  - stop. do not build it.
  - propose updating the current story's acceptance criteria, OR
  - propose a new story for the discovered work.
  - wait for agreement before proceeding.
- do not add UI, logic, or scaffolding from other stories.
- do not combine stories into a single commit.

### completion protocol

after implementing a story, before committing:

1. list every acceptance criterion. mark each pass or fail.
2. list every file changed. each change must trace to an acceptance criterion.
3. if a change does not trace to an acceptance criterion, explain it or remove it.
4. confirm the acceptance criteria walkthrough with the user.
5. commit only after confirmation.
6. do not start the next story until the current one is committed.

### testing

- **pure logic modules** (tuning, audio, AI client, data transforms):
  always write tests. use TDD when practical — tests first, then
  implementation.
- **React components**: not required to have unit tests currently.
  revisit when component testing infrastructure is added.
- test files live next to the module: `foo.ts` → `foo.test.ts`.
- stories with testable logic should include test acceptance criteria
  (what to test, not how to test).
- `npm test` must pass before committing. if tests fail, fix them
  before proceeding.
- test runner: Vitest (`npm test` for single run, `npm run test:watch`
  for development).

### design quality gate

- stories with UI output require a visual spec (prototype or written spec)
  before implementation begins.
- if a prototype exists in `docs/prototypes/`, match it exactly.
- if no visual spec exists, propose a prerequisite story to create one.
- after implementation, verify against the design system:
  - fonts match the type scale
  - spacing uses only values from the spacing scale
  - colors use only CSS variable tokens
  - touch targets meet minimum 44px
  - animations follow the timing table
- never ship emoji icons, placeholder fonts, or inconsistent spacing.

---

## terminology

these terms have specific meanings. use them consistently.

| term | meaning |
|------|---------|
| **FlashCard** | React component (`src/components/flashcard/`). Stateless. Renders one note challenge. |
| **Flash Card** | Human-readable name for the FlashCard component in docs and stories. |
| **Note Flash** | The exercise (`src/exercises/note-flash/`). Owns sequence, progression, scoring. Uses FlashCard for display. |
| **TabComponent** | React component (`src/components/tab/`). Scrolling tablature display. |

---

## design system

### design philosophy

- dark, minimal, futuristic — automotive HUD aesthetic
- glanceable: zero cognitive load while playing
- every pixel intentional — no placeholder styling, no "good enough for now"
- if a prototype exists, it is the visual spec. match it exactly.
  do not deviate without discussion.

### design process — required before implementation

**no story with UI output shall be implemented without a visual spec.**

before writing any component code:

1. **check for a prototype** — if `docs/prototypes/` has an HTML file for this
   component, that is the visual spec. match it exactly.
2. **if no prototype exists**, the story must include or reference a visual spec
   that defines: layout dimensions, typography, spacing, interaction behavior,
   and responsive behavior.
3. **if the story lacks a visual spec**, create a prerequisite story to produce
   one before implementation.
4. **research before building** — review:
   - CSS variables and tokens
   - type scale and spacing scale
   - existing components for consistency
   - prototype HTML files for established patterns
5. **design QA after building** — verify:
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
--color-accent                 /* teal #4ab8d4 — sparingly */
```

accent color rules:
- reserved for interactive/rhythmic feedback only
- never for static decoration, backgrounds, or text
- allowed on: beat pulse dot, playhead arrows, active play button,
  hit ripple, drum pattern bars, active string indicator

### type scale

```
11px  — labels, captions, uppercase meta text (letter-spacing: 0.05em)
13px  — body text, button labels, secondary content
14px  — tab fret numbers (monospace only)
20px  — large numeric displays (BPM readout)
76px  — flash card display value (sans-serif, weight 500)
```

- **sans-serif** (`--font-sans`): all UI text, buttons, labels
- **monospace** (`--font-mono`): fret numbers, BPM display, numeric controls
- **two weights only**: 400 (regular) and 500 (medium)
- never use bold (700). italic only for the offline status message.
- all text uses color tokens, never raw values.

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

- horizontal page padding: 16px
- max content width: 600px, centered
- do not invent spacing values outside this scale

### component dimensions

```
top bar height:       36px
bottom bar height:    44px
beat cell height:     24px
flash card height:    120px
minimum touch target: 44px × 44px
beat pulse dot:       10px diameter
icon size:            20px (stroke icons)
drag handle:          32px × 3px, border-radius 2px
string strip width:   48px
string spacing:       14px
```

### icons

**no emoji icons.** all icons must be inline SVG.

- stroke-based, 20×20 viewBox, 1.5px stroke width
- `stroke="currentColor"`, `fill="none"`
- color inherited from parent via `currentColor`

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
| hit ripple           | 0ms (instant)   | 300ms ease-out        |
| flash correct        | 0ms (instant)   | 200ms ease-out (scale + teal) |
| flash wrong          | 0ms (instant)   | 280ms ease-out (shakeX + dim) |

- no hover effects on touch-first UI — `:active` only
- no spring/bounce animations
- no opacity fade-in for content (content appears instantly)

### buttons

two styles only:

**primary** (play/stop, main actions):
```
background: var(--color-text-primary)
color: var(--color-background-primary)
border: none
```
when active/toggled:
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
- font: `--font-sans`, 11px or 13px
- border-radius: 0 for grid context, 8px for standalone
- `:active { transform: scale(0.98) }`

### borders and dividers

- structural dividers (top bar, bottom bar): `0.5px solid var(--color-border-secondary)`
- beat cell borders: `1.5px solid var(--color-border-secondary)`
- flash card border: `0.5px solid var(--color-border-secondary)`
- subdivision lines: `1px, var(--color-border-tertiary)`
- no box-shadow anywhere

### sharp corners rule

- border-radius: 0 on all metronome cells, beat grid, tab elements, flash card
- border-radius: 8px on standalone buttons outside grid context
- border-radius: 2px on drag handle only
- rounded-full on beat pulse dot only

---

## flash card component

prototype: `docs/prototypes/woodshed_flashcard_proto_v1.html`

the FlashCard is a **stateless display component**. it renders one note
challenge and exposes animation triggers. it knows nothing about sequences,
progression, pitch detection, or exercise logic.

**what it renders:** string strip + large value. nothing else.
no buttons. no mode toggles. no controls.

display modes:
- **fret**: shows fret number. player must identify/play the note.
- **name**: shows note name. player must find/play the fret position.

the mode is a prop set by the parent exercise. it is not a user-facing control.

visual layout:
- centered unit: string strip (48px wide, 6 strings, 14px spacing) + value (76px)
- card: 120px height, border, no background fill
- active string: 2.5px teal. low E always 2.5px weight (same color as others when inactive).
- correct animation: scale(1.10) + teal flash, 200ms — on value element only
- wrong animation: shakeX + dim to tertiary, 280ms — on value element only, card stays
- flexbox centering only. no position:absolute centering (causes jump artifact).

React interface:
```tsx
// Parent exercise calls triggerCorrect/triggerWrong via ref
const cardRef = useRef<FlashCardHandle>(null)
cardRef.current.triggerCorrect()  // after pitch detection confirms correct note
cardRef.current.triggerWrong()    // after pitch detection detects wrong note

<FlashCard
  ref={cardRef}
  value="5"           // fret number or note name
  stringIndex={5}     // 0=high e, 5=low E
  displayMode="fret"  // "fret" | "name"
  onCorrect={fn}      // called after correct animation completes → advance
  onWrong={fn}        // called after wrong animation completes → stay
/>
```

architecture:
```
practice view → exercise view slot → Note Flash exercise → FlashCard
```
the app shell knows nothing about FlashCard directly.

---

## tab component — not yet ported to React

prototype: `docs/prototypes/woodshed_metronome_v6_backup.html`

scrolling tablature display. separate from and independent of FlashCard.

behavior:
- horizontally scrolling right-to-left
- current note left-anchored under dual teal playhead arrows
- arrows pulse on quarter beat from metronome
- hit ripple on correct play
- 80ms ease-out scroll transition on advance
- 6 strings, continuous unbroken lines, low E heavier (2px)
- fret numbers OR note names depending on exercise config
- all notes uniform opacity — no fading

---

## metronome — ported to React ✓

pattern: kick 1, kick 3, kick 3& / snare 2, 4 / hats on 8ths
drum synthesis: kick (osc), snare (bandpass noise), hat (highpass noise)
scheduler: Web Audio API with 25ms lookahead, 16th-note resolution
visual: 4 rectangular cells, instant-on quarter beat highlight, 120ms fade
bar heights: kick 100%, snare 50%, hat 25% — additive teal opacity

---

## github issues — epics

see GitHub for full issue list.
epics:
- Woodshed App Shell
- Woodshed Metronome
- Note Flash Exercise
- Note Hunt Exercise (later)
- AI Trainer Integration
- Android PWA Support (#35) — Pixel 9 Pro, offline-capable
