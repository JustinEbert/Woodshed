import { describe, it, expect } from 'vitest'
import { detectPitch, type PitchResult } from './pitch-detection'

// ─── Test helpers ────────────────────────────────────────────────────────────

const SAMPLE_RATE = 44100

/** Generate a pure sine wave buffer at the given frequency. */
function makeSine(freq: number, duration: number = 0.1, sampleRate: number = SAMPLE_RATE): Float32Array {
  const length = Math.floor(sampleRate * duration)
  const buf = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    buf[i] = Math.sin(2 * Math.PI * freq * i / sampleRate)
  }
  return buf
}

/** Generate a silence buffer. */
function makeSilence(length: number = 4096): Float32Array {
  return new Float32Array(length)
}

/** Generate a white noise buffer with seeded pseudo-random values. */
function makeNoise(length: number = 4096): Float32Array {
  const buf = new Float32Array(length)
  // Simple LCG for reproducible "random" noise
  let seed = 12345
  for (let i = 0; i < length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    buf[i] = (seed / 0x7fffffff) * 2 - 1
  }
  return buf
}

// ─── Silence and noise rejection ─────────────────────────────────────────────

describe('detectPitch — rejection', () => {
  it('returns null for silence (all-zero buffer)', () => {
    const result = detectPitch(makeSilence(), SAMPLE_RATE)
    expect(result).toBeNull()
  })

  it('returns null for white noise', () => {
    const result = detectPitch(makeNoise(), SAMPLE_RATE)
    expect(result).toBeNull()
  })
})

// ─── Accuracy with synthetic sine waves ──────────────────────────────────────

describe('detectPitch — accuracy', () => {
  it('detects E2 (82.41 Hz) within ±1 Hz', () => {
    const result = detectPitch(makeSine(82.41, 0.1), SAMPLE_RATE)
    expect(result).not.toBeNull()
    expect(result!.frequency).toBeCloseTo(82.41, 0)
    expect(Math.abs(result!.frequency - 82.41)).toBeLessThan(1)
  })

  it('detects A2 (110 Hz) within ±1 Hz', () => {
    const result = detectPitch(makeSine(110, 0.1), SAMPLE_RATE)
    expect(result).not.toBeNull()
    expect(result!.frequency).toBeCloseTo(110, 0)
    expect(Math.abs(result!.frequency - 110)).toBeLessThan(1)
  })

  it('detects E4 (329.63 Hz) within ±1 Hz', () => {
    const result = detectPitch(makeSine(329.63, 0.1), SAMPLE_RATE)
    expect(result).not.toBeNull()
    expect(result!.frequency).toBeCloseTo(329.63, 0)
    expect(Math.abs(result!.frequency - 329.63)).toBeLessThan(1)
  })

  it('detects A4 (440 Hz) within ±1 Hz', () => {
    const result = detectPitch(makeSine(440, 0.1), SAMPLE_RATE)
    expect(result).not.toBeNull()
    expect(result!.frequency).toBeCloseTo(440, 0)
    expect(Math.abs(result!.frequency - 440)).toBeLessThan(1)
  })
})

// ─── Confidence ──────────────────────────────────────────────────────────────

describe('detectPitch — confidence', () => {
  it('returns confidence > 0.85 for clean sine waves', () => {
    const freqs = [82.41, 110, 329.63, 440]
    for (const freq of freqs) {
      const result = detectPitch(makeSine(freq, 0.1), SAMPLE_RATE)
      expect(result, `expected result for ${freq} Hz`).not.toBeNull()
      expect(result!.confidence, `confidence for ${freq} Hz`).toBeGreaterThan(0.85)
    }
  })

  it('confidence is in 0–1 range', () => {
    const result = detectPitch(makeSine(440, 0.1), SAMPLE_RATE)
    expect(result).not.toBeNull()
    expect(result!.confidence).toBeGreaterThanOrEqual(0)
    expect(result!.confidence).toBeLessThanOrEqual(1)
  })
})

// ─── Configurable threshold ──────────────────────────────────────────────────

describe('detectPitch — threshold', () => {
  it('accepts a custom confidence threshold', () => {
    // Very strict threshold — may reject even clean signals
    const strict = detectPitch(makeSine(440, 0.1), SAMPLE_RATE, 0.99)
    // Very lenient threshold — should accept clean signals
    const lenient = detectPitch(makeSine(440, 0.1), SAMPLE_RATE, 0.5)
    expect(lenient).not.toBeNull()
    // strict may or may not be null — just verify it doesn't crash
    if (strict !== null) {
      expect(strict.confidence).toBeGreaterThanOrEqual(0)
    }
  })
})
