import { describe, it, expect } from 'vitest'
import { parseSpokenNote, parseSpokenFret } from './voice-vocabulary'

// ─── parseSpokenNote ────────────────────────────────────────────────────────

describe('parseSpokenNote', () => {
  // ── All 12 natural + sharp canonical notes ──────────────────────────────

  it.each([
    ['A', 'A'],
    ['B', 'B'],
    ['C', 'C'],
    ['D', 'D'],
    ['E', 'E'],
    ['F', 'F'],
    ['G', 'G'],
    ['A sharp', 'A#'],
    ['C sharp', 'C#'],
    ['D sharp', 'D#'],
    ['F sharp', 'F#'],
    ['G sharp', 'G#'],
  ])('canonical: "%s" → %s', (input, expected) => {
    expect(parseSpokenNote(input)).toBe(expected)
  })

  // ── Case insensitive ───────────────────────────────────────────────────

  it.each([
    ['a', 'A'],
    ['g sharp', 'G#'],
    ['C SHARP', 'C#'],
    ['f Sharp', 'F#'],
  ])('case insensitive: "%s" → %s', (input, expected) => {
    expect(parseSpokenNote(input)).toBe(expected)
  })

  // ── Enharmonic flats → sharps ──────────────────────────────────────────

  it.each([
    ['A flat', 'G#'],
    ['B flat', 'A#'],
    ['D flat', 'C#'],
    ['E flat', 'D#'],
    ['G flat', 'F#'],
  ])('enharmonic: "%s" → %s', (input, expected) => {
    expect(parseSpokenNote(input)).toBe(expected)
  })

  // ── Shorthand with # symbol ────────────────────────────────────────────

  it.each([
    ['a#', 'A#'],
    ['c#', 'C#'],
    ['d#', 'D#'],
    ['f#', 'F#'],
    ['g#', 'G#'],
  ])('shorthand: "%s" → %s', (input, expected) => {
    expect(parseSpokenNote(input)).toBe(expected)
  })

  // ── Fuzzy variants (Google Speech API quirks) ──────────────────────────

  it.each([
    // A variants
    ['hey', 'A'],
    ['eh', 'A'],
    ['ay', 'A'],
    ['aye', 'A'],
    // B variants
    ['be', 'B'],
    ['bee', 'B'],
    // C variants
    ['see', 'C'],
    ['sea', 'C'],
    ['si', 'C'],
    // D variants
    ['dee', 'D'],
    ['the', 'D'],
    // E variants
    ['he', 'E'],
    ['ee', 'E'],
    // F variants
    ['ef', 'F'],
    ['eff', 'F'],
    ['if', 'F'],
    // G variants
    ['gee', 'G'],
    ['ji', 'G'],
    ['ge', 'G'],
  ])('fuzzy: "%s" → %s', (input, expected) => {
    expect(parseSpokenNote(input)).toBe(expected)
  })

  // ── Fuzzy accidental variants ──────────────────────────────────────────

  it.each([
    ['be flat', 'A#'],
    ['bee flat', 'A#'],
    ['see sharp', 'C#'],
    ['dee sharp', 'D#'],
    ['gee sharp', 'G#'],
    ['gee flat', 'F#'],
    ['hey sharp', 'A#'],
    ['hey flat', 'G#'],
  ])('fuzzy accidental: "%s" → %s', (input, expected) => {
    expect(parseSpokenNote(input)).toBe(expected)
  })

  // ── Whitespace handling ────────────────────────────────────────────────

  it('trims whitespace', () => {
    expect(parseSpokenNote('  G  ')).toBe('G')
    expect(parseSpokenNote(' b flat ')).toBe('A#')
  })

  // ── Null for unrecognized ──────────────────────────────────────────────

  it.each([
    [''],
    ['hello'],
    ['xyz'],
    ['H'],          // Not a note
    ['A double sharp'],
    ['three'],      // Number, not a note
    ['12'],
  ])('null for unrecognized: "%s"', (input) => {
    expect(parseSpokenNote(input)).toBeNull()
  })
})

// ─── parseSpokenFret ────────────────────────────────────────────────────────

describe('parseSpokenFret', () => {
  // ── Word forms 0–24 ────────────────────────────────────────────────────

  it.each([
    ['zero', 0],
    ['one', 1],
    ['two', 2],
    ['three', 3],
    ['four', 4],
    ['five', 5],
    ['six', 6],
    ['seven', 7],
    ['eight', 8],
    ['nine', 9],
    ['ten', 10],
    ['eleven', 11],
    ['twelve', 12],
    ['thirteen', 13],
    ['fourteen', 14],
    ['fifteen', 15],
    ['sixteen', 16],
    ['seventeen', 17],
    ['eighteen', 18],
    ['nineteen', 19],
    ['twenty', 20],
    ['twenty one', 21],
    ['twenty two', 22],
    ['twenty three', 23],
    ['twenty four', 24],
  ])('word form: "%s" → %d', (input, expected) => {
    expect(parseSpokenFret(input)).toBe(expected)
  })

  // ── Digit strings ─────────────────────────────────────────────────────

  it.each([
    ['0', 0],
    ['1', 1],
    ['5', 5],
    ['12', 12],
    ['24', 24],
  ])('digit: "%s" → %d', (input, expected) => {
    expect(parseSpokenFret(input)).toBe(expected)
  })

  // ── Special aliases ────────────────────────────────────────────────────

  it.each([
    ['open', 0],
    ['oh', 0],
    ['won', 1],
    ['to', 2],
    ['too', 2],
    ['for', 4],
    ['fore', 4],
    ['ate', 8],
  ])('alias: "%s" → %d', (input, expected) => {
    expect(parseSpokenFret(input)).toBe(expected)
  })

  // ── Hyphenated compound numbers ────────────────────────────────────────

  it.each([
    ['twenty-one', 21],
    ['twenty-two', 22],
    ['twenty-three', 23],
    ['twenty-four', 24],
  ])('hyphenated: "%s" → %d', (input, expected) => {
    expect(parseSpokenFret(input)).toBe(expected)
  })

  // ── Case insensitive ──────────────────────────────────────────────────

  it('case insensitive', () => {
    expect(parseSpokenFret('Three')).toBe(3)
    expect(parseSpokenFret('TWELVE')).toBe(12)
    expect(parseSpokenFret('Twenty Four')).toBe(24)
  })

  // ── Whitespace ─────────────────────────────────────────────────────────

  it('trims whitespace', () => {
    expect(parseSpokenFret('  four  ')).toBe(4)
  })

  // ── Out of range / unrecognized → null ─────────────────────────────────

  it.each([
    [''],
    ['25'],          // Out of range
    ['-1'],          // Negative
    ['fifty'],       // Not in vocabulary
    ['hello'],       // Not a number
    ['G'],           // Note name, not a fret
    ['a sharp'],     // Note, not a fret
  ])('null for: "%s"', (input) => {
    expect(parseSpokenFret(input)).toBeNull()
  })
})
