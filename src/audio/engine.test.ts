import { describe, it, expect } from 'vitest'
import { KICK, SNARE, HAT, sixteenthNoteDuration } from './engine'

// ─── Drum pattern constants ──────────────────────────────────────────────────

describe('drum pattern constants', () => {
  it('KICK fires on beat 1, beat 3, beat 3& (steps 0, 8, 10)', () => {
    expect(KICK).toEqual(new Set([0, 8, 10]))
  })

  it('SNARE fires on beat 2, beat 4 (steps 4, 12)', () => {
    expect(SNARE).toEqual(new Set([4, 12]))
  })

  it('HAT fires on all 8th notes (even steps 0–14)', () => {
    expect(HAT).toEqual(new Set([0, 2, 4, 6, 8, 10, 12, 14]))
  })

  it('all pattern sets contain only valid step indices (0–15)', () => {
    for (const set of [KICK, SNARE, HAT]) {
      for (const step of set) {
        expect(step).toBeGreaterThanOrEqual(0)
        expect(step).toBeLessThanOrEqual(15)
      }
    }
  })
})

// ─── Scheduler timing ────────────────────────────────────────────────────────

describe('sixteenthNoteDuration', () => {
  it('returns correct duration at 120 BPM', () => {
    // At 120 BPM: quarter note = 0.5s, sixteenth = 0.125s
    expect(sixteenthNoteDuration(120)).toBeCloseTo(0.125, 6)
  })

  it('returns correct duration at 60 BPM', () => {
    // At 60 BPM: quarter note = 1s, sixteenth = 0.25s
    expect(sixteenthNoteDuration(60)).toBeCloseTo(0.25, 6)
  })

  it('returns correct duration at 90 BPM (default)', () => {
    // At 90 BPM: quarter note = 0.667s, sixteenth = 0.1667s
    expect(sixteenthNoteDuration(90)).toBeCloseTo(60 / 90 / 4, 6)
  })

  it('returns correct duration at 200 BPM (max)', () => {
    expect(sixteenthNoteDuration(200)).toBeCloseTo(60 / 200 / 4, 6)
  })

  it('returns correct duration at 40 BPM (min)', () => {
    expect(sixteenthNoteDuration(40)).toBeCloseTo(60 / 40 / 4, 6)
  })
})
