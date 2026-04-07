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

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PitchDetectionNote {
  name: string       // "E", "F#"
  octave: number     // 2
  fullName: string   // "E2"
  midi: number       // 40
  freq: number       // 82.41
}

export interface UsePitchDetectionOptions {
  onNote: (note: PitchDetectionNote) => void
}

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'error'

export interface UsePitchDetectionResult {
  listening: boolean
  permission: PermissionState
  start: () => Promise<void>
  stop: () => void
}

// ─── Tuned constants (from handoff) ──────────────────────────────────────────

const SAMPLE_RATE       = 44100
const FFT_SIZE          = 2048
const HPF_CUTOFF        = 70
const HPF_Q             = 0.707
const PRE_GAIN          = 12
const NOISE_GATE_DB     = -60
// detectPitch's threshold is a confidence floor (1 - cmnd).
// Handoff specifies cmnd threshold 0.15, which equals confidence 0.85.
const YIN_THRESHOLD     = 0.85
const MIN_CONFIDENCE    = 0.70
const MIN_FREQ          = 70
const MAX_FREQ          = 1400
const MEDIAN_SIZE       = 5  // odd

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function freqToMidi(freq: number): number {
  return Math.round(12 * Math.log2(freq / 440) + 69)
}

function midiToNote(midi: number): PitchDetectionNote {
  const octave   = Math.floor(midi / 12) - 1
  const name     = NOTE_NAMES[((midi % 12) + 12) % 12]
  const freq     = 440 * Math.pow(2, (midi - 69) / 12)
  return { name, octave, fullName: name + octave, midi, freq }
}

function medianMidi(buffer: number[]): number {
  const sorted = [...buffer].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function getRmsDb(analyser: AnalyserNode, scratch: Float32Array): number {
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

  // Stash latest callback in ref to avoid stale closures in polling loop
  const onNoteRef = useRef(options.onNote)
  useEffect(() => { onNoteRef.current = options.onNote }, [options.onNote])

  // Audio refs
  const audioCtxRef    = useRef<AudioContext | null>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const sourceRef      = useRef<MediaStreamAudioSourceNode | null>(null)
  const rawAnalyserRef = useRef<AnalyserNode | null>(null)
  const analyserRef    = useRef<AnalyserNode | null>(null)
  const yinBufferRef   = useRef<Float32Array | null>(null)
  const rawBufferRef   = useRef<Float32Array | null>(null)
  const medianBufRef   = useRef<number[]>([])
  const rafRef         = useRef<number>(0)
  const listeningRef   = useRef(false)

  // ── Cleanup ────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
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
    medianBufRef.current   = []
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

    // Noise gate on RAW (pre-gain) signal
    const rawDb = getRmsDb(rawAnalyser, rawBuffer)
    if (rawDb < NOISE_GATE_DB) {
      medianBufRef.current = []
      rafRef.current = requestAnimationFrame(poll)
      return
    }

    // Run YIN on post-gain signal
    analyser.getFloatTimeDomainData(yinBuffer)
    const result = yinPitch(yinBuffer, analyser.context.sampleRate, YIN_THRESHOLD)

    if (result) {
      const { frequency: freq, confidence } = result
      if (
        freq >= MIN_FREQ &&
        freq <= MAX_FREQ &&
        confidence >= MIN_CONFIDENCE
      ) {
        const midi = freqToMidi(freq)
        const buf = medianBufRef.current
        buf.push(midi)
        if (buf.length > MEDIAN_SIZE) buf.shift()

        if (buf.length === MEDIAN_SIZE) {
          const note = midiToNote(medianMidi(buf))
          onNoteRef.current(note)
        }
      }
    }

    rafRef.current = requestAnimationFrame(poll)
  }, [])

  // ── Start ──────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    if (listeningRef.current) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl:  false,
          sampleRate: SAMPLE_RATE,
        },
      })
      streamRef.current = stream
      setPermission('granted')

      const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE })
      audioCtxRef.current = audioCtx

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
      medianBufRef.current = []

      listeningRef.current = true
      setListening(true)

      rafRef.current = requestAnimationFrame(poll)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setPermission('denied')
      } else {
        setPermission('error')
      }
    }
  }, [poll])

  const stop = useCallback(() => { cleanup() }, [cleanup])

  useEffect(() => {
    return () => { cleanup() }
  }, [cleanup])

  return { listening, permission, start, stop }
}
