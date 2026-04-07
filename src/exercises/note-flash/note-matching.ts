// Note matching — Story #27 / #33
// Pure logic: does a detected note match the current Note Flash challenge?
// A challenge value is either a fret number ("5") or a note name ("G").
// Match is octave-STRICT: the player must hit the exact pitch on the
// indicated string, not just the right note name in any octave.

import { getFullNoteForFret, getFretForNote } from '../../audio/tuning'
import type { Challenge } from './pools'

export interface MatchResult {
  correct: boolean
  detectedNote: string
  expectedNote: string
}

/**
 * Resolve a challenge to its expected full note name (with octave).
 * - Numeric value: look up the note at that fret on the indicated string.
 * - Letter value: find the lowest fret on that string where the note appears,
 *   then resolve to the full name with octave.
 */
function expectedFullNoteFor(challenge: Challenge): string {
  const asNumber = Number(challenge.value)
  if (Number.isFinite(asNumber) && Number.isInteger(asNumber)) {
    return getFullNoteForFret(challenge.stringIndex, asNumber)
  }
  const fret = getFretForNote(challenge.stringIndex, challenge.value)
  return getFullNoteForFret(challenge.stringIndex, fret)
}

/**
 * Compare a detected full note name (e.g. "C3") against the current challenge.
 */
export function matchNote(challenge: Challenge, detectedFullName: string): MatchResult {
  const expectedNote = expectedFullNoteFor(challenge)
  return {
    correct: detectedFullName === expectedNote,
    detectedNote: detectedFullName,
    expectedNote,
  }
}
