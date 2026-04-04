// Global metronome state — Story #10
// React context providing BPM, running/stopped, current beat (0-3).
// Uses a simple setTimeout clock for beat emission.
// Story #9 (audio engine) will replace the clock with Web Audio scheduler.

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_BPM = 90
export const MIN_BPM = 40
export const MAX_BPM = 200

const SETTINGS_KEY = 'woodshed:settings'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MetronomeState {
  bpm: number
  running: boolean
  /** Current quarter-note beat: 0, 1, 2, or 3 */
  beat: number
}

interface MetronomeActions {
  setBpm: (bpm: number) => void
  start: () => void
  stop: () => void
  toggle: () => void
}

type MetronomeContextValue = MetronomeState & MetronomeActions

// ─── Local settings persistence ──────────────────────────────────────────────

function loadDefaultBpm(): number {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const bpm = parsed?.defaultBpm
      if (typeof bpm === 'number' && bpm >= MIN_BPM && bpm <= MAX_BPM) {
        return bpm
      }
    }
  } catch {
    // Corrupt or missing — fall through to default
  }
  return DEFAULT_BPM
}

// ─── Context ─────────────────────────────────────────────────────────────────

const MetronomeContext = createContext<MetronomeContextValue | null>(null)

export function useMetronome(): MetronomeContextValue {
  const ctx = useContext(MetronomeContext)
  if (!ctx) {
    throw new Error('useMetronome must be used within <MetronomeProvider>')
  }
  return ctx
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface MetronomeProviderProps {
  children: ReactNode
}

export function MetronomeProvider({ children }: MetronomeProviderProps) {
  const [bpm, setBpmRaw] = useState<number>(loadDefaultBpm)
  const [running, setRunning] = useState(false)
  const [beat, setBeat] = useState(0)

  // Refs for the clock loop to read latest values without re-subscribing
  const bpmRef = useRef(bpm)
  const runningRef = useRef(running)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep refs in sync
  bpmRef.current = bpm
  runningRef.current = running

  // ── BPM setter (clamped) ───────────────────────────────────────────────

  const setBpm = useCallback((next: number) => {
    const clamped = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(next)))
    setBpmRaw(clamped)
    // BPM change takes effect on the next beat — no jarring restart
  }, [])

  // ── Clock: simple setTimeout loop ──────────────────────────────────────
  // Fires on each quarter note. Story #9 replaces this with Web Audio
  // scheduler for sample-accurate timing. This is sufficient for visual
  // sync and state emission.

  useEffect(() => {
    if (!running) {
      // Stopped — clear any pending timer, reset beat to 0
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setBeat(0)
      return
    }

    // Running — start the beat loop
    let currentBeat = 0
    setBeat(0)

    function tick() {
      // Advance beat
      currentBeat = (currentBeat + 1) % 4
      setBeat(currentBeat)

      // Schedule next tick at current BPM (reads ref so BPM changes
      // take effect within current bar without restart)
      const msPerBeat = 60_000 / bpmRef.current
      timerRef.current = setTimeout(tick, msPerBeat)
    }

    // First beat is immediate (beat 0 set above), schedule beat 1
    const msPerBeat = 60_000 / bpmRef.current
    timerRef.current = setTimeout(tick, msPerBeat)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [running])

  // ── Actions ────────────────────────────────────────────────────────────

  const start = useCallback(() => setRunning(true), [])
  const stop = useCallback(() => setRunning(false), [])
  const toggle = useCallback(() => setRunning(r => !r), [])

  // ── Context value ──────────────────────────────────────────────────────

  const value: MetronomeContextValue = {
    bpm,
    running,
    beat,
    setBpm,
    start,
    stop,
    toggle,
  }

  return (
    <MetronomeContext.Provider value={value}>
      {children}
    </MetronomeContext.Provider>
  )
}
