// Global metronome state — Stories #10 + #9
// React context providing BPM, running/stopped, current beat (0-3).
// Audio engine (Web Audio API) drives both sound and beat emission.

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createAudioEngine, type AudioEngine } from '../audio/engine'

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_BPM = 90
export const MIN_BPM = 40
export const MAX_BPM = 200

const SETTINGS_KEY = 'woodshed:settings'

/** Clamp and round a BPM value to valid range. Pure function. */
export function clampBpm(bpm: number): number {
  return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)))
}

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

export function loadDefaultBpm(): number {
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

  // Ref for the audio engine — created once, persists across renders
  const engineRef = useRef<AudioEngine | null>(null)
  const bpmRef = useRef(bpm)

  // Keep BPM ref in sync + forward to engine
  bpmRef.current = bpm
  if (engineRef.current) {
    engineRef.current.setBpm(bpm)
  }

  // Lazily create the engine (once). The onQuarterBeat callback
  // updates React state so all subscribers re-render.
  function getEngine(): AudioEngine {
    if (!engineRef.current) {
      engineRef.current = createAudioEngine((quarterBeat: number) => {
        setBeat(quarterBeat)
      })
    }
    return engineRef.current
  }

  // ── BPM setter (clamped) ───────────────────────────────────────────────

  const setBpm = useCallback((next: number) => {
    const clamped = clampBpm(next)
    setBpmRaw(clamped)
  }, [])

  // ── Start / stop: delegate to audio engine ─────────────────────────────

  const start = useCallback(() => {
    const engine = getEngine()
    engine.start(bpmRef.current)
    setRunning(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop()
    }
    setRunning(false)
    setBeat(0)
  }, [])

  const toggle = useCallback(() => {
    if (engineRef.current?.isRunning()) {
      stop()
    } else {
      start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, stop])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.stop()
      }
    }
  }, [])

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
