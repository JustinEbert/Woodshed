---
id: woodshed-spec
version: 0.2.0
status: draft
owner: justin
last_updated: 2026-04-03
platform: web-pwa  # React + Vite + Tailwind + shadcn/ui, deployed Vercel
ai_backend: claude-sonnet (anthropic api)
git_platform: github
doc_convention: >
  This file is terse and declarative. It captures high-level functional,
  technical, and design requirements plus critical architectural decisions.
  Detailed implementation specs, user stories, and bug tracking live in
  GitHub Issues and Projects. This file is the source of truth for
  generating those artifacts. Human and AI readable/editable.
  Iterate by appending or replacing sections — do not expand prose here.
  Open decisions are resolved at spec time, story time, or dev time —
  not held here as permanent blockers.
---

# Woodshed — product spec

## what it is

Woodshed is an AI-powered personal practice trainer for musicians.
It starts with guitar and is instrument-agnostic by design.
The name is deliberate: "woodshedding" is the musician's term for
disciplined, private, repetitive practice. That is the product.

The AI is the trainer, not a feature. It observes structured performance
summaries, knows the user's history, and gives adaptive guidance through
the UI. The experience should feel like a knowledgeable teacher in the
room — not a gamified quiz app.

## product suite context

Woodshed is the first of three products:

| product   | role                                              | status   |
|-----------|---------------------------------------------------|----------|
| Woodshed  | AI personal practice trainer                      | active   |
| pocket    | rhythm internalization + group sync               | planned  |
| bandmate  | AI jam partner (potential AR hardware component)  | planned  |

build order: Woodshed first — most self-contained, highest personal utility.

---

## users

primary: beginner-to-intermediate musicians practicing alone.
secondary: intermediate players wanting structured deliberate practice.

the app serves a user who:
- has an instrument in hand
- is learning to read and play tab (basic understanding assumed,
  deeper literacy developed through use of the app)
- wants to improve specific skills, not just play through songs
- benefits from a trainer that adapts to their actual performance

---

## AI trainer thesis

### what makes this different

most practice apps are content libraries with a play button.
Woodshed is a training system with an AI observer.

the AI trainer:
- receives structured performance summaries (not raw audio)
- all real-time audio/pitch detection runs locally on-device
- summaries are sent to the claude api after each rep or session
- in v0.1: trainer responds with one adaptive line of guidance in the UI
- longer term: the trainer interaction becomes more conversational,
  a back-and-forth dialogue that evolves across a practice session
- user history is stored in a local json file; this context travels with api calls
- the trainer can increase difficulty, suggest focus areas, celebrate streaks,
  flag recurring errors, and propose next exercises
- the trainer voice is conversational, warm, direct — never robotic or gamified

### deliberate practice foundation

design is grounded in deliberate practice science:
- targeted exercises with immediate feedback loops
- difficulty scales to just above current ability
- repetition with variation, not mindless repetition
- the metronome is infrastructure for timing awareness, not the product
- exercises are the product

### cost architecture

- user supplies their own anthropic api key (no subscription backend in v0.1)
- api calls are infrequent: one per rep summary, not per note
- local json stores metrics; summaries are compact structured objects

---

## primary components

### 1. tab component

reusable, configurable scrolling tablature display.
used across multiple exercise types with different configurations.

behavior:
- horizontally scrolling, right-to-left
- current note always left-anchored under the playhead gate
- advances on correct note played (or simulated via "next" in dev mode)
- dual teal arrows (top + bottom) form a gate/playhead — fixed in space
- arrows pulse on each quarter beat from the metronome
- hit ripple animation on correct note: ring expands from note position
- no fading of upcoming notes — uniform like real tab
- current note column: font-weight 500, primary color
- all 6 strings rendered as continuous unbroken lines
- low E string: heavier weight line (2px vs 1px) for orientation
- notes on unused strings: bare string line only, no dash, no placeholder
- columns left-aligned to exact 16th-note slot position

