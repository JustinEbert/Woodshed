// Note Flash exercise — Stories #14 + #27 + #56
// Exercise shell: takes a challenge pool, shuffles it, renders FlashCard,
// handles correct/wrong, loops on pool exhaustion.
// Accepts two parallel inputs:
//   1. Pitch detection — play the note on guitar (#27)
//   2. Voice recognition — say the answer (#56)
// Fret challenges expect a spoken note name; note challenges expect a spoken fret number.

import { useRef, useState, useCallback, useEffect } from 'react'
import FlashCard, { type FlashCardHandle } from '../../components/flashcard/FlashCard'
import { buildLowEPool, type Challenge } from './pools'
import { matchNote } from './note-matching'
import { usePitchDetection, type PitchDetectionNote } from '../../audio/usePitchDetection'
import { useSpeechRecognition } from '../../audio/useSpeechRecognition'
import { parseSpokenNote, parseSpokenFret } from '../../audio/voice-vocabulary'
import { getNoteForFret, getFretForNote } from '../../audio/tuning'

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

// Number of consecutive matching emissions required before advancing.
// Each emission ≈ 46ms; total latency = medianWindow + sustainFrames frames.
const SUSTAIN_FRAMES = 2
const MIN_CONFIDENCE = 0.75
const MEDIAN_WINDOW  = 5
const MAX_CENTS_OFF  = 30

// ─── Component ───────────────────────────────────────────────────────────────

const pool = buildLowEPool()

export default function NoteFlash() {
  const [queue, setQueue] = useState<Challenge[]>(() => shuffle(pool))
  const [cursor, setCursor] = useState(0)
  const cardRef = useRef<FlashCardHandle>(null)

  // Latch: prevent re-triggering after the advance animation fires
  const correctLatchedRef = useRef(false)
  // Sustain counter — increments on matching emissions, resets on mismatch
  const sustainCountRef = useRef(0)

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

  // Reset latch + sustain counter whenever the challenge changes
  useEffect(() => {
    correctLatchedRef.current = false
    sustainCountRef.current = 0
  }, [cursor, queue])

  const handleNote = useCallback((note: PitchDetectionNote) => {
    const challenge = currentRef.current
    if (!challenge) return
    if (correctLatchedRef.current) return

    const result = matchNote(challenge, note.fullName)
    if (!result.correct) {
      // Wrong note → silent reset, no visual response
      sustainCountRef.current = 0
      return
    }

    sustainCountRef.current += 1
    if (sustainCountRef.current >= SUSTAIN_FRAMES) {
      correctLatchedRef.current = true
      sustainCountRef.current = 0
      cardRef.current?.triggerCorrect()
    }
  }, [])

  // ── Voice input — parallel to pitch detection (Story #56) ────────────

  const handleVoiceResult = useCallback((transcript: string) => {
    const challenge = currentRef.current
    if (!challenge) return
    if (correctLatchedRef.current) return

    const fretNum = Number(challenge.value)
    const isFretChallenge =
      Number.isFinite(fretNum) && Number.isInteger(fretNum)

    let correct = false

    if (isFretChallenge) {
      // Fret shown → user says note name
      const spokenNote = parseSpokenNote(transcript)
      if (spokenNote !== null) {
        const expectedNote = getNoteForFret(challenge.stringIndex, fretNum)
        correct = spokenNote === expectedNote
      }
    } else {
      // Note name shown → user says fret number
      const spokenFret = parseSpokenFret(transcript)
      if (spokenFret !== null) {
        const expectedFret = getFretForNote(
          challenge.stringIndex,
          challenge.value,
        )
        correct = spokenFret === expectedFret
      }
    }

    if (correct) {
      // Voice gives one discrete answer — no sustain counter needed
      correctLatchedRef.current = true
      sustainCountRef.current = 0
      cardRef.current?.triggerCorrect()
    }
    // Wrong / unrecognized → silent no-op (no penalty)
  }, [])

  const { start: voiceStart } = useSpeechRecognition({
    mode: 'exercise',
    onResult: handleVoiceResult,
    onError: () => {},  // Silent degradation
    autoRestart: true,  // Re-listen after each recognition result
  })

  const { listening, permission, start } = usePitchDetection({
    onNote: handleNote,
    minConfidence: MIN_CONFIDENCE,
    medianWindow:  MEDIAN_WINDOW,
    maxCentsOff:   MAX_CENTS_OFF,
  })

  // Start microphone + voice on mount
  useEffect(() => {
    start()
    voiceStart()
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

      {/* Permission / status line (#38) */}
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.05em',
          color: 'var(--color-text-tertiary)',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {permission === 'prompt' && 'allow microphone access to continue'}
        {permission === 'granted' && listening && 'listening'}
        {permission === 'denied' &&
          'Microphone blocked. Enable in Chrome settings → Site settings → Microphone.'}
        {permission === 'error' && 'microphone unavailable'}
      </div>

    </div>
  )
}
