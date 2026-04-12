// Voice vocabulary — Story #56
// Pure module: parses raw Web Speech API transcripts into structured answers.
// No React, no browser dependencies. Any exercise can import these functions.
//
// Two parsers:
//   parseSpokenNote("gee sharp") → "G#"
//   parseSpokenFret("three")     → 3
//
// Output uses canonical sharp-only format matching tuning.ts.

// ─── Note parsing ───────────────────────────────────────────────────────────

// Canonical note names (exact matches after lowercasing)
const NOTE_MAP: ReadonlyMap<string, string> = new Map([
  // Natural notes
  ['a', 'A'],
  ['b', 'B'],
  ['c', 'C'],
  ['d', 'D'],
  ['e', 'E'],
  ['f', 'F'],
  ['g', 'G'],

  // Sharps — canonical form
  ['a sharp', 'A#'],
  ['a#', 'A#'],
  ['b sharp', 'C'],  // Enharmonic: B# = C (not supported as distinct)
  ['c sharp', 'C#'],
  ['c#', 'C#'],
  ['d sharp', 'D#'],
  ['d#', 'D#'],
  ['e sharp', 'F'],  // Enharmonic: E# = F
  ['f sharp', 'F#'],
  ['f#', 'F#'],
  ['g sharp', 'G#'],
  ['g#', 'G#'],

  // Flats → resolve to sharp equivalents
  ['a flat', 'G#'],
  ['b flat', 'A#'],
  ['c flat', 'B'],   // Cb = B
  ['d flat', 'C#'],
  ['e flat', 'D#'],
  ['f flat', 'E'],   // Fb = E
  ['g flat', 'F#'],
])

// Known Google Speech API mishearings for single note letters.
// These are hand-curated from real Chrome Speech API behavior on
// Android and desktop. Expand as real-device testing reveals new variants.
const NOTE_FUZZY: ReadonlyMap<string, string> = new Map([
  // A — phonetically ambiguous with articles/interjections
  ['hey', 'A'],
  ['eh', 'A'],
  ['ay', 'A'],
  ['aye', 'A'],

  // B — "be" is a common transcript for the letter B
  ['be', 'B'],
  ['bee', 'B'],

  // C — homophones
  ['see', 'C'],
  ['sea', 'C'],
  ['si', 'C'],

  // D — common transcript variant
  ['dee', 'D'],
  ['the', 'D'],

  // E — short vowel confusion
  ['he', 'E'],
  ['ee', 'E'],

  // F — common transcript variants
  ['ef', 'F'],
  ['eff', 'F'],
  ['if', 'F'],

  // G — common transcript variants
  ['gee', 'G'],
  ['ji', 'G'],
  ['ge', 'G'],

  // Accidental variants (spoken differently)
  ['be flat', 'A#'],
  ['bee flat', 'A#'],
  ['see sharp', 'C#'],
  ['dee sharp', 'D#'],
  ['dee flat', 'C#'],
  ['ee flat', 'D#'],
  ['ef sharp', 'F#'],
  ['eff sharp', 'F#'],
  ['gee sharp', 'G#'],
  ['gee flat', 'F#'],
  ['hey sharp', 'A#'],
  ['hey flat', 'G#'],
])

/**
 * Parse a spoken note name into canonical sharp-only format.
 * Returns null if the transcript doesn't match any known note.
 *
 * Examples:
 *   parseSpokenNote("G")        → "G"
 *   parseSpokenNote("b flat")   → "A#"
 *   parseSpokenNote("gee")      → "G"
 *   parseSpokenNote("hello")    → null
 */
export function parseSpokenNote(transcript: string): string | null {
  const input = transcript.toLowerCase().trim()
  if (!input) return null

  // Try exact/canonical match first
  const exact = NOTE_MAP.get(input)
  if (exact !== undefined) return exact

  // Try fuzzy match
  const fuzzy = NOTE_FUZZY.get(input)
  if (fuzzy !== undefined) return fuzzy

  return null
}

// ─── Fret number parsing ────────────────────────────────────────────────────

// Word → number map for 0–24
const FRET_WORD_MAP: ReadonlyMap<string, number> = new Map([
  ['zero', 0],
  ['oh', 0],
  ['open', 0],
  ['one', 1],
  ['won', 1],
  ['two', 2],
  ['to', 2],
  ['too', 2],
  ['three', 3],
  ['four', 4],
  ['for', 4],
  ['fore', 4],
  ['five', 5],
  ['six', 6],
  ['seven', 7],
  ['eight', 8],
  ['ate', 8],
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
  ['twenty-one', 21],
  ['twenty two', 22],
  ['twenty-two', 22],
  ['twenty three', 23],
  ['twenty-three', 23],
  ['twenty four', 24],
  ['twenty-four', 24],
])

/**
 * Parse a spoken fret number into an integer 0–24.
 * Handles both word forms ("four") and digit strings ("4").
 * Returns null if unrecognized or out of range.
 *
 * Examples:
 *   parseSpokenFret("three")  → 3
 *   parseSpokenFret("12")     → 12
 *   parseSpokenFret("open")   → 0
 *   parseSpokenFret("fifty")  → null
 */
export function parseSpokenFret(transcript: string): number | null {
  const input = transcript.toLowerCase().trim()
  if (!input) return null

  // Try word map first
  const word = FRET_WORD_MAP.get(input)
  if (word !== undefined) return word

  // Try parsing as a digit string (Google Speech API sometimes returns "4" not "four")
  const num = Number(input)
  if (Number.isFinite(num) && Number.isInteger(num) && num >= 0 && num <= 24) {
    return num
  }

  return null
}
