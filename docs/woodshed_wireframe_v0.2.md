---
id: woodshed-wireframe
version: 0.2.1
status: draft
owner: justin
last_updated: 2026-04-03
related_spec: woodshed_spec_v0.2.md
doc_convention: >
  Structural and interaction design. ASCII layout diagrams are schematic,
  not pixel-perfect. Annotations reference spec component definitions.
  Iterate independently of the spec. Same YAML+markdown format for
  git-diffability and AI readability.
  Layouts use fixed-width characters: each char ≈ one grid unit.
  [ ] = component region. --> = user action flow. (*) = interaction note.
---

# Woodshed — wireframe v0.2.2

## navigation model

three equally valid paths to change exercise — all coexist:

**path 1: AI trainer directs**
the trainer proposes, describes, and loads exercises automatically.
this is the default and primary path. no user taps required.
the trainer can also respond to natural language from the user:
"let's try the A string" or "something harder" → trainer loads it.

**path 2: user tells the AI**
user types or speaks to the trainer text line.
trainer interprets and loads the appropriate exercise.
same AI-forward experience, user-initiated.

**path 3: user browses manually**
user taps the exercise name in the bottom bar.
exercise select sheet slides up — full browsable list.
user taps to load. bypasses the AI entirely if desired.

all three paths load exercises into the same practice view canvas.
navigation is never page-based — the canvas reconfigures.

---

## views + states

```
┌─────────────────────────────────┐
│         PRACTICE VIEW           │  ← primary / default (always present)
├─────────────────────────────────┤
│      METRONOME DRAWER           │  ← slides up over practice view
├─────────────────────────────────┤
│      EXERCISE SELECT SHEET      │  ← slides up over practice view
├─────────────────────────────────┤
│      SETTINGS SCREEN            │  ← full screen replacement
└─────────────────────────────────┘
```

drawer/sheet pattern (slides up, partial overlay):
  metronome drawer, exercise select sheet

full screen replacement:
  settings screen only

the exercise view (center of practice view) renders whatever the active
exercise requires. no specific components are pre-allocated to that slot
at the architecture level. components are the exercise's business.

---

## practice view — layout

primary canvas. user spends ~90% of time here.

```
┌─────────────────────────────────────────────┐
│  [● PULSE]  [AI TRAINER TEXT / INPUT ·····] │  ← top bar ~36px
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│           [EXERCISE VIEW]                   │  ← active exercise owns
│                                             │     this entire area.
│                                             │     exercise decides what
│                                             │     renders here.
│                                             │
│  example: note flash                        │
│  (uses tab component internally)            │
│         ▼  (teal playhead gate)             │
│  ──────────────────────────────────────     │
│  ──────────────────────────────────────     │
│  ──────────────────────────────────────     │
│  ──────────────────────────────────────     │
│  ══════════════════════════════════════     │  ← low E (bold)
│         ▲                                   │
│                                             │
│  example: note hunt (basic)                 │
│  (just a note name — exercise decides)      │
│                                             │
│              [ E ]                          │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  [EXERCISE NAME ↕]          [⚙]  [≡]       │  ← bottom bar ~44px
└─────────────────────────────────────────────┘
                    │
               (swipe up or tap ≡)
                    ▼
             METRONOME DRAWER
```

the exercise view is the primary frame. it is not defined by any one
component — it is defined by whichever exercise is active. that exercise
renders whatever UI it needs: a tab staff, a large note name, a chord
diagram, or something not yet imagined. the top bar, bottom bar, and
drawers are persistent chrome that never change.

### top bar

```
[● PULSE]
- circle ~28px, teal fill
- instant attack on quarter beat, 400ms fade
- always visible when metronome is running

[AI TRAINER TEXT / INPUT]
- primary state: one line of trainer guidance (italic, tertiary color)
- secondary state: text input active (user typing to trainer)
- tap the line → activates text input
- trainer response replaces the line after api call
- truncated with ellipsis if too long; tap to expand (post v0.1)
```

### bottom bar

