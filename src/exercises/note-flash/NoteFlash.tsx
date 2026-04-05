// Note Flash exercise — Story #14
// Renders the FlashCard component with a random shuffled sequence.
// Dev buttons simulate pitch detection — removed when Story #15 lands.
// Low E string, frets 0–11 (E through D#).

import { useRef, useState, useCallback } from 'react'
import FlashCard, { type FlashCardHandle } from '../../components/flashcard/FlashCard'

// ─── Sequence data ────────────────────────────────────────────────────────────

const LOW_E = 5 // string index: 0=high e, 5=low E

const FRET_POOL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
const NAME_POOL = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Component ───────────────────────────────────────────────────────────────

type Mode = 'fret' | 'name'

export default function NoteFlash() {
  const [mode, setMode] = useState<Mode>('fret')
  const [queue, setQueue] = useState<string[]>(() => shuffle(FRET_POOL))
  const [cursor, setCursor] = useState(0)

  const cardRef = useRef<FlashCardHandle>(null)

  const currentValue = queue[cursor]

  // Called by FlashCard after correct animation completes — advance to next note
  const handleCorrect = useCallback(() => {
    const next = cursor + 1
    if (next >= queue.length) {
      // Pool exhausted — re-shuffle for a new round
      const newPool = mode === 'fret' ? FRET_POOL : NAME_POOL
      setQueue(shuffle(newPool))
      setCursor(0)
    } else {
      setCursor(next)
    }
  }, [cursor, queue.length, mode])

  // Switch mode — reset with fresh shuffled pool
  function switchMode(m: Mode) {
    setMode(m)
    const newPool = m === 'fret' ? FRET_POOL : NAME_POOL
    setQueue(shuffle(newPool))
    setCursor(0)
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Mode selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          mode
        </span>
        {(['fret', 'name'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: '4px 12px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: mode === m ? 500 : 400,
              borderRadius: 0,
              border: '0.5px solid var(--color-border-secondary)',
              background: mode === m ? 'var(--color-text-primary)' : 'transparent',
              color: mode === m ? 'var(--color-background-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            {m === 'fret' ? 'fret → name' : 'name → fret'}
          </button>
        ))}
      </div>

      {/* Flash card */}
      <FlashCard
        ref={cardRef}
        value={currentValue}
        stringIndex={LOW_E}
        displayMode={mode}
        onCorrect={handleCorrect}
      />

      {/* Dev scaffolding — simulates pitch detection response.
          Only rendered in development builds. Not shipped to users. */}
      {import.meta.env.DEV && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => cardRef.current?.triggerWrong()}
            style={{
              flex: 1,
              padding: '8px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              borderRadius: 0,
              border: '0.5px solid rgba(200,80,80,0.35)',
              background: 'transparent',
              color: 'rgba(200,80,80,0.75)',
              cursor: 'pointer',
            }}
          >
            ✗ wrong
          </button>
          <button
            onClick={() => cardRef.current?.triggerCorrect()}
            style={{
              flex: 1,
              padding: '8px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              borderRadius: 0,
              border: '0.5px solid rgba(74,184,212,0.4)',
              background: 'transparent',
              color: '#4ab8d4',
              cursor: 'pointer',
            }}
          >
            ✓ correct
          </button>
        </div>
      )}
    </div>
  )
}
