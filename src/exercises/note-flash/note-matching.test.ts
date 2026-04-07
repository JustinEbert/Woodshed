import { describe, it, expect } from 'vitest'
import { matchNote } from './note-matching'
import type { Challenge } from './pools'

// String indices: 0 = high e, 5 = low E
// Low E open = E, fret 5 = A, fret 7 = B

describe('matchNote — fret number challenges', () => {
  it('fret "0" on low E → expects "E", detects "E" → correct', () => {
    const challenge: Challenge = { value: '0', stringIndex: 5 }
    const result = matchNote(challenge, 'E')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('E')
    expect(result.detectedNote).toBe('E')
  })

  it('fret "0" on low E → expects "E", detects "A" → wrong', () => {
    const challenge: Challenge = { value: '0', stringIndex: 5 }
    const result = matchNote(challenge, 'A')
    expect(result.correct).toBe(false)
    expect(result.expectedNote).toBe('E')
    expect(result.detectedNote).toBe('A')
  })

  it('fret "5" on low E → expects "A", detects "A" → correct', () => {
    const challenge: Challenge = { value: '5', stringIndex: 5 }
    const result = matchNote(challenge, 'A')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('A')
  })

  it('fret "7" on low E → expects "B", detects "B" → correct', () => {
    const challenge: Challenge = { value: '7', stringIndex: 5 }
    const result = matchNote(challenge, 'B')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('B')
  })

  it('fret "3" on low E → expects "G", detects "F#" → wrong', () => {
    const challenge: Challenge = { value: '3', stringIndex: 5 }
    const result = matchNote(challenge, 'F#')
    expect(result.correct).toBe(false)
    expect(result.expectedNote).toBe('G')
  })
})

describe('matchNote — note name challenges', () => {
  it('note "G" on low E → expects "G", detects "G" → correct', () => {
    const challenge: Challenge = { value: 'G', stringIndex: 5 }
    const result = matchNote(challenge, 'G')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('G')
  })

  it('note "F#" on low E → expects "F#", detects "F#" → correct', () => {
    const challenge: Challenge = { value: 'F#', stringIndex: 5 }
    const result = matchNote(challenge, 'F#')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('F#')
  })

  it('note "A" on low E → expects "A", detects "G" → wrong', () => {
    const challenge: Challenge = { value: 'A', stringIndex: 5 }
    const result = matchNote(challenge, 'G')
    expect(result.correct).toBe(false)
    expect(result.expectedNote).toBe('A')
    expect(result.detectedNote).toBe('G')
  })
})

describe('matchNote — octave insensitivity', () => {
  it('treats same note name as correct regardless of detected octave', () => {
    // v1: octave-insensitive — playing the right note name counts
    const challenge: Challenge = { value: '0', stringIndex: 5 }
    // matchNote receives note name only (not octave) — caller passes the name
    const result = matchNote(challenge, 'E')
    expect(result.correct).toBe(true)
  })
})
