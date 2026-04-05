import { describe, it, expect, beforeEach, vi } from 'vitest'
import { clampBpm, loadDefaultBpm, DEFAULT_BPM, MIN_BPM, MAX_BPM } from './metronome'

// ─── BPM clamping ────────────────────────────────────────────────────────────

describe('clampBpm', () => {
  it('passes through a value within range', () => {
    expect(clampBpm(120)).toBe(120)
  })

  it('clamps below MIN_BPM to MIN_BPM', () => {
    expect(clampBpm(10)).toBe(MIN_BPM)
    expect(clampBpm(0)).toBe(MIN_BPM)
    expect(clampBpm(-5)).toBe(MIN_BPM)
  })

  it('clamps above MAX_BPM to MAX_BPM', () => {
    expect(clampBpm(999)).toBe(MAX_BPM)
    expect(clampBpm(201)).toBe(MAX_BPM)
  })

  it('rounds fractional values to integers', () => {
    expect(clampBpm(90.4)).toBe(90)
    expect(clampBpm(90.5)).toBe(91)
    expect(clampBpm(90.9)).toBe(91)
  })

  it('rounds then clamps (edge case: 39.6 rounds to 40)', () => {
    expect(clampBpm(39.6)).toBe(MIN_BPM)
  })

  it('rounds then clamps (edge case: 200.4 rounds to 200)', () => {
    expect(clampBpm(200.4)).toBe(MAX_BPM)
  })

  it('boundary values pass through', () => {
    expect(clampBpm(MIN_BPM)).toBe(MIN_BPM)
    expect(clampBpm(MAX_BPM)).toBe(MAX_BPM)
  })
})

// ─── localStorage default BPM loading ────────────────────────────────────────

// Mock localStorage since we're not in a browser environment
const localStorageMap = new Map<string, string>()
const localStorageMock = {
  getItem: (key: string) => localStorageMap.get(key) ?? null,
  setItem: (key: string, value: string) => localStorageMap.set(key, value),
  removeItem: (key: string) => localStorageMap.delete(key),
  clear: () => localStorageMap.clear(),
  get length() { return localStorageMap.size },
  key: (_index: number) => null as string | null,
}

vi.stubGlobal('localStorage', localStorageMock)

describe('loadDefaultBpm', () => {
  beforeEach(() => {
    localStorageMap.clear()
  })

  it('returns DEFAULT_BPM when localStorage is empty', () => {
    expect(loadDefaultBpm()).toBe(DEFAULT_BPM)
  })

  it('returns DEFAULT_BPM when key is missing', () => {
    localStorageMock.setItem('other-key', '123')
    expect(loadDefaultBpm()).toBe(DEFAULT_BPM)
  })

  it('returns stored BPM when valid', () => {
    localStorageMock.setItem('woodshed:settings', JSON.stringify({ defaultBpm: 120 }))
    expect(loadDefaultBpm()).toBe(120)
  })

  it('returns DEFAULT_BPM when stored value is below MIN_BPM', () => {
    localStorageMock.setItem('woodshed:settings', JSON.stringify({ defaultBpm: 10 }))
    expect(loadDefaultBpm()).toBe(DEFAULT_BPM)
  })

  it('returns DEFAULT_BPM when stored value is above MAX_BPM', () => {
    localStorageMock.setItem('woodshed:settings', JSON.stringify({ defaultBpm: 999 }))
    expect(loadDefaultBpm()).toBe(DEFAULT_BPM)
  })

  it('returns DEFAULT_BPM when stored value is not a number', () => {
    localStorageMock.setItem('woodshed:settings', JSON.stringify({ defaultBpm: 'fast' }))
    expect(loadDefaultBpm()).toBe(DEFAULT_BPM)
  })

  it('returns DEFAULT_BPM when JSON is corrupt', () => {
    localStorageMock.setItem('woodshed:settings', '{broken json')
    expect(loadDefaultBpm()).toBe(DEFAULT_BPM)
  })

  it('returns DEFAULT_BPM when defaultBpm key is missing from object', () => {
    localStorageMock.setItem('woodshed:settings', JSON.stringify({ otherKey: 120 }))
    expect(loadDefaultBpm()).toBe(DEFAULT_BPM)
  })
})
