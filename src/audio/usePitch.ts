// Microphone integration — Story #26
// React hook: getUserMedia → AnalyserNode → pitch polling → note state.
// Reusable audio infrastructure. No exercise-specific logic.
// All processing is local — no audio data sent externally.

import { useCallback, useEffect, useRef, useState } from 'react'
import { detectPitch } from './pitch-detection'
import { frequencyToNote, type DetectedNote } from './tuning'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'error'

export interface PitchState {
  /** Current detected note, or null if silence/noise */
  note: DetectedNote | null
  /** Whether microphone is active and polling */
  listening: boolean
  /** Permission state */
  permission: PermissionState
  /** Request microphone access and start listening */
  start: () => Promise<void>
  /** Stop listening and release microphone */
  stop: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FFT_SIZE = 4096  // ~93ms at 44100 Hz — enough cycles for E2 (82 Hz)

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePitch(): PitchState {
  const [note, setNote] = useState<DetectedNote | null>(null)
  const [listening, setListening] = useState(false)
  const [permission, setPermission] = useState<PermissionState>('prompt')

  // Refs for audio resources — survive across renders, cleaned up on stop/unmount
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const bufferRef = useRef<Float32Array | null>(null)
  const listeningRef = useRef(false)

  // ── Cleanup ────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    // Cancel animation frame polling
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    // Disconnect audio nodes
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    // Close audio context
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }

    // Stop all mic stream tracks
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }

    analyserRef.current = null
    bufferRef.current = null
    listeningRef.current = false
    setListening(false)
    setNote(null)
  }, [])

  // ── Polling loop ───────────────────────────────────────────────────────

  const poll = useCallback(() => {
    if (!listeningRef.current || !analyserRef.current || !bufferRef.current) return

    const analyser = analyserRef.current
    const buffer = bufferRef.current

    analyser.getFloatTimeDomainData(buffer)

    const result = detectPitch(buffer, analyser.context.sampleRate)
    if (result) {
      const detected = frequencyToNote(result.frequency)
      setNote(detected)
    } else {
      setNote(null)
    }

    rafRef.current = requestAnimationFrame(poll)
  }, [])

  // ── Start ──────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    // Already listening
    if (listeningRef.current) return

    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setPermission('granted')

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyserRef.current = analyser

      // Observation only — source → analyser, NOT connected to destination (no echo)
      source.connect(analyser)

      // Allocate buffer for time-domain data
      bufferRef.current = new Float32Array(analyser.fftSize)

      listeningRef.current = true
      setListening(true)

      // Start polling
      rafRef.current = requestAnimationFrame(poll)
    } catch (err) {
      // DOMException: Permission denied
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setPermission('denied')
      } else {
        setPermission('error')
      }
    }
  }, [poll, cleanup])

  // ── Stop ───────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    cleanup()
  }, [cleanup])

  // ── Unmount cleanup ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return { note, listening, permission, start, stop }
}
