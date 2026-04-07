// Pitch pipeline tests — Story #29
// Pure state machine: gate → range → confidence → median → emit.
// YIN itself is tested separately in pitch-detection.test.ts — this file
// feeds synthetic yinResult values to exercise every branch.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  processFrame,
  createPipelineState,
  type PipelineState,
  type PipelineFrameInput,
  MIN_CONFIDENCE,
  MEDIAN_SIZE,
  NOISE_GATE_DB,
} from './pitch-pipeline'

// ─── Test helpers ────────────────────────────────────────────────────────────

/** Build a valid frame input at a given frequency and confidence. */
function frame(
  freq: number,
  confidence = 0.9,
  rawDb = -30,
): PipelineFrameInput {
  return { rawDb, yinResult: { frequency: freq, confidence } }
}

function gateFrame(rawDb = -65): PipelineFrameInput {
  return { rawDb, yinResult: null }
}

function noPitchFrame(rawDb = -30): PipelineFrameInput {
  return { rawDb, yinResult: null }
}

// Reference frequencies — equal-tempered, A4 = 440
const G3 = 196    // MIDI 55
const G2 = 98     // MIDI 43 (octave below)
const E2 = 82.41  // MIDI 40
const A4 = 440    // MIDI 69

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('pitch-pipeline / processFrame', () => {
  let state: PipelineState

  beforeEach(() => {
    state = createPipelineState()
  })

  // ── Reject reasons ──────────────────────────────────────────────────────

  describe('reject reasons', () => {
    it('below the noise gate → rejectReason="gate", buffer cleared', () => {
      // Pre-fill the buffer with some values
      processFrame(state, frame(G3))
      processFrame(state, frame(G3))
      expect(state.medianBuffer.length).toBe(2)

      const out = processFrame(state, gateFrame(NOISE_GATE_DB - 1))

      expect(out.rejectReason).toBe('gate')
      expect(out.emittedNote).toBeNull()
      expect(out.bufferFill).toBe(0)
      expect(state.medianBuffer.length).toBe(0)
    })

    it('above gate but YIN returned null → rejectReason="no-pitch"', () => {
      const out = processFrame(state, noPitchFrame())
      expect(out.rejectReason).toBe('no-pitch')
      expect(out.emittedNote).toBeNull()
      expect(out.rawNote).toBeNull()
    })

    it('frequency below MIN_FREQ → rejectReason="out-of-range"', () => {
      const out = processFrame(state, frame(50))
      expect(out.rejectReason).toBe('out-of-range')
      expect(out.emittedNote).toBeNull()
    })

    it('frequency above MAX_FREQ → rejectReason="out-of-range"', () => {
      const out = processFrame(state, frame(1500))
      expect(out.rejectReason).toBe('out-of-range')
      expect(out.emittedNote).toBeNull()
    })

    it('confidence below MIN_CONFIDENCE → rejectReason="low-confidence"', () => {
      const out = processFrame(state, frame(G3, MIN_CONFIDENCE - 0.01))
      expect(out.rejectReason).toBe('low-confidence')
      expect(out.emittedNote).toBeNull()
    })

    it('1–4 valid frames → rejectReason="filling-buffer"', () => {
      for (let i = 1; i < MEDIAN_SIZE; i++) {
        const out = processFrame(state, frame(G3))
        expect(out.rejectReason).toBe('filling-buffer')
        expect(out.emittedNote).toBeNull()
        expect(out.bufferFill).toBe(i)
      }
    })

    it('5 valid frames → rejectReason="ok", emits note', () => {
      let lastOut
      for (let i = 0; i < MEDIAN_SIZE; i++) {
        lastOut = processFrame(state, frame(G3))
      }
      expect(lastOut!.rejectReason).toBe('ok')
      expect(lastOut!.emittedNote).not.toBeNull()
      expect(lastOut!.emittedNote!.fullName).toBe('G3')
      expect(lastOut!.bufferFill).toBe(MEDIAN_SIZE)
    })
  })

  // ── Median filter behavior ──────────────────────────────────────────────

  describe('median filter', () => {
    it('rejects a single octave jitter: 4× G3 + 1× G2 emits G3', () => {
      processFrame(state, frame(G3))
      processFrame(state, frame(G3))
      processFrame(state, frame(G2)) // octave error
      processFrame(state, frame(G3))
      const out = processFrame(state, frame(G3))
      expect(out.rejectReason).toBe('ok')
      expect(out.emittedNote!.fullName).toBe('G3')
    })

    it('median of MIDI integers, not frequencies', () => {
      // Mixing G3 and G2 — if we medianed Hz, the "median" would be
      // around the middle Hz; but medianing MIDI integers keeps us on
      // either G3 or G2 cleanly.
      processFrame(state, frame(G2))
      processFrame(state, frame(G2))
      processFrame(state, frame(G3))
      processFrame(state, frame(G2))
      const out = processFrame(state, frame(G3))
      expect(out.rejectReason).toBe('ok')
      expect(out.emittedNote!.fullName).toBe('G2') // G2 is majority
    })

    it('sliding window: buffer shifts oldest out after MEDIAN_SIZE', () => {
      // Fill with G2, then push enough G3 to fully replace
      for (let i = 0; i < MEDIAN_SIZE; i++) {
        processFrame(state, frame(G2))
      }
      for (let i = 0; i < MEDIAN_SIZE; i++) {
        processFrame(state, frame(G3))
      }
      // Buffer should now contain 5× G3, nothing left of G2
      expect(state.medianBuffer.every((midi) => midi === 55)).toBe(true)
    })
  })

  // ── Buffer-state interactions ───────────────────────────────────────────

  describe('buffer state interactions', () => {
    it('no-pitch frames do NOT clear the buffer', () => {
      processFrame(state, frame(G3))
      processFrame(state, frame(G3))
      processFrame(state, frame(G3))
      expect(state.medianBuffer.length).toBe(3)

      processFrame(state, noPitchFrame())
      expect(state.medianBuffer.length).toBe(3)

      processFrame(state, frame(G3))
      const out = processFrame(state, frame(G3))
      expect(out.rejectReason).toBe('ok')
      expect(out.emittedNote!.fullName).toBe('G3')
    })

    it('out-of-range frames do NOT clear the buffer', () => {
      processFrame(state, frame(G3))
      processFrame(state, frame(G3))
      processFrame(state, frame(50)) // out-of-range
      expect(state.medianBuffer.length).toBe(2)
    })

    it('low-confidence frames do NOT clear the buffer', () => {
      processFrame(state, frame(G3))
      processFrame(state, frame(G3))
      processFrame(state, frame(G3, 0.5)) // low confidence
      expect(state.medianBuffer.length).toBe(2)
    })

    it('gate frames DO clear the buffer mid-stream', () => {
      processFrame(state, frame(G3))
      processFrame(state, frame(G3))
      processFrame(state, frame(G3))
      processFrame(state, gateFrame())
      expect(state.medianBuffer.length).toBe(0)

      // Now we need MEDIAN_SIZE fresh frames to emit again
      for (let i = 1; i < MEDIAN_SIZE; i++) {
        const out = processFrame(state, frame(G3))
        expect(out.emittedNote).toBeNull()
      }
      const final = processFrame(state, frame(G3))
      expect(final.rejectReason).toBe('ok')
      expect(final.emittedNote!.fullName).toBe('G3')
    })
  })

  // ── rawNote field ───────────────────────────────────────────────────────

  describe('rawNote (per-frame, pre-median)', () => {
    it('is set for any in-range frame, even low-confidence', () => {
      const out = processFrame(state, frame(G3, 0.5))
      expect(out.rawNote).not.toBeNull()
      expect(out.rawNote!.fullName).toBe('G3')
      expect(out.rejectReason).toBe('low-confidence')
    })

    it('is null when yinResult is null', () => {
      const out = processFrame(state, noPitchFrame())
      expect(out.rawNote).toBeNull()
    })

    it('is null when below gate', () => {
      const out = processFrame(state, gateFrame())
      expect(out.rawNote).toBeNull()
    })
  })

  // ── Per-instance options ────────────────────────────────────────────────

  describe('PipelineOptions', () => {
    it('custom minConfidence rejects below the new threshold', () => {
      const s = createPipelineState({ minConfidence: 0.9 })
      const out = processFrame(s, frame(G3, 0.85))
      expect(out.rejectReason).toBe('low-confidence')
    })

    it('custom minConfidence accepts at the new threshold', () => {
      const s = createPipelineState({ minConfidence: 0.5 })
      const out = processFrame(s, frame(G3, 0.55))
      expect(out.rejectReason).toBe('filling-buffer')
    })

    it('custom medianWindow of 3 emits after 3 frames', () => {
      const s = createPipelineState({ medianWindow: 3 })
      let out
      for (let i = 0; i < 3; i++) out = processFrame(s, frame(G3))
      expect(out!.rejectReason).toBe('ok')
      expect(out!.emittedNote!.fullName).toBe('G3')
    })

    it('throws on even medianWindow', () => {
      expect(() => createPipelineState({ medianWindow: 4 })).toThrow()
    })
  })

  // ── Note accuracy ───────────────────────────────────────────────────────

  describe('emitted note accuracy', () => {
    it('emits E2 for 82.41 Hz', () => {
      let out
      for (let i = 0; i < MEDIAN_SIZE; i++) out = processFrame(state, frame(E2))
      expect(out!.emittedNote!.fullName).toBe('E2')
      expect(out!.emittedNote!.midi).toBe(40)
    })

    it('emits A4 for 440 Hz', () => {
      let out
      for (let i = 0; i < MEDIAN_SIZE; i++) out = processFrame(state, frame(A4))
      expect(out!.emittedNote!.fullName).toBe('A4')
      expect(out!.emittedNote!.midi).toBe(69)
    })
  })
})
