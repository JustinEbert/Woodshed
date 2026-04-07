// Note Flash exercise — Stories #14 + #27
// Exercise shell: takes a challenge pool, shuffles it, renders FlashCard,
// handles correct/wrong, loops on pool exhaustion.
// Uses usePitchDetection hook for real guitar input via microphone.

import { useRef, useState, useCallback, useEffect } from 'react'
import FlashCard, { type FlashCardHandle } from '../../components/flashcard/FlashCard'
import { buildLowEPool, type Challenge } from './pools'
import { matchNote } from './note-matching'
import { usePitchDetection, type PitchDetectionNote } from '../../audio/usePitchDetection'

// ─── Shuffle utility ─────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WRONG_COOLDOWN_MS = 500

// ─── Component ───────────────────────────────────────────────────────────────

const pool = buildLowEPool()

export default function NoteFlash() {
  const [queue, setQueue] = useState<Challenge[]>(() => shuffle(pool))
  const [cursor, setCursor] = useState(0)
  const cardRef = useRef<FlashCardHandle>(null)

  // Latches: prevent re-triggering on sustained notes
  const correctLatchedRef = useRef(false)
  const lastWrongTimeRef = useRef(0)

  // Stash current challenge in a ref so the onNote callback (which is a
  // stable closure inside the hook) always sees the latest challenge.
  const currentRef = useRef<Challenge | null>(null)
  const current = queue[cursor]
  currentRef.current = current

  const handleCorrect = useCallback(() => {
    const next = cursor + 1
    if (next >= queue.length) {
      setQueue(shuffle(pool))
      setCursor(0)
    } else {
      setCursor(next)
    }
  }, [cursor, queue.length])

  // Reset the correct-latch whenever the challenge changes
  useEffect(() => {
    correctLatchedRef.current = false
  }, [cursor, queue])

  const handleNote = useCallback((note: PitchDetectionNote) => {
    const challenge = currentRef.current
    if (!challenge) return
    const result = matchNote(challenge, note.name)

    if (result.correct) {
      if (correctLatchedRef.current) return
      correctLatchedRef.current = true
      cardRef.current?.triggerCorrect()
    } else {
      const now = Date.now()
      if (now - lastWrongTimeRef.current < WRONG_COOLDOWN_MS) return
      lastWrongTimeRef.current = now
      cardRef.current?.triggerWrong()
    }
  }, [])

  const { listening, permission, start } = usePitchDetection({ onNote: handleNote })

  // Start microphone on mount
  useEffect(() => {
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      {/* Permission / status line */}
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.05em',
          color: 'var(--color-text-tertiary)',
          textAlign: 'center',
          minHeight: 16,
        }}
      >
        {permission === 'prompt' && 'requesting microphone…'}
        {permission === 'granted' && listening && 'listening'}
        {permission === 'denied' && 'microphone required for pitch detection'}
        {permission === 'error' && 'microphone unavailable'}
      </div>

    </div>
  )
}
