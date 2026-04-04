# Woodshed — GitHub Issues

Paste these into GitHub manually, or feed this file to Claude Code with:
"Open these GitHub issues in the Woodshed repo"

Labels to create first:
  epic, story, task, bug, spike
  component:tab, component:metronome, component:ai-trainer, component:shell, component:audio
  priority:p0, priority:p1, priority:p2

---

## EPIC: App Shell

**Title:** [EPIC] App Shell
**Labels:** epic, component:shell, priority:p0
**Body:**
The persistent chrome of the Woodshed app. Includes top bar (beat pulse +
AI trainer line), bottom bar (exercise name, settings icon, metronome icon),
exercise view slot, and the slide-up drawer/sheet pattern used throughout.

Ref: docs/woodshed_spec_v0.2.md — primary components
Ref: docs/woodshed_wireframe_v0.2.md — practice view layout

Child stories:
- [ ] App shell layout + routing
- [ ] Top bar: beat pulse indicator
- [ ] Top bar: AI trainer text line (placeholder)
- [ ] Bottom bar: exercise name + navigation trigger
- [ ] Bottom bar: settings + metronome icons
- [ ] Exercise select sheet
- [ ] Settings screen

---

### STORY: App shell layout + routing

**Title:** [STORY] App shell layout + routing
**Labels:** story, component:shell, priority:p0
**Body:**
Scaffold the main React app layout. Practice view as the primary canvas.
Top bar (~36px), exercise view (flex-grow), bottom bar (~44px).
No routing library needed in v0.1 — state-driven view switching only.
Settings screen is a full-screen state replacement, not a route.
All other overlays (metronome drawer, exercise select) are sheet components.

Acceptance criteria:
- [ ] Practice view renders with correct three-section layout
- [ ] Exercise view slot accepts any child component
- [ ] Bottom bar present and fixed
- [ ] Top bar present and fixed
- [ ] Dark mode via prefers-color-scheme
- [ ] CSS variables defined per design system
- [ ] Responsive, mobile-first, max readable width ~600px

---

### STORY: Top bar — beat pulse indicator

