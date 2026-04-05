import { describe, it, expect } from 'vitest'
import {
  getNoteForFret,
  getFretForNote,
  getFrequency,
  getNotesForString,
} from './tuning'

// ─── Standard tuning open strings ────────────────────────────────────────────
// String 0 = high e (E4), 1 = B3, 2 = G3, 3 = D3, 4 = A2, 5 = low E (E2)

describe('getNoteForFret', () => {
  it('returns correct open string notes for all 6 strings', () => {
    expect(getNoteForFret(0, 0)).toBe('E')   // high e
    expect(getNoteForFret(1, 0)).toBe('B')   // B string
    expect(getNoteForFret(2, 0)).toBe('G')   // G string
    expect(getNoteForFret(3, 0)).toBe('D')   // D string
    expect(getNoteForFret(4, 0)).toBe('A')   // A string
    expect(getNoteForFret(5, 0)).toBe('E')   // low E
  })

  it('returns correct notes for all frets 0–12 on low E', () => {
    const expected = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E']
    for (let fret = 0; fret <= 12; fret++) {
      expect(getNoteForFret(5, fret)).toBe(expected[fret])
    }
  })

  it('returns correct notes for all frets 0–12 on A string', () => {
    const expected = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A']
    for (let fret = 0; fret <= 12; fret++) {
      expect(getNoteForFret(4, fret)).toBe(expected[fret])
    }
  })

  it('returns correct notes for all frets 0–12 on high e', () => {
    const expected = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E']
    for (let fret = 0; fret <= 12; fret++) {
      expect(getNoteForFret(0, fret)).toBe(expected[fret])
    }
  })
})

describe('getFretForNote', () => {
  it('returns correct fret for open string notes', () => {
    expect(getFretForNote(5, 'E')).toBe(0)
    expect(getFretForNote(4, 'A')).toBe(0)
    expect(getFretForNote(3, 'D')).toBe(0)
    expect(getFretForNote(2, 'G')).toBe(0)
    expect(getFretForNote(1, 'B')).toBe(0)
    expect(getFretForNote(0, 'E')).toBe(0)
  })

  it('round-trips: fret → note → fret for low E frets 0–11', () => {
    for (let fret = 0; fret <= 11; fret++) {
      const note = getNoteForFret(5, fret)
      expect(getFretForNote(5, note)).toBe(fret)
    }
  })

  it('round-trips: fret → note → fret for A string frets 0–11', () => {
    for (let fret = 0; fret <= 11; fret++) {
      const note = getNoteForFret(4, fret)
      expect(getFretForNote(4, note)).toBe(fret)
    }
  })

  it('returns first occurrence for notes that appear at fret 0 and 12', () => {
    // E appears at fret 0 and fret 12 on low E — should return 0
    expect(getFretForNote(5, 'E')).toBe(0)
  })
})

describe('getFrequency', () => {
  it('returns correct frequency for known reference pitches', () => {
    // E2 = 82.41 Hz (low E open)
    expect(getFrequency(5, 0)).toBeCloseTo(82.41, 1)

    // A2 = 110.0 Hz (A string open)
    expect(getFrequency(4, 0)).toBeCloseTo(110.0, 1)

    // D3 = 146.83 Hz (D string open)
    expect(getFrequency(3, 0)).toBeCloseTo(146.83, 1)

    // G3 = 196.0 Hz (G string open)
    expect(getFrequency(2, 0)).toBeCloseTo(196.0, 1)

    // B3 = 246.94 Hz (B string open)
    expect(getFrequency(1, 0)).toBeCloseTo(246.94, 1)

    // E4 = 329.63 Hz (high e open)
    expect(getFrequency(0, 0)).toBeCloseTo(329.63, 1)
  })

  it('doubles frequency at the 12th fret (octave)', () => {
    const openE2 = getFrequency(5, 0)
    const fret12E2 = getFrequency(5, 12)
    expect(fret12E2).toBeCloseTo(openE2 * 2, 1)
  })

  it('returns A4 = 440 Hz at the correct position', () => {
    // A4 is A string fret 0 = A2, so A4 is 2 octaves up = not on standard frets easily
    // But high e string fret 5 = A4
    expect(getFrequency(0, 5)).toBeCloseTo(440.0, 0)
  })
})

describe('getNotesForString', () => {
  it('returns 25 notes for default maxFret (24)', () => {
    const notes = getNotesForString(5)
    expect(notes).toHaveLength(25) // frets 0–24
  })

  it('returns correct structure for each note', () => {
    const notes = getNotesForString(5)
    const first = notes[0]
    expect(first).toHaveProperty('fret', 0)
    expect(first).toHaveProperty('name', 'E')
    expect(first).toHaveProperty('frequency')
    expect(typeof first.frequency).toBe('number')
  })

  it('respects maxFret parameter', () => {
    const notes = getNotesForString(5, 5)
    expect(notes).toHaveLength(6) // frets 0–5
    expect(notes[5].fret).toBe(5)
  })

  it('returns notes consistent with getNoteForFret and getFrequency', () => {
    const notes = getNotesForString(4) // A string, all 25 frets
    for (const note of notes) {
      expect(note.name).toBe(getNoteForFret(4, note.fret))
      expect(note.frequency).toBeCloseTo(getFrequency(4, note.fret), 2)
    }
  })

  it('fret 24 is two octaves above open string', () => {
    const notes = getNotesForString(5) // low E
    expect(notes[24].name).toBe('E') // same note name, two octaves up
    expect(notes[24].frequency).toBeCloseTo(notes[0].frequency * 4, 1) // 2^2 = 4x
  })
})
