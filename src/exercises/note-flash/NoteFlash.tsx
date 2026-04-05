// Note Flash exercise — Story #14
// Exercise shell: takes a challenge pool, shuffles it, renders FlashCard,
// handles correct/wrong, loops on pool exhaustion.
// Dev buttons simulate pitch detection — gated on import.meta.env.DEV.

import { useRef, useState, useCallback } from 'react'
import FlashCard, { type FlashCardHandle } from '../../components/flashcard/FlashCard'
import { buildLowEPool, type Challenge } from './pools'

// ─── Shuffle utility ─────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Component ───────────────────────────────────────────────────────────────

const pool = buildLowEPool()

export default function NoteFlash() {
  const [queue, setQueue] = useState<Challenge[]>(() => shuffle(pool))
  const [cursor, setCursor] = useState(0)
  const cardRef = useRef<FlashCardHandle>(null)

  const current = queue[cursor]

  const handleCorrect = useCallback(() => {
    const next = cursor + 1
    if (next >= queue.length) {
      setQueue(shuffle(pool))
      setCursor(0)
    } else {
      setCursor(next)
    }
  }, [cursor, queue.length])

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
      <FlashCard
        ref={cardRef}
        value={current.value}
        stringIndex={current.stringIndex}
        onCorrect={handleCorrect}
      />

      {/* Dev scaffolding — simulates pitch detection.
          Only in development builds. Not shipped to users. */}
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
