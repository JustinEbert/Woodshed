// Production pitch detection hook — Story #26 (rework)
// Implements the signal chain and tuned parameters from
// docs/woodshed_handoff_pitch_detection.md exactly.
//
// Signal chain:
//   mic → rawAnalyser (gate metering)
//       → HPF1 (70Hz, Q 0.707) → HPF2 (same) → gain (12×)
//       → analyser (YIN input) → [no destination]
//
// Callback API: onNote fires only on positive median-filtered detections.

import { useCallback, useEffect, useRef, useState } from 'react'
import { detectPitch } from './pitch-detection'
import {
  processFrame,
  createPipelineState,
  NOISE_GATE_DB,
  type PipelineOptions,
  type PipelineState,
  type PitchDetectionNote,
} from './pitch-pipeline'

// Re-export for backward compat — NoteFlash imports this type from here.
export type { PitchDetectionNote } from './pitch-pipeline'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UsePitchDetectionOptions extends PipelineOptions {
  onNote: (note: PitchDetectionNote) => void
}

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'error'

export interface UsePitchDetectionResult {
  listening: boolean
  permission: PermissionState
  start: () => Promise<void>
  stop: () => void
}

// ─── Web Audio constants ─────────────────────────────────────────────────────
// Pipeline logic constants (MIN_FREQ, MEDIAN_SIZE, etc.) live in pitch-pipeline.ts.