```
[EXERCISE NAME ↕]
- current exercise name, e.g. "note flash — low E"
- tap → exercise select sheet slides up
- ↕ hints at slide-up interaction

[⚙]  settings icon
- tap → navigates to settings screen (full screen)

[≡]  metronome icon
- tap → metronome drawer slides up
- icon pulses subtly on the beat when drawer is collapsed
```

### practice view states

```
STATE: idle
- exercise view: empty, minimal
- AI trainer: "ready — tap the exercise name or tell me what you want to work on"
- metronome: off

STATE: exercise active
- exercise view: renders active exercise UI
- AI trainer: updates after each rep
- beat pulse: on, synced to metronome

STATE: exercise complete
- AI trainer: summary + next suggestion (with inline [yes] / [browse] action)
- exercise view holds last position, metronome continues

STATE: AI input active
- top bar text line becomes an input field
- keyboard slides up (mobile)
- trainer responds, input collapses back to text line
```

---

## metronome drawer — layout

slides up. overlays practice view. exercise continues running.

```
┌─────────────────────────────────────────────┐
│  [● PULSE]  [AI TRAINER TEXT ············]  │  ← visible behind drawer
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  ← dimmed overlay
│                                             │
├─────────────────────────────────────────────┤  ← drawer handle ────
│                                             │
│  [ BEAT 1 ][ BEAT 2 ][ BEAT 3 ][ BEAT 4 ]  │  ← v6 quarter-beat grid
│   24px tall cells, teal drum pattern bars   │
│   instant-on highlight, 120ms fade release  │
│                                             │
│  [−5][−1] ────────●──────────── [+1][+5]   │  ← BPM slider
│                  90 bpm                     │
│                                             │
└─────────────────────────────────────────────┘

(*) drawer height ~200px. top bar and partial exercise area visible above.
(*) drag handle or tap handle to close.
(*) closing does NOT stop the metronome.
(*) BPM changes take effect immediately app-wide.
```

---

## exercise select sheet — layout

slides up. full browsable exercise list.
AI suggestion highlighted at top.

```
├─────────────────────────────────────────────┤  ← sheet handle ────
│                                             │
│  AI SUGGESTS                                │
│  ┌─────────────────────────────────────┐    │
│  │ ▶  note flash — low E, note names   │    │  ← highlighted, teal accent
│  └─────────────────────────────────────┘    │
│                                             │
│  NOTE FLASH                                 │
│  ┌─────────────────────────────────────┐    │
│  │  low E — fret numbers               │    │
│  │  low E — note names                 │    │
│  │  A string — fret numbers            │    │
│  │  A string — note names              │    │
│  │  multi-string — fret numbers        │    │
│  │  multi-string — note names          │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  NOTE HUNT                          soon    │
│  ┌─────────────────────────────────────┐    │
│  │  low E                       (soon) │    │
│  │  full fretboard              (soon) │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘

(*) tap any exercise → sheet closes, exercise loads.
(*) "soon" items visible, not tappable.
(*) sheet scrollable as exercise list grows.
(*) no search in v0.1.
```

---

## settings screen — layout

full screen replacement. standard nav back to practice view.

```
┌─────────────────────────────────────────────┐
│  ←  settings                                │  ← back nav, ~44px
├─────────────────────────────────────────────┤
│                                             │
│  AI TRAINER                                 │
│  ┌─────────────────────────────────────┐    │
│  │  API key                            │    │
│  │  [●●●●●●●●●●●●●●●●●●]   [edit]     │    │
│  │                                     │    │
│  │  * your own anthropic key required  │    │
│  │  * stored locally, never shared     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  METRONOME                                  │
│  ┌─────────────────────────────────────┐    │
│  │  Default BPM         [90]           │    │
│  │  (* runtime BPM: metronome drawer)  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ABOUT                                      │
│  ┌─────────────────────────────────────┐    │
│  │  Woodshed  v0.1                     │    │
│  │  built with claude                  │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘

(*) back nav returns to practice view, exercise state preserved.
(*) no bottom bar on settings screen — clean, focused.
(*) metronome continues running while in settings.
```

---

## interaction flows

### flow 1: first launch (AI-directed)

