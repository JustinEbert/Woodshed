// Note matching — Story #27
// Pure logic: does a detected note match the current Note Flash challenge?
// A challenge value is either a fret number ("5") or a note name ("G").
// Match is octave-insensitive for v1 — we only compare note names.

import { getNoteForFret } from '../../audio/tuning'
import type { Challenge } from './pools'

export interface MatchResult {
  correct: boolean
  detectedNote: string
  expectedNote: string
}

/**
 * Resolve a challenge to its expected note name.
 * If the value is numeric, look up the note at that fret.
 * Otherwise, the value is already the note name.
 */
function expectedNoteFor(challenge: Challenge): string {
  const asNumber = Number(challenge.value)
  if (Number.isFinite(asNumber) && Number.isInteger(asNumber)) {
    return getNoteForFret(challenge.stringIndex, asNumber)
  }
  return challenge.value
}

/**
 * Compare a detected note name against the current challenge.
 * Returns a MatchResult with the correct/wrong verdict and the notes involved.
 */
export function matchNote(challenge: Challenge, detectedNote: string): MatchResult {
  const expectedNote = expectedNoteFor(challenge)
  return {
    correct: detectedNote === expectedNote,
    detectedNote,
    expectedNote,
  }
}
