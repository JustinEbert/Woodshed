# Woodshed

AI-powered personal practice trainer for musicians. Starting with guitar, instrument-agnostic by design.

The AI is the trainer, not a feature. It observes structured performance summaries, knows your history, and gives adaptive guidance in real time. The experience should feel like a knowledgeable teacher in the room — not a gamified quiz app.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS + shadcn/ui |
| Deployment | Vercel (PWA) |
| Audio | Web Audio API (local, on-device) |
| Speech | Web Speech API (local, on-device) |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Storage | localStorage / IndexedDB (user metrics + history) |

You supply your own Anthropic API key — it stays on your device.

---

## What it is

**Woodshed** is the first of three planned products:

| Product | Role |
|---------|------|
| Woodshed | AI personal practice trainer |
| Pocket | Rhythm internalization + group sync |
| Bandmate | AI jam partner |

---

## Architecture

### Exercise view is the primary canvas
The center of the app is the exercise view — it owns the primary area. The exercise decides what renders inside it. The app shell never imports exercise components directly.

### Metronome is global infrastructure
Always running. BPM and pattern are global state. All exercises and components subscribe to metronome state. Exposed via slide-up bottom drawer.

### AI trainer is optional / graceful fallback
- **Online:** full trainer experience — adaptive guidance after each rep
- **Offline:** trainer suspends, "offline — self-directed mode" shown — all exercises and metronome work fully

### Audio is always local
Pitch detection runs on-device via Web Audio API — never sent to any API. Only structured performance summaries are sent to Claude.

---

## Visual design

Dark, minimal, futuristic — automotive HUD aesthetic. Glanceable at arm's length while playing.

- Accent color: teal `#4ab8d4` — playhead arrows, beat pulse, hit ripple only
- No gradients, no drop shadows, no decorative effects
- Sharp corners on all grid/metronome elements
- Two font weights: 400 regular, 500 bold
- Monospace for all fret numbers and tab notation
- Animations: instant attack, fast decay — nothing lingers

---

## Project structure

```
src/
  components/
    tab/          # Scrolling tablature component
    metronome/    # Metronome drawer UI
    trainer/      # AI trainer text line + voice input
    shell/        # App shell (top bar, bottom bar, drawers)
  exercises/
    note-flash/   # Note Flash exercise
    note-hunt/    # Note Hunt exercise (later epic)
  state/          # Global state (metronome BPM, active exercise)
  audio/          # Web Audio API engine + pitch detection
  ai/             # Claude API integration + summary schema
docs/
  woodshed_spec_v0.2.md       # Source of truth
  woodshed_wireframe_v0.2.md  # Structure and interaction flows
  prototypes/
    woodshed_metronome_v6_backup.html  # Working HTML prototype
```

---

## Exercises

### Note Flash (v0.1)
Progressive fretboard literacy, string by string.

1. Low E string — fret numbers shown
2. Low E string — note names shown (E, F, F#...)
3. A string introduced, same two-phase pattern
4. Continues string by string
5. Multi-string exercises

### Note Hunt (later)
Find all instances of a given note across the fretboard. Pitch detection confirms hits.

---

## Getting started

```bash
npm install
npm run dev
```

Add your Anthropic API key in Settings (tap the gear icon). The app works fully offline without it — the AI trainer is the only cloud dependency.

---

## Status

- [x] Spec: `docs/woodshed_spec_v0.2.md`
- [x] Wireframe: `docs/woodshed_wireframe_v0.2.md`
- [x] HTML prototype: tab component + metronome
- [x] React project scaffolded (Vite + Tailwind + PWA)
- [ ] Tab component ported to React
- [ ] Metronome ported to React
- [ ] App shell built
- [ ] Note Flash exercise v1
- [ ] Pitch detection
- [ ] AI trainer integration

See [GitHub Issues](https://github.com/JustinEbert/Woodshed/issues) for the full roadmap.

---

*"Woodshedding" — the musician's term for disciplined, private, repetitive practice. That is the product.*
