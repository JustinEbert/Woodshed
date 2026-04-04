// Global metronome state — BPM, pattern, running/stopped, current beat
// Stub: will be implemented in the Metronome epic

export interface MetronomeState {
  bpm: number
  running: boolean
  beat: number // 0-3, current quarter beat
}

export const DEFAULT_BPM = 90
