// Challenge pool builders — Story #14
// Pure functions that generate challenge arrays for the Note Flash exercise.
// Each builder returns a static pool; the exercise shell shuffles and manages it.

import { getNoteForFret } from '../../audio/tuning'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Challenge {
  /** Display text: fret number ("3") or note name ("G") */
  value: string
  /** Which string to highlight: 0 = high e, 5 = low E */
  stringIndex: number
}

// ─── Pool builders ───────────────────────────────────────────────────────────

/**
 * Low E string, frets 0–11.
 * Each fret appears twice: once as its fret number, once as its note name.
 * Returns 24 challenges.
 */
export function buildLowEPool(): Challenge[] {
  const STRING = 5
  const pool: Challenge[] = []

  for (let fret = 0; fret <= 11; fret++) {
    pool.push({ value: String(fret), stringIndex: STRING })
    pool.push({ value: getNoteForFret(STRING, fret), stringIndex: STRING })
  }

  return pool
}
