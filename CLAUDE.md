# Woodshed

## references

- `docs/woodshed_spec_v0.2.md` is the source of truth for all decisions.
- `docs/prototypes/` are visual specs — match exactly when implementing.

## architecture

- **Exercise view owns the canvas.** App shell never imports exercise components.
- **Metronome is global.** Always running, user-controlled only. Slide-up drawer.
- **AI trainer degrades gracefully.** Offline = self-directed mode. All core features work offline.
- **Audio stays local.** Pitch detection on-device. Only structured summaries sent to API.
- **Voice is primary input.** Player holds guitar — no keyboard. Web Speech API.

## supported platforms

| platform | browser | status |
|----------|---------|--------|
| Android (Pixel 9 Pro, Android 15) | Chrome latest | **supported** |
| Desktop macOS | Chrome latest | **supported** |

New UI/audio stories must be verified on all supported platforms before closing.

## terminology

| term | meaning |
|------|---------|
| FlashCard | React component (`src/components/flashcard/`). Stateless display. |
| Flash Card | Human-readable name in docs and stories. |
| Note Flash | Exercise (`src/exercises/note-flash/`). Owns sequence, progression, scoring. |
| TabComponent | React component (`src/components/tab/`). Scrolling tablature. |
