// Pitch detection pipeline — Story #29
// Pure state machine extracted from usePitchDetection.
// No React, no Web Audio — takes per-frame inputs, returns per-frame decisions.
//
// Pipeline: noise gate → YIN (done upstream) → range filter →
//           confidence filter → median filter → emit.
//
// Tests: pitch-pipeline.test.ts

// ─── Types ───────────────────────────────────────────────────────────────────

/** One median-filtered detected note. */
export interface PitchDetectionNote {
  name: string       // "E", "F#"
  octave: number     // 2
  fullName: string   // "E2"
  midi: number       // 40
  freq: number       // 82.41
}

/** Pipeline state carried across frames. Mutated in place by processFrame. */
export interface PipelineState {
  /** Rolling buffer of MIDI integers — median filter operates in semitone space */
  medianBuffer: number[]
  /** Per-instance minimum YIN confidence */
  minConfidence: number
  /** Per-instance median window size (odd) */
  medianWindow: number
}

export interface PipelineOptions {
  /** Minimum YIN confidence (0–1). Default 0.75. */
  minConfidence?: number
  /** Median window size. Must be odd. Default 5. */
  medianWindow?: number
}

export function createPipelineState(opts?: PipelineOptions): PipelineState {
  const minConfidence = opts?.minConfidence ?? MIN_CONFIDENCE
  const medianWindow  = opts?.medianWindow  ?? MEDIAN_SIZE
  if (medianWindow % 2 === 0) {
    throw new Error(`medianWindow must be odd, got ${medianWindow}`)
  }
  return { medianBuffer: [], minConfidence, medianWindow }
}

/** Inputs for one analysis frame. */
export interface PipelineFrameInput {
  /** Raw (pre-gain) RMS in dB, used for noise gate */
  rawDb: number
  /** Result from YIN (or null if no pitch found) */
  yinResult: { frequency: number; confidence: number } | null
}

/** Why the most recent frame was rejected, or 'ok' on a valid emission. */
export type RejectReason =
  | 'gate'
  | 'no-pitch'
  | 'out-of-range'
  | 'low-confidence'
  | 'filling-buffer'
  | 'ok'

export interface PipelineFrameOutput {
  rejectReason: RejectReason
  /** Per-frame raw YIN → note, before median filtering. Null if no pitch or below gate. */
  rawNote: PitchDetectionNote | null
  /** Median-filtered note — set only on 'ok' frames */
  emittedNote: PitchDetectionNote | null
  /** Current median buffer size (0 .. MEDIAN_SIZE) */
  bufferFill: number
}

// ─── Tuned constants (from handoff) ──────────────────────────────────────────

/** Noise gate threshold on RAW (pre-gain) signal. Below → gate closed. */
export const NOISE_GATE_DB = -60
/** Guitar frequency range — reject YIN results outside this window. */
export const MIN_FREQ = 70
export const MAX_FREQ = 1400
/** Default minimum YIN confidence (0–1) required to enter the median buffer. */
export const MIN_CONFIDENCE = 0.75
/** Default median filter window size. Must be odd. */
export const MEDIAN_SIZE = 5

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function freqToMidi(freq: number): number {
  return Math.round(12 * Math.log2(freq / 440) + 69)
}

function midiToNote(midi: number): PitchDetectionNote {
  const octave = Math.floor(midi / 12) - 1
  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  const freq = 440 * Math.pow(2, (midi - 69) / 12)
  return { name, octave, fullName: name + octave, midi, freq }
}

function medianMidi(buffer: number[]): number {
  const sorted = [...buffer].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

/**
 * Process one analysis frame. Mutates `state.medianBuffer` in place.
 * Returns a snapshot of what happened: reject reason, raw note, emitted note.
 */
export function processFrame(
  state: PipelineState,
  input: PipelineFrameInput,
): PipelineFrameOutput {
  const { rawDb, yinResult } = input

  // 1. Noise gate — clears the median buffer when signal drops
  if (rawDb < NOISE_GATE_DB) {
    state.medianBuffer.length = 0
    return {
      rejectReason: 'gate',
      rawNote: null,
      emittedNote: null,
      bufferFill: 0,
    }
  }

  // 2. No pitch found by YIN this frame — buffer untouched
  if (!yinResult) {
    return {
      rejectReason: 'no-pitch',
      rawNote: null,
      emittedNote: null,
      bufferFill: state.medianBuffer.length,
    }
  }

  const { frequency, confidence } = yinResult
  const rawMidi = freqToMidi(frequency)
  const rawNote = midiToNote(rawMidi)

  // 3. Range filter — guitar frequencies only
  if (frequency < MIN_FREQ || frequency > MAX_FREQ) {
    return {
      rejectReason: 'out-of-range',
      rawNote,
      emittedNote: null,
      bufferFill: state.medianBuffer.length,
    }
  }

  // 4. Confidence filter
  if (confidence < state.minConfidence) {
    return {
      rejectReason: 'low-confidence',
      rawNote,
      emittedNote: null,
      bufferFill: state.medianBuffer.length,
    }
  }

  // 5. Valid frame → push to median buffer
  state.medianBuffer.push(rawMidi)
  if (state.medianBuffer.length > state.medianWindow) {
    state.medianBuffer.shift()
  }

  // 6. Not yet full → still filling
  if (state.medianBuffer.length < state.medianWindow) {
    return {
      rejectReason: 'filling-buffer',
      rawNote,
      emittedNote: null,
      bufferFill: state.medianBuffer.length,
    }
  }

  // 7. Emit median-filtered note
  const emittedNote = midiToNote(medianMidi(state.medianBuffer))
  return {
    rejectReason: 'ok',
    rawNote,
    emittedNote,
    bufferFill: state.medianBuffer.length,
  }
}