```
app opens → practice view: idle
  → AI trainer: "let's start with open strings on low E — ready?"
  → [yes] inline action in trainer line
  → exercise loads: note flash — low E, fret numbers
  → metronome starts, beat pulse activates
  → user plays notes → exercise advances → hit ripple
  → after sequence: AI trainer updates with observation + next suggestion
```

### flow 2: user tells the AI

```
exercise active or idle
  → user taps trainer text line → input activates
  → user types "let's try the A string"
  → trainer interprets → loads: note flash — A string, fret numbers
  → exercise loads, input collapses back to text line
```

### flow 3: user browses manually

```
any state
  → user taps exercise name in bottom bar
  → exercise select sheet slides up
  → user taps desired exercise
  → sheet closes, exercise loads
  → metronome and trainer continue uninterrupted
```

### flow 4: adjust tempo mid-practice

```
exercise active
  → user taps ≡ in bottom bar
  → metronome drawer slides up (exercise continues)
  → user adjusts BPM slider
  → exercise and audio respond immediately
  → user swipes drawer down or taps handle
  → returns to practice view at new tempo
```

### flow 5: navigate to settings

```
any state
  → user taps ⚙ in bottom bar
  → settings screen replaces practice view (full screen)
  → metronome continues running
  → user edits API key or default BPM
  → user taps ← back
  → returns to practice view, exercise state preserved
```

---

## component interaction map

```
global metronome state (BPM, pattern, running/stopped)
    │
    ├──→ exercise view (beat timing, any metronome-aware components within)
    ├──→ beat pulse indicator (circle flash)
    ├──→ metronome drawer (displays + edits)
    └──→ bottom bar ≡ icon (subtle pulse)

AI trainer state (message, session history, suggested exercise)
    │
    ├──→ trainer text line (displays message)
    ├──→ trainer text line (accepts user input)
    ├──→ exercise select sheet (highlighted suggestion)
    └──→ inline [yes] action (loads suggested exercise directly)

active exercise state (type, config, progress)
    │
    ├──→ exercise view (renders exercise UI — its own business)
    ├──→ pitch detection (listens for correct note/input)
    ├──→ AI trainer (receives performance summary on each rep)
    └──→ exercise name in bottom bar (displays current exercise)

settings state (api key, default BPM)
    │
    ├──→ AI trainer (api key for calls)
    └──→ metronome (default BPM on launch)
```

---

## resolved design decisions

**AI input UX — voice + tap only, no keyboard**
player has a guitar in hand. voice is the primary input to the trainer.
tap to browse (exercise select sheet) is the fallback for noisy environments.
the trainer text line is a voice trigger, not a text field.

**inline [yes] action — tap the suggestion**
no separate button. the highlighted trainer suggestion is itself tappable.
tapping it loads the exercise directly.

**tablet/desktop layout — single column, max-width ~600px**
same layout as mobile, centered. exercise view benefits from focus not sprawl.
revisit when trainer history panel is designed (post v0.1).

**exercise state on settings navigate — full preserve**
metronome keeps running, exercise holds position.
player returns from settings and picks up exactly where they left off.

**offline mode — self-directed practice**
all local functionality works offline: exercises, metronome, pitch detection,
hit animation, exercise select, settings.
AI trainer suspends gracefully — trainer text line shows offline state.
performance data recorded locally during offline session.
data synced to trainer context on next connection.
offline is not a degraded experience — it is self-directed practice mode.

see spec for offline mode detail.

---

## changelog

| version | date       | changes                                             |
|---------|------------|-----------------------------------------------------|
| 0.1.0   | 2026-04-03 | initial draft                                       |
| 0.2.0   | 2026-04-03 | three-path nav model; settings → full screen;       |
|         |            | fretboard map roughed in; AI input on trainer line; |
|         |            | flows updated; interaction map expanded             |
| 0.2.1   | 2026-04-03 | fretboard map removed as architectural element;     |
|         |            | note hunt basic example shown as simple note name;  |
|         |            | exercise view framing clarified throughout          |
| 0.2.2   | 2026-04-03 | open design questions resolved: voice input,        |
|         |            | tap-to-confirm, single column layout, full state    |
|         |            | preserve on settings, offline mode defined          |