const SAMPLE_RATE = 44100
const FFT_SIZE    = 2048
const HPF_CUTOFF  = 70
const HPF_Q       = 0.707
const PRE_GAIN    = 12
// detectPitch's threshold is a confidence floor (1 - cmnd).
// Handoff specifies cmnd threshold 0.15, which equals confidence 0.85.
const YIN_THRESHOLD = 0.85

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Float32Array<ArrayBuffer> (not <ArrayBufferLike>) is required by the
// Web Audio API in TS 5.7+: getFloatTimeDomainData specifically excludes
// SharedArrayBuffer-backed views. Annotate explicitly so the refs below
// don't widen to ArrayBufferLike.
function getRmsDb(analyser: AnalyserNode, scratch: Float32Array<ArrayBuffer>): number {
  analyser.getFloatTimeDomainData(scratch)
  let sum = 0
  for (let i = 0; i < scratch.length; i++) sum += scratch[i] * scratch[i]
  const rms = Math.sqrt(sum / scratch.length)
  return rms > 0 ? 20 * Math.log10(rms) : -100
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePitchDetection(
  options: UsePitchDetectionOptions
): UsePitchDetectionResult {
  const [listening, setListening] = useState(false)
  const [permission, setPermission] = useState<PermissionState>('prompt')

  // Mirror permission state in a ref so async callbacks (start, change
  // handler) always see the latest value without stale closures.
  const permissionRef  = useRef<PermissionState>('prompt')
  const updatePermission = useCallback((state: PermissionState) => {
    permissionRef.current = state
    setPermission(state)
  }, [])

  // Stash latest callback in ref to avoid stale closures in polling loop
  const onNoteRef = useRef(options.onNote)
  useEffect(() => { onNoteRef.current = options.onNote }, [options.onNote])

  // Audio refs
  const audioCtxRef    = useRef<AudioContext | null>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const sourceRef      = useRef<MediaStreamAudioSourceNode | null>(null)
  const rawAnalyserRef = useRef<AnalyserNode | null>(null)
  const analyserRef    = useRef<AnalyserNode | null>(null)
  const yinBufferRef   = useRef<Float32Array<ArrayBuffer> | null>(null)
  const rawBufferRef   = useRef<Float32Array<ArrayBuffer> | null>(null)
  const pipelineStateRef = useRef<PipelineState>(
    createPipelineState({
      minConfidence: options.minConfidence,
      medianWindow:  options.medianWindow,
    }),
  )
  const rafRef         = useRef<number>(0)
  const listeningRef   = useRef(false)
  // Generation counter — incremented on every cleanup. start() captures
  // its generation and aborts at every async boundary if it has gone stale.
  // This survives React StrictMode's mount → cleanup → mount cycle.
  const generationRef  = useRef(0)

  // Permissions API change listener — stable ref so we can subscribe once
  // and the handler always calls the latest start/cleanup.
  const permStatusRef  = useRef<PermissionStatus | null>(null)
  const startRef       = useRef<() => Promise<void>>()

  // ── Cleanup ────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    // Bump generation so any in-flight start() aborts
    generationRef.current++
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop()
      streamRef.current = null
    }
    rawAnalyserRef.current = null
    analyserRef.current    = null
    yinBufferRef.current   = null
    rawBufferRef.current   = null
    pipelineStateRef.current.medianBuffer.length = 0
    listeningRef.current   = false
    setListening(false)
  }, [])

  // ── Polling loop ───────────────────────────────────────────────────────

  const poll = useCallback(() => {
    if (
      !listeningRef.current ||
      !analyserRef.current ||
      !rawAnalyserRef.current ||
      !yinBufferRef.current ||
      !rawBufferRef.current
    ) return

    const analyser    = analyserRef.current
    const rawAnalyser = rawAnalyserRef.current
    const yinBuffer   = yinBufferRef.current
    const rawBuffer   = rawBufferRef.current

    // Measure raw (pre-gain) RMS for noise gate
    const rawDb = getRmsDb(rawAnalyser, rawBuffer)

    // Run YIN on post-gain signal (skipped below the gate — pipeline will
    // reject-early, but we still need a yinResult or null as input)
    let yinResult: { frequency: number; confidence: number } | null = null
    if (rawDb >= NOISE_GATE_DB) {
      analyser.getFloatTimeDomainData(yinBuffer)
      yinResult = detectPitch(yinBuffer, analyser.context.sampleRate, YIN_THRESHOLD)
    }

    const out = processFrame(pipelineStateRef.current, { rawDb, yinResult })
    if (out.emittedNote) {
      onNoteRef.current(out.emittedNote)
    }

    rafRef.current = requestAnimationFrame(poll)
  }, [])

  // ── Permissions API integration (#38) ───────────────────────────────
  //
  // Before calling getUserMedia, query the Permissions API to learn
  // the current microphone permission state. This lets us:
  //   - Skip the "requesting" flash when permission is already granted
  //   - Show recovery guidance immediately when permission is denied
  //     (without wasting a getUserMedia call that would just fail)
  //   - Auto-recover if the user re-enables permission in Chrome
  //     settings while the app is open (via the change listener)
  //
  // Falls back to the old try-and-catch flow if the Permissions API
  // is unavailable (not expected on Android Chrome, but safe).

  const subscribeToPermissionChanges = useCallback(
    (status: PermissionStatus) => {
      if (permStatusRef.current) return // already subscribed
      permStatusRef.current = status
      status.addEventListener('change', () => {
        const s = permStatusRef.current
        if (!s) return
        if (s.state === 'granted') {
          updatePermission('granted')
          // Auto-start if not already listening
          if (!listeningRef.current) startRef.current?.()
        } else if (s.state === 'denied') {
          updatePermission('denied')
          cleanup()
        } else {
          updatePermission('prompt')
        }
      })
    },
    [updatePermission, cleanup],
  )

  // ── Start ──────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    if (listeningRef.current) return

    if (!navigator.mediaDevices?.getUserMedia) {
      updatePermission('error')
      return
    }

    const myGeneration = generationRef.current

    // ── 1. Query current permission state via Permissions API ─────────
    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query(
          { name: 'microphone' as PermissionName },
        )
        if (myGeneration !== generationRef.current) return

        // Subscribe to future changes (idempotent — only subscribes once)
        subscribeToPermissionChanges(status)

        if (status.state === 'denied') {
          // Don't waste a getUserMedia call — it would just throw
          // NotAllowedError. Show recovery guidance immediately.
          updatePermission('denied')
          return
        }

        if (status.state === 'granted') {
          // Set granted immediately so the component never flashes
          // "allow microphone access" on subsequent visits.
          updatePermission('granted')
        }
        // 'prompt' — leave the state as 'prompt'; the component shows
        // the "allow microphone access" message while the OS dialog
        // is open (getUserMedia below triggers the dialog).
      } catch {
        // Permissions API not supported for 'microphone' — fall through
        // to the old try-and-catch flow via getUserMedia.
      }
    }

    // ── 2. Acquire microphone ────────────────────────────────────────
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl:  false,
          sampleRate: SAMPLE_RATE,
        },
      })

      // Aborted by cleanup while we were awaiting?
      if (myGeneration !== generationRef.current) {
        for (const track of stream.getTracks()) track.stop()
        return
      }

      streamRef.current = stream
      updatePermission('granted')

      const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE })
      audioCtxRef.current = audioCtx
      // Some browsers create the context in 'suspended' until a gesture.
      // getUserMedia counts as one — resume explicitly to be safe.
      if (audioCtx.state === 'suspended') {
        try { await audioCtx.resume() } catch { /* ignore */ }
      }
      if (myGeneration !== generationRef.current) {
        audioCtx.close()
        for (const track of stream.getTracks()) track.stop()
        return
      }

      const source = audioCtx.createMediaStreamSource(stream)
      sourceRef.current = source

      // Raw analyser — pre-everything, for noise gate metering
      const rawAnalyser = audioCtx.createAnalyser()
      rawAnalyser.fftSize = FFT_SIZE
      rawAnalyser.smoothingTimeConstant = 0
      source.connect(rawAnalyser)
      rawAnalyserRef.current = rawAnalyser

      // Two-pole HPF (cascaded biquads = 12 dB/oct)
      const hpf1 = audioCtx.createBiquadFilter()
      hpf1.type = 'highpass'
      hpf1.frequency.value = HPF_CUTOFF
      hpf1.Q.value = HPF_Q

      const hpf2 = audioCtx.createBiquadFilter()
      hpf2.type = 'highpass'
      hpf2.frequency.value = HPF_CUTOFF
      hpf2.Q.value = HPF_Q

      // Pre-gain boost
      const gainNode = audioCtx.createGain()
      gainNode.gain.value = PRE_GAIN

      // Post-gain analyser — YIN input
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyser.smoothingTimeConstant = 0
      analyserRef.current = analyser

      // Wire it up — never connect to destination
      source.connect(hpf1)
      hpf1.connect(hpf2)
      hpf2.connect(gainNode)
      gainNode.connect(analyser)

      yinBufferRef.current = new Float32Array(analyser.fftSize)
      rawBufferRef.current = new Float32Array(rawAnalyser.fftSize)
      pipelineStateRef.current.medianBuffer.length = 0

      listeningRef.current = true
      setListening(true)

      rafRef.current = requestAnimationFrame(poll)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        updatePermission('denied')
      } else {
        updatePermission('error')
      }
    }
  }, [poll, updatePermission, subscribeToPermissionChanges])

  // Keep startRef in sync so the permission change handler can call
  // the latest version of start() without a stale closure.
  useEffect(() => { startRef.current = start }, [start])

  const stop = useCallback(() => { cleanup() }, [cleanup])

  useEffect(() => {
    return () => {
      cleanup()
      // Clear the permission listener ref so stale change events
      // from a prior mount cycle are ignored.
      permStatusRef.current = null
    }
  }, [cleanup])

  return { listening, permission, start, stop }
}
