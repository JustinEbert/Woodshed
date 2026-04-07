import { describe, it, expect } from 'vitest'
import { matchNote } from './note-matching'
import type { Challenge } from './pools'

// String indices: 0 = high e, 5 = low E
// Low E open = E2, fret 5 = A2, fret 7 = B2, fret 8 = C3
// Match is octave-STRICT — caller passes the full name (e.g. "C3").

describe('matchNote — fret number challenges', () => {
  it('fret "0" on low E → expects "E2", detects "E2" → correct', () => {
    const challenge: Challenge = { value: '0', stringIndex: 5 }
    const result = matchNote(challenge, 'E2')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('E2')
  })

  it('fret "0" on low E → detects "A2" → wrong', () => {
    const challenge: Challenge = { value: '0', stringIndex: 5 }
    const result = matchNote(challenge, 'A2')
    expect(result.correct).toBe(false)
    expect(result.expectedNote).toBe('E2')
  })

  it('fret "5" on low E → expects "A2", detects "A2" → correct', () => {
    const challenge: Challenge = { value: '5', stringIndex: 5 }
    const result = matchNote(challenge, 'A2')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('A2')
  })

  it('fret "8" on low E → expects "C3", detects "C3" → correct', () => {
    const challenge: Challenge = { value: '8', stringIndex: 5 }
    const result = matchNote(challenge, 'C3')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('C3')
  })

  it('fret "3" on low E → expects "G2", detects "F#2" → wrong', () => {
    const challenge: Challenge = { value: '3', stringIndex: 5 }
    const result = matchNote(challenge, 'F#2')
    expect(result.correct).toBe(false)
    expect(result.expectedNote).toBe('G2')
  })
})

describe('matchNote — note name challenges', () => {
  it('note "G" on low E → expects "G2" (lowest fret), detects "G2" → correct', () => {
    const challenge: Challenge = { value: 'G', stringIndex: 5 }
    const result = matchNote(challenge, 'G2')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('G2')
  })

  it('note "F#" on low E → expects "F#2", detects "F#2" → correct', () => {
    const challenge: Challenge = { value: 'F#', stringIndex: 5 }
    const result = matchNote(challenge, 'F#2')
    expect(result.correct).toBe(true)
    expect(result.expectedNote).toBe('F#2')
  })

  it('note "A" on low E → expects "A2", detects "G2" → wrong', () => {
    const challenge: Challenge = { value: 'A', stringIndex: 5 }
    const result = matchNote(challenge, 'G2')
    expect(result.correct).toBe(false)
    expect(result.expectedNote).toBe('A2')
  })
})

describe('matchNote — octave strictness', () => {
  it('right note name in wrong octave is rejected', () => {
    // Asks for low E open (E2). Playing E3 (e.g. high e fret 0... wait that's E4)
    // — high e open is E4, but D-string fret 2 is E3. Should NOT match low E ask.
    const challenge: Challenge = { value: '0', stringIndex: 5 }
    const result = matchNote(challenge, 'E3')
    expect(result.correct).toBe(false)
    expect(result.expectedNote).toBe('E2')
  })

  it('only the exact octave matches the asked string position', () => {
    // 8th fret low E = C3. C2, C4 should both fail.
    const challenge: Challenge = { value: '8', stringIndex: 5 }
    expect(matchNote(challenge, 'C2').correct).toBe(false)
    expect(matchNote(challenge, 'C4').correct).toBe(false)
    expect(matchNote(challenge, 'C3').correct).toBe(true)
  })
})
