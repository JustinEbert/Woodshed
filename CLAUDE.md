# Woodshed — Claude Code Briefing

## what this is

Woodshed is an AI-powered personal practice trainer for musicians.
Starting with guitar, instrument-agnostic by design.
The AI trainer observes performance, adapts, and guides — it is not a feature,
it is the product. Built with deliberate practice science as the foundation.

Full spec: `docs/woodshed_spec_v0.2.md`
Full wireframe: `docs/woodshed_wireframe_v0.2.md`
Design prototype: `docs/prototypes/woodshed_metronome_v6_backup.html`

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

## visual design rules — always follow these

- dark, minimal, futuristic — automotive HUD aesthetic
- glanceable: zero cognitive load while playing
- accent color: teal `#4ab8d4` — playhead arrows, beat pulse, hit ripple only
- no gradients, no drop shadows, no decorative effects
- sharp corners on all grid/metronome elements (border-radius: 0)
- two font weights only: 400 regular, 500 bold
- monospace for all fret numbers and tab notation
- animations: instant attack, fast decay — nothing lingers
- hit ripple is the one expressive animation — keep it physical and earned
- CSS variables for all colors (light/dark mode via prefers-color-scheme)

key CSS variables in use:
```css
--color-background-primary
--color-background-secondary
--color-text-primary
--color-text-secondary
--color-text-tertiary
--color-border-secondary
--color-border-tertiary
--font-mono
--font-sans
```

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

## github issues — epics

see GitHub Projects for full issue list.
epics:
- Woodshed App Shell
- Woodshed Metronome
- Note Flash Exercise
- Note Hunt Exercise (later)
- AI Trainer Integration
