import { describe, it, expect, beforeAll } from 'vitest'
import { buildLowEPool, type Challenge } from './pools'
import { getNoteForFret } from '../../audio/tuning'

describe('buildLowEPool', () => {
  let pool: Challenge[]

  beforeAll(() => {
    pool = buildLowEPool()
  })

  it('returns 24 challenges', () => {
    expect(pool).toHaveLength(24)
  })

  it('all items have stringIndex=5 (low E)', () => {
    for (const item of pool) {
      expect(item.stringIndex).toBe(5)
    }
  })

  it('each fret 0–11 appears as its fret number', () => {
    for (let fret = 0; fret <= 11; fret++) {
      const found = pool.find(c => c.value === String(fret))
      expect(found, `fret number ${fret} missing from pool`).toBeDefined()
    }
  })

  it('each fret 0–11 appears as its note name', () => {
    for (let fret = 0; fret <= 11; fret++) {
      const expectedName = getNoteForFret(5, fret)
      const found = pool.find(c => c.value === expectedName)
      expect(found, `note name ${expectedName} missing from pool`).toBeDefined()
    }
  })

  it('each fret appears exactly twice (once as number, once as name)', () => {
    for (let fret = 0; fret <= 11; fret++) {
      const fretStr = String(fret)
      const noteName = getNoteForFret(5, fret)
      const matches = pool.filter(c => c.value === fretStr || c.value === noteName)
      expect(matches, `fret ${fret} should appear exactly twice`).toHaveLength(2)
    }
  })

  it('note name values match tuning module output', () => {
    const noteNames = pool.filter(c => !/^\d+$/.test(c.value))
    for (const item of noteNames) {
      // Find which fret this note name corresponds to
      const allNames = Array.from({ length: 12 }, (_, f) => getNoteForFret(5, f))
      expect(allNames).toContain(item.value)
    }
  })
})
