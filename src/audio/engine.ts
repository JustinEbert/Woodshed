// Audio engine — Web Audio API drum pattern synthesis + scheduler
// Story #9. Ported from docs/prototypes/woodshed_metronome_v6_backup.html
//
// Pattern: kick 1, kick 3, kick 3& / snare 2, 4 / hats on 8ths
// Scheduler: 25ms lookahead interval, 100ms lookahead window
// 16th-note resolution internal clock

// ─── Drum pattern ────────────────────────────────────────────────────────────

// 16 sixteenth-note steps per bar (0-15)
const KICK = new Set([0, 8, 10])   // beat 1, beat 3, beat 3&
const SNARE = new Set([4, 12])      // beat 2, beat 4
const HAT = new Set([0, 2, 4, 6, 8, 10, 12, 14]) // all 8ths

// ─── Synthesis ───────────────────────────────────────────────────────────────
// Parameters matched exactly to prototype:
// Kick:  osc 150→40Hz, 0.7 gain, 120ms decay
// Snare: bandpass noise 1500Hz, 0.5 gain, 120ms decay
// Hat:   highpass noise 9000Hz, 0.18 gain, 30ms decay

function playKick(ctx: AudioContext, t: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.setValueAtTime(150, t)
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.08)
  gain.gain.setValueAtTime(0.7, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  osc.start(t)
  osc.stop(t + 0.15)
}

function playSnare(ctx: AudioContext, t: number) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  src.buffer = buf
  filter.type = 'bandpass'
  filter.frequency.value = 1500
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.5, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  src.start(t)
  src.stop(t + 0.15)
}

function playHat(ctx: AudioContext, t: number) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  src.buffer = buf
  filter.type = 'highpass'
  filter.frequency.value = 9000
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.18, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03)
  src.start(t)
  src.stop(t + 0.04)
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export type QuarterBeatCallback = (beat: number) => void

export interface AudioEngine {
  start: (bpm: number) => void
  stop: () => void
  setBpm: (bpm: number) => void
  isRunning: () => boolean
}

/**
 * Create the audio engine. Returns start/stop/setBpm controls.
 * AudioContext is created lazily on first start() — must be called
 * from a user gesture to satisfy browser autoplay policy.
 *
 * @param onQuarterBeat - called on each quarter beat (0-3) for visual sync.
 *   Fires via setTimeout aligned to the scheduled audio time, so visuals
 *   sync with what you hear.
 */
export function createAudioEngine(onQuarterBeat: QuarterBeatCallback): AudioEngine {
  let audioCtx: AudioContext | null = null
  let schedulerTimer: ReturnType<typeof setTimeout> | null = null
  let nextNoteTime = 0
  let sixteenthCount = 0
  let currentBpm = 90
  let running = false

  function getCtx(): AudioContext {
    if (!audioCtx) {
      audioCtx = new AudioContext()
    }
    // Resume if suspended (happens after tab goes background)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    return audioCtx
  }

  function scheduler() {
    const ctx = getCtx()
    const sixteenthDuration = (60 / currentBpm) / 4

    // Schedule all notes within the lookahead window (100ms)
    while (nextNoteTime < ctx.currentTime + 0.1) {
      const step = sixteenthCount % 16
      const t = nextNoteTime

      // Schedule drum sounds
      if (KICK.has(step)) playKick(ctx, t)
      if (SNARE.has(step)) playSnare(ctx, t)
      if (HAT.has(step)) playHat(ctx, t)

      // Fire quarter-beat callback synchronized to audio time
      if (step % 4 === 0) {
        const beat = Math.floor(step / 4)
        const delayMs = Math.max(0, (t - ctx.currentTime) * 1000)
        setTimeout(() => {
          if (running) onQuarterBeat(beat)
        }, delayMs)
      }

      nextNoteTime += sixteenthDuration
      sixteenthCount++
    }

    // Re-run scheduler in 25ms
    schedulerTimer = setTimeout(scheduler, 25)
  }

  function start(bpm: number) {
    if (running) return
    const ctx = getCtx()
    running = true
    currentBpm = bpm
    sixteenthCount = 0
    nextNoteTime = ctx.currentTime + 0.05 // Small offset to avoid glitches
    onQuarterBeat(0) // Immediately emit beat 0
    scheduler()
  }

  function stop() {
    running = false
    if (schedulerTimer !== null) {
      clearTimeout(schedulerTimer)
      schedulerTimer = null
    }
  }

  function setBpm(bpm: number) {
    // Takes effect on next scheduled note — no restart needed
    currentBpm = bpm
  }

  function isRunning() {
    return running
  }

  return { start, stop, setBpm, isRunning }
}