**Title:** [STORY] Top bar — beat pulse indicator
**Labels:** story, component:shell, component:metronome, priority:p0
**Body:**
Small circle (~28px) left side of top bar. Teal fill (#4ab8d4), instant
attack on quarter beat, 400ms fade back to transparent. Subscribes to
global metronome state. Always visible when metronome is running.

Acceptance criteria:
- [ ] Circle renders in top bar left position
- [ ] Pulses on every quarter beat from metronome state
- [ ] Instant fill attack, 400ms CSS transition fade
- [ ] No pulse when metronome stopped
- [ ] Correct teal color, no border in active state

---

### STORY: Top bar — AI trainer text line (placeholder)

**Title:** [STORY] Top bar — AI trainer text line (placeholder)
**Labels:** story, component:shell, component:ai-trainer, priority:p0
**Body:**
Single line of text, right of beat pulse. Italic, tertiary color, truncated
with ellipsis. In v0.1 this is a static placeholder string. Tap triggers
voice input (Web Speech API). Offline state shows "offline — self-directed mode".

Acceptance criteria:
- [ ] Text line renders right of pulse circle
- [ ] Static placeholder text in v0.1
- [ ] Truncated with ellipsis if overflow
- [ ] Offline state text shown when no connection
- [ ] Tap target min 44px height
- [ ] Voice input scaffold (tap → Web Speech API start) — no AI call yet

---

### STORY: Bottom bar — exercise name + navigation trigger

**Title:** [STORY] Bottom bar — exercise name + navigation trigger
**Labels:** story, component:shell, priority:p0
**Body:**
Left side of bottom bar. Shows current exercise name (e.g. "Note Flash — Low E").
Tap opens exercise select sheet. ↕ icon hints at interaction.
Idle state: "tap to choose an exercise".

Acceptance criteria:
- [ ] Exercise name renders left-aligned in bottom bar
- [ ] Tap opens exercise select sheet
- [ ] ↕ affordance visible
- [ ] Idle state copy shown when no exercise active
- [ ] Updates when exercise changes

---

### STORY: Exercise select sheet

**Title:** [STORY] Exercise select sheet
**Labels:** story, component:shell, priority:p0
**Body:**
Slide-up sheet triggered from bottom bar exercise name. Shows AI suggestion
(highlighted, teal accent) at top, then full exercise list grouped by type.
"Soon" items visible but not tappable. Tap any exercise → sheet closes,
exercise loads. Sheet is scrollable.

Ref: docs/woodshed_wireframe_v0.2.md — exercise select sheet layout

Acceptance criteria:
- [ ] Sheet slides up from bottom with handle
- [ ] AI suggestion section at top (static placeholder in v0.1)
- [ ] Note Flash exercises listed and tappable
- [ ] Note Hunt exercises listed, marked soon, not tappable
- [ ] Tap loads exercise into exercise view, sheet closes
- [ ] Drag handle or tap handle to dismiss without selecting

---

### STORY: Settings screen

**Title:** [STORY] Settings screen
**Labels:** story, component:shell, priority:p0
**Body:**
Full screen replacement (not a drawer). Back navigation returns to practice
view with state fully preserved. Contains: API key entry (masked, edit button),
default BPM, About section. Metronome continues running while in settings.

Ref: docs/woodshed_wireframe_v0.2.md — settings screen layout

Acceptance criteria:
- [ ] Full screen with back nav (← settings)
- [ ] API key field: masked display, edit button, stored locally
- [ ] Default BPM field (startup value only — runtime in metronome drawer)
- [ ] About section: app name + version
- [ ] Back nav returns to practice view, exercise state preserved
- [ ] No bottom bar on settings screen
- [ ] Metronome keeps running in background

---

## EPIC: Metronome

**Title:** [EPIC] Metronome
**Labels:** epic, component:metronome, priority:p0
**Body:**
Global metronome infrastructure. Always running when active. BPM and pattern
are global state consumed by all exercises and components. Exposed via
slide-up bottom drawer. Ambient presence via beat pulse indicator and
tab component arrow pulse.

Pattern: kick 1, kick 3, kick 3& / snare 2, 4 / hats on 8ths
Visual design: v6 prototype in docs/prototypes/woodshed_metronome_v6_backup.html

Child stories:
- [ ] Audio engine + drum pattern synthesis
- [ ] Global metronome state
- [ ] Metronome drawer UI (v6 design)
- [ ] Ambient mode — bottom bar icon pulse

---

### STORY: Audio engine + drum pattern synthesis

**Title:** [STORY] Audio engine + drum pattern synthesis
**Labels:** story, component:metronome, component:audio, priority:p0
**Body:**
Web Audio API scheduler. 16th-note resolution, 25ms lookahead.
Drum synthesis: kick (oscillator + gain envelope), snare (bandpass noise),
hat (highpass noise). Pattern: kick steps 0,8,10 / snare 4,12 / hat all evens.
BPM range 40–200.

Ref: working implementation in docs/prototypes/woodshed_metronome_v6_backup.html

Acceptance criteria:
- [ ] AudioContext created on first user interaction (autoplay policy)
- [ ] Scheduler runs at 25ms intervals
- [ ] Kick: osc 150→40Hz, 0.7 gain, 120ms decay
- [ ] Snare: bandpass noise 1500Hz, 0.5 gain, 120ms decay
- [ ] Hat: highpass noise 9000Hz, 0.18 gain, 30ms decay
- [ ] Pattern fires correctly at all BPM values 40–200
- [ ] Clean stop without audio artifacts
- [ ] Quarter beat callback for visual sync

---

### STORY: Global metronome state

**Title:** [STORY] Global metronome state
**Labels:** story, component:metronome, priority:p0
**Body:**
React context or zustand store for metronome state. BPM, pattern, running/stopped,
current beat. All exercises and visual components subscribe. Changes propagate
immediately. Default BPM from settings (stored locally).

Acceptance criteria:
- [ ] BPM readable and writable from any component
- [ ] Running state readable from any component
- [ ] Current beat (0–3) emitted on each quarter note
- [ ] Default BPM loaded from local settings on startup
- [ ] BPM changes take effect within current bar (no jarring restart)

---

### STORY: Metronome drawer UI

**Title:** [STORY] Metronome drawer UI (v6 design)
**Labels:** story, component:metronome, component:shell, priority:p0
**Body:**
Slide-up drawer from bottom bar. Shows v6 metronome grid: 4 sharp-cornered
rectangular cells, each one quarter note. Drum pattern bars inside each cell
(kick/snare/hat as stacked teal bars, additive opacity). Quarter beat highlight:
instant attack, 120ms fade. BPM slider + ±1 ±5 buttons. Closing drawer does
NOT stop metronome.

Ref: docs/prototypes/woodshed_metronome_v6_backup.html — full working implementation
Ref: docs/woodshed_wireframe_v0.2.md — metronome drawer layout

Bar heights: kick 100%, snare 50%, hat 25%
Bar opacity: kick 0.80, snare 0.50, hat 0.25 (additive, max 1.0)
Cell highlight: color-mix(text-secondary 15%), border: text-primary

Acceptance criteria:
- [ ] Drawer slides up from bottom, handle to close
- [ ] 4 cells rendering correctly with drum pattern bars
- [ ] Quarter beat cell highlight fires on correct beat
- [ ] BPM slider functional, range 40–200
- [ ] ±1 and ±5 buttons functional
- [ ] Closing drawer keeps metronome running
- [ ] Drawer height ~200px, top bar visible above

---

## EPIC: Note Flash Exercise

**Title:** [EPIC] Note Flash Exercise
**Labels:** epic, priority:p0
**Body:**
Progressive fretboard literacy exercise. Tab component scrolls as user plays
correct notes. AI trainer observes and adapts. Progresses string by string,
then combines strings. Two display modes: fret numbers and note names.

Child stories:
- [ ] Tab component — React port
- [ ] Note Flash v1 — low E, fret numbers, simulated input
- [ ] Pitch detection integration
- [ ] Note Flash v2 — low E, note names
- [ ] Note Flash v3 — string progression logic
- [ ] Note Flash v4 — multi-string
- [ ] AI trainer integration for Note Flash

---

### STORY: Tab component — React port

**Title:** [STORY] Tab component — React port from HTML prototype
**Labels:** story, component:tab, priority:p0
**Body:**
Port the working tab component from the HTML prototype to a reusable React
component. All behavior must match the prototype exactly.

Ref: docs/prototypes/woodshed_metronome_v6_backup.html — source implementation

Behavior to port:
- Horizontally scrolling right-to-left on advance
- Current note left-anchored under dual teal playhead arrows
- Arrows positioned via getBoundingClientRect after render
- Arrows pulse on quarter beat (subscribes to metronome state)
- Hit ripple: two concentric teal rings expand from note position
- 80ms ease-out scroll, instant rebuild after
- 6 continuous string lines, low E 2px weight
- No dashes on empty strings
- fret number OR note name per displayMode prop
- No opacity fading on upcoming notes

Component interface:
```jsx
<TabComponent
  sequence={[]}         // array of 6-element arrays [e,B,G,D,A,E_low]
  displayMode="fret"    // "fret" | "name"
  onNoteAdvance={fn}    // called when advance() triggered
  lookahead={9}
  colWidth={52}
/>
```

Acceptance criteria:
- [ ] Renders 6 strings correctly, low E visually heavier
- [ ] Arrows centered over current note via DOM measurement
- [ ] Arrows pulse on quarter beat from metronome state
- [ ] Scroll fires correctly on advance()
- [ ] Hit ripple fires before scroll
- [ ] displayMode="fret" shows numbers
- [ ] displayMode="name" shows note letter names
- [ ] Works with simulated advance (Next button) before pitch detection

---

### STORY: Note Flash v1 — low E, fret numbers, simulated input

**Title:** [STORY] Note Flash v1 — low E fret numbers, simulated input
**Labels:** story, priority:p0
**Body:**
First shippable Note Flash exercise. Low E string only. Fret numbers shown.
User advances via "Next" button (simulates correct note played) until pitch
detection is integrated. Tab component scrolls on each advance.
Metronome plays in background. AI trainer line shows placeholder.

Exercise config:
- sequence: low E string, fret positions 0–5, random or ascending
- displayMode: "fret"
- strings: low E only (index 5)
- advance: manual (Next button) in v1

Acceptance criteria:
- [ ] Note Flash loads into exercise view from exercise select
- [ ] Tab component renders with low E sequence
- [ ] Next button advances tab correctly
- [ ] Hit ripple fires on each advance
- [ ] Metronome audio plays independently
- [ ] Exercise loops when sequence complete
- [ ] Exercise name shown in bottom bar

---

### STORY: Pitch detection integration

**Title:** [STORY] Pitch detection — Web Audio API local processing
**Labels:** story, component:audio, priority:p0
**Body:**
Local on-device pitch detection using Web Audio API. Detects fundamental
frequency from microphone input, maps to note + octave, compares against
expected note in active exercise. Never sends audio data externally.
Replaces the simulated "Next" button advance.

Acceptance criteria:
- [ ] Microphone permission requested on first use
- [ ] Pitch detected within 50ms of note onset
- [ ] Correct note identification across low E string (E2–A2 range)
- [ ] False positive rate acceptable at practice tempo
- [ ] onNoteAdvance() called when correct note detected
- [ ] No audio data sent externally — local processing only
- [ ] Graceful handling of no microphone permission

---

## EPIC: AI Trainer Integration

**Title:** [EPIC] AI Trainer Integration
**Labels:** epic, component:ai-trainer, priority:p1
**Body:**
Claude API integration for adaptive practice guidance. Receives structured
performance summaries after each rep. Responds with one line of guidance
in v0.1. User history stored in local JSON. Voice input via Web Speech API.
Fully graceful offline fallback.

Child stories:
- [ ] Local performance data storage (JSON)
- [ ] Performance summary schema + API call
- [ ] Trainer response display
- [ ] Voice input (Web Speech API)
- [ ] Offline graceful fallback
- [ ] Session history + context accumulation

---

### STORY: Local performance data storage

**Title:** [STORY] Local performance data storage — JSON
**Labels:** story, component:ai-trainer, priority:p1
**Body:**
Store performance summaries locally after each rep. Used as context for
AI trainer API calls and for tracking progress over time.

Summary schema:
```json
{
  "timestamp": "ISO8601",
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

Acceptance criteria:
- [ ] Summary written to localStorage (or IndexedDB) after each rep
- [ ] Schema matches spec exactly
- [ ] Last N summaries retrievable for API context window
- [ ] Data persists across sessions
- [ ] Clear/reset function available in settings

---

### STORY: Performance summary → Claude API call

**Title:** [STORY] Performance summary → Claude API call + trainer response
**Labels:** story, component:ai-trainer, priority:p1
**Body:**
After each rep (or configurable N reps), send structured performance summary
to Claude API. Display response as single line in trainer text line.
Uses user's own API key from settings. Graceful error handling.

API call: claude-sonnet-4-20250514, max_tokens 150 (one line response)
System prompt: defines trainer persona — warm, direct, adaptive, brief

Acceptance criteria:
- [ ] API call fires after rep with correct summary payload
- [ ] Response displayed in trainer text line
- [ ] API key from settings used (error if missing)
- [ ] Network error handled gracefully (no crash, fallback message)
- [ ] Response time acceptable (non-blocking — UI continues during call)
- [ ] Offline: no call attempted, offline state shown

---