display modes (configured per exercise):
- fret numbers: standard tab notation, numeric fret position
- note names: alphabetic note names (e.g. E, F, G#) in place of fret numbers
  used in exercises focused on note identification and fretboard literacy
- mixed: may appear in advanced exercises (tbd)

non-goals for v0.1: chord diagrams, bends, slides, hammer-ons notation.

### 2. metronome component

always running. governs timing for the entire app.
global state: BPM + pattern consumed by tab component and all exercises.

two modes of presence:

**ambient** (default across the app):
- not visually present as its own panel
- beat expressed through tab component arrows pulsing
- audio (drum pattern) plays in the background

**expanded** (user-surfaced via persistent bottom drawer):
- slide-up panel reveals the full metronome view
- four sharp-cornered rectangular cells spanning full width
- each cell = one quarter note beat
- cells highlight on the quarter beat: instant attack, 120ms fade release
- 16th-note drum pattern visible inside cells as stacked bars:
  - kick: full height, 80% opacity (teal)
  - snare: 50% height, 50% opacity
  - hat: 25% height, 25% opacity
  - bars are additive opacity, single color, order-independent
- default pattern: kick 1, kick 3, kick 3&, snare 2, snare 4, hats on 8ths
- BPM control: slider + ±1 ±5 buttons, range 40–200
- collapsing the drawer keeps the metronome running

### 3. AI trainer text line

v0.1: single line of adaptive guidance, updated after each rep.
longer term: conversational exchange that evolves across a session.
sourced from claude api response to structured performance summary.
position: top of main view, right of beat pulse indicator.

interaction:
- tap → activates voice input (player has guitar in hand, no keyboard)
- voice is interpreted by the trainer: "try the A string", "slower", etc.
- tap to browse (exercise select sheet) is the fallback when voice
  is impractical (noisy room, public space)
- no keyboard input in v0.1

offline state: line shows "offline — self-directed mode" when no connection.
placeholder text until api integration is complete.

### 4. beat pulse indicator

small circle, top-left of main view.
teal fill, instant attack on quarter beat, 400ms fade.
secondary visual — tab arrows carry the primary pulse.
present even when metronome drawer is collapsed.

---

## exercise types

exercises are configurations of components — not separate pages.
the tab component is the primary reusable primitive.

### note flash (v0.1)

progressive fretboard literacy exercise, string by string.

progression:
1. low E string only — fret numbers shown, user plays the note
2. low E string only — note names shown (E, F, F#...), user plays the note
3. A string introduced, same two-phase pattern
4. continues string by string until full fretboard
5. multi-string exercises mixing learned strings

the tab component advances on correct note detection.
the AI trainer observes accuracy and timing, adapts difficulty and pacing.
scoring: deferred to a later story within this epic.

### note hunt (later epic)

find all instances of a given note across the fretboard.
the exercise presents a note name — the user plays every position
that produces that note. pitch detection confirms hits.
AI trainer tracks which positions the user consistently misses.

story progression (basic → advanced):
1. show note name only — user finds all instances, pitch detection confirms
2. add count feedback — "found 3 of 6" shown in exercise view
3. add fretboard map overlay — visualizes found/remaining positions
4. string constraints — hunt on one string only
5. time pressure — find all instances within N beats

the fretboard map is story 3, not story 1. story 1 is fully useful and
shippable on its own. map design is deferred until that story is prioritized.

---

## visual design requirements

### directive

automotive HUD. glanceable. zero cognitive load while playing.
the player's eyes are on their hands — the UI is peripheral.

### rules

- dark, minimal, futuristic aesthetic
- no gradients, no drop shadows, no decorative effects
- flat surfaces, sharp corners on grid elements
- 0.5px borders, `--color-border-secondary` default
- two font weights only: 400 regular, 500 bold
- monospace font for all fret numbers, note names, and tab notation
- color accent: teal `#4ab8d4` — playhead, pulse, hit animation only
- single accent color. no rainbow, no semantic color overload
- animations: instant attack, fast decay. nothing lingers. nothing bounces.
- hit ripple: the one expressive animation — earned, brief, physical

### layout

- expansive single-view design
- the center of the app is the exercise view — it owns the primary canvas
- the exercise view renders whatever the active exercise requires:
  a tab staff, a large note name, or anything else
- components like the tab component are used by exercises, not by the app shell
- metronome is ambient infrastructure — surfaces on demand via bottom drawer
- AI trainer text line always present, never dominant, tappable for input
- settings is a full-screen replacement (standard screen, not a drawer)
- all other overlays (metronome, exercise select) are slide-up sheets
- consistent interaction language: sheets slide up, settings goes full screen
- responsive: desktop and mobile supported
- mobile-first sizing: touch targets min 44px, tab readable at arm's length

### what this is not

- not a music streaming or content app
- not a gamified XP/badge system (v0.1)
- not a social/sharing app (v0.1)
- not a DAW or composition tool

---

## offline mode

the app works fully offline. the AI trainer is the only cloud dependency.

**online — full experience**
- AI trainer active: adaptive guidance, session history, exercise proposals
- performance summaries sent to claude api after each rep
- trainer responds with contextual guidance

**offline — self-directed practice**
- all exercises fully functional (tab component, pitch detection, metronome)
- exercise select sheet: browse and load any exercise manually
- metronome: fully functional
- AI trainer: suspended — trainer text line shows "offline" state clearly
- voice input: disabled (no trainer to receive it)
- tap to browse: fully available as navigation
- performance data: recorded locally during offline session
- sync: local data appended to trainer context on next connection

offline is not a degraded experience — it is self-directed practice mode.
the core product (exercises + metronome) requires no internet connection.

## technical requirements

### stack

```
frontend:   React + Vite + Tailwind CSS + shadcn/ui
deployment: Vercel (PWA)
audio:      Web Audio API (local, on-device)
speech:     Web Speech API (local, on-device)
ai:         Anthropic Claude API (claude-sonnet), user-supplied api key
storage:    local JSON file (user metrics + history)
```

note: Capacitor (native app distribution) is not in scope for v0.1.
revisit if PWA capabilities prove insufficient on mobile.

### audio architecture

- all real-time audio processing is local (Web Audio API)
- pitch detection runs on-device — never sent to api
- structured performance summaries sent to claude api:
  ```json
  {
    "exercise": "note_flash",
    "display_mode": "fret_number | note_name",
    "note": "E2",
    "fret": 0,
    "string": "low_e",
    "response_time_ms": 420,
    "beat_accuracy_ms": -35,
    "correct": true
  }
  ```
- api call frequency: once per rep summary or session end, not per note

### metronome engine

- web audio api scheduler with 25ms lookahead
- sixteenth-note resolution internal clock
- drum synthesis: kick (osc + gain), snare (bandpass noise), hat (highpass noise)
- BPM range: 40–200
- global state: BPM + pattern consumed by tab component and all exercises

### tab component interface (provisional)

```js
<TabComponent
  sequence={[]}        // array of note objects: { strings: [e,B,G,D,A,E], display: 'fret'|'name' }
  bpm={90}             // from global metronome state
  onNoteAdvance={fn}   // called when user plays correct note
  lookahead={9}        // columns visible ahead of playhead
  colWidth={52}        // px
/>
```

---

## github epic + story structure

```
epic: ai trainer
  story: api integration + key management
  story: performance summary schema
  story: trainer response display (v0.1 single line)
  story: session history + local json storage
  story: conversational trainer (post v0.1)

epic: note flash exercise
  story: tab component — fret number mode, low E string
  story: tab component — note name mode, low E string
  story: pitch detection integration
  story: string-by-string progression logic
  story: multi-string exercises
  story: AI trainer integration for note flash
  story: scoring system (deferred)

epic: note hunt exercise
  story: fretboard map component design
  story: note hunt core mechanic
  story: AI trainer integration for note hunt

epic: metronome
  story: audio engine + drum pattern
  story: expanded metronome UI (v6 design)
  story: global BPM state + app integration
  story: ambient mode (arrows in tab component)

epic: app shell
  story: main view layout (expansive single canvas)
  story: metronome bottom drawer
  story: beat pulse indicator
  story: AI trainer text line placeholder + live
  story: user settings (api key entry)
```

issue taxonomy:
- `epic` `story` `task` `bug` `spike`
- component labels: `component:tab` `component:metronome` `component:ai-trainer` `component:shell`
- priority: `p0` `p1` `p2`
- status managed via github projects board

---

## changelog

| version | date       | changes                                              |
|---------|------------|------------------------------------------------------|
| 0.1.0   | 2026-04-03 | initial draft                                        |
| 0.2.0   | 2026-04-03 | tab literacy intent; note name display mode added;   |
|         |            | capacitor deferred; epic/story structure revised;    |
|         |            | scoring deferred; open decisions section removed;    |
|         |            | trainer conversation scope clarified                 |
| 0.2.1   | 2026-04-03 | note hunt redefined: fretboard map is story 3 not   |
|         |            | story 1; basic implementation is note name only;     |
|         |            | layout section updated to remove map reference       |
| 0.2.2   | 2026-04-03 | offline mode defined; AI input changed to voice +   |
|         |            | tap only (no keyboard); trainer line updated;        |
|         |            | offline section added                                |
