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

export interface DetectedNote {
  /** Note name: "E", "F#", etc. (sharps only) */
  name: string
  /** MIDI octave: E2 = octave 2, A4 = octave 4 */
  octave: number
  /** MIDI note number */
  midi: number
  /** Deviation from perfect pitch: -50 to +50 cents */
  cents: number
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
 * Get the full note name (with octave) for a given string and fret.
 * e.g. low E open → "E2", 8th fret low E → "C3".
 */
export function getFullNoteForFret(stringIndex: number, fret: number): string {
  const midi = OPEN_STRING_MIDI[stringIndex] + fret
  const name = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return name + octave
}

/**
 * Get the first fret (0–11) where a note appears on a given string.
 * Returns the lowest fret position.
 */
export function getFretForNote(stringIndex: number, noteName: string): number {
  const openMidi = OPEN_STRING_MIDI[stringIndex]
  // NOTE_NAMES is `as const` (readonly tuple of literals), so its native
  // `.indexOf` signature narrows the argument to the literal union.
  // We intentionally accept any string and validate via the -1 check,
  // so widen to `readonly string[]` for the lookup.
  const targetIndex = (NOTE_NAMES as readonly string[]).indexOf(noteName)
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

/**
 * Map a frequency to the nearest note name, octave, MIDI number, and cents deviation.
 * Returns null if frequency is outside useful range (< 20 Hz or > 5000 Hz).
 */
export function frequencyToNote(frequency: number): DetectedNote | null {
  if (frequency < 20 || frequency > 5000) return null

  // MIDI note number (fractional) from frequency
  const midiFloat = 69 + 12 * Math.log2(frequency / 440)
  const midi = Math.round(midiFloat)
  const cents = (midiFloat - midi) * 100

  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1

  return { name, octave, midi, cents }
}
