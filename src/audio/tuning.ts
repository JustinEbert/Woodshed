// Standard guitar tuning data — Story #22
// Fret ↔ note name ↔ frequency mappings for EADGBE standard tuning.
// Shared utility used by exercises and pitch detection.
// A4 = 440 Hz reference. Note names use sharps only (no flats).

// ─── Constants ───────────────────────────────────────────────────────────────

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

// Standard tuning open string MIDI note numbers
// String index: 0 = high e (E4), 1 = B3, 2 = G3, 3 = D3, 4 = A2, 5 = low E (E2)
const OPEN_STRING_MIDI: readonly number[] = [64, 59, 55, 50, 45, 40]

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NoteInfo {
  fret: number
  name: string
  frequency: number
}

// ─── Core functions ──────────────────────────────────────────────────────────

/**
 * Get the note name for a given string and fret.
 * Returns sharps only (e.g. "F#", never "Gb").
 */
export function getNoteForFret(stringIndex: number, fret: number): string {
  const midi = OPEN_STRING_MIDI[stringIndex] + fret
  return NOTE_NAMES[midi % 12]
}

/**
 * Get the first fret (0–11) where a note appears on a given string.
 * Returns the lowest fret position.
 */
export function getFretForNote(stringIndex: number, noteName: string): number {
  const openMidi = OPEN_STRING_MIDI[stringIndex]
  const targetIndex = NOTE_NAMES.indexOf(noteName)
  if (targetIndex === -1) {
    throw new Error(`Unknown note name: ${noteName}`)
  }
  const openIndex = openMidi % 12
  const fret = (targetIndex - openIndex + 12) % 12
  return fret
}

/**
 * Get the frequency in Hz for a given string and fret.
 * Uses A4 = 440 Hz equal temperament.
 */
export function getFrequency(stringIndex: number, fret: number): number {
  const midi = OPEN_STRING_MIDI[stringIndex] + fret
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/**
 * Get all notes on a string from fret 0 to maxFret (inclusive).
 * Default maxFret = 24 (full-size guitar).
 */
export function getNotesForString(stringIndex: number, maxFret: number = 24): NoteInfo[] {
  const notes: NoteInfo[] = []
  for (let fret = 0; fret <= maxFret; fret++) {
    notes.push({
      fret,
      name: getNoteForFret(stringIndex, fret),
      frequency: getFrequency(stringIndex, fret),
    })
  }
  return notes
}
