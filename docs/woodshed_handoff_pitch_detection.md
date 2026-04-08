---
id: woodshed-handoff-pitch-detection
version: 1.0.0
status: ready-for-implementation
date: 2026-04-07
related_spec: woodshed_spec_v0.2.md
prototype: docs/prototypes/woodshed_pitch_diagnostic_v4.html
---

# Woodshed — Pitch Detection Handoff

## Summary

Pitch detection has been researched, diagnosed, and tuned through four
iterations of a diagnostic tool. The working configuration is documented
here for implementation in the production app.

The diagnostic prototype is at:
`docs/prototypes/woodshed_pitch_diagnostic_v4.html`
Open it in Chrome/Safari for live testing with mic access.

---

## Signal chain (production implementation)

```
mic input
  → rawAnalyser          (pre-everything, for gate metering only)
  → HPF node 1           (highpass, 70Hz, Q=0.707, Butterworth)
  → HPF node 2           (same — cascaded = 2-pole = 12dB/oct rolloff)
  → gainNode             (pre-gain boost, default 12×)
  → analyser             (post-gain, for YIN input + waveform)
  → [no output]          (analysis only — never connect to destination)
```

Critical: do NOT connect to audioCtx.destination. Analysis only.

### Web Audio API implementation

```js
const audioCtx = new AudioContext({ sampleRate: 44100 });
const source   = audioCtx.createMediaStreamSource(micStream);

// Raw analyser — for noise gate metering (pre-processing)
const rawAnalyser = audioCtx.createAnalyser();
rawAnalyser.fftSize = 2048;
rawAnalyser.smoothingTimeConstant = 0;
source.connect(rawAnalyser);

// Two-pole HPF — removes sub-bass room noise before gain amplifies it
const hpf1 = audioCtx.createBiquadFilter();
hpf1.type = 'highpass';
hpf1.frequency.value = 70;   // Hz
hpf1.Q.value = 0.707;        // Butterworth

const hpf2 = audioCtx.createBiquadFilter();
hpf2.type = 'highpass';
hpf2.frequency.value = 70;
hpf2.Q.value = 0.707;

// Pre-gain boost
const gainNode = audioCtx.createGain();
gainNode.gain.value = 12;    // 12× default

// Post-gain analyser — YIN input
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0;  // no smoothing — raw signal for YIN

// Wire it up
source.connect(hpf1);
hpf1.connect(hpf2);
hpf2.connect(gainNode);
gainNode.connect(analyser);
```

### Mic constraints (critical)

```js
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,  // must be off — kills guitar tone
    noiseSuppression: false,  // must be off — kills guitar tone
    autoGainControl:  false,  // must be off — fights our gain stage
    sampleRate: 44100,
  }
});
```

---

## Tuned parameters

These values were determined through testing on Mac built-in mic,
quiet environment, acoustic guitar played at moderate volume.

| Parameter | Value | Notes |
|---|---|---|
| Sample rate | 44100 Hz | Standard audio |
| Buffer size (fftSize) | 2048 | ~46ms at 44100Hz |
| HPF cutoff | 70 Hz | 2-pole, removes 49-62Hz room noise |
| Pre-gain | 12× | Boosts quiet mic signal before YIN |
| Noise gate | -60 dB | Applied to RAW (pre-gain) signal |
| YIN threshold | 0.15 | Standard value, works well |
| Min confidence | 0.70 | Rejects detections below 70% |
| Guitar freq range | 70–1400 Hz | Low E2 (82Hz) to high e5 (1319Hz) |
| Median window | 5 frames | Must be odd number |

---

## YIN pitch detection

Use the YIN implementation from the diagnostic prototype as the reference.
Key details:

```js
function yin(buffer, sampleRate, threshold = 0.15) {
  const N     = buffer.length;
  const halfN = Math.floor(N / 2);

  // 1. Difference function
  const diff = new Float32Array(halfN);
  for (let tau = 1; tau < halfN; tau++) {
    for (let i = 0; i < halfN; i++) {
      const d = buffer[i] - buffer[i + tau];
      diff[tau] += d * d;
    }
  }

  // 2. Cumulative mean normalised difference
  const cmnd = new Float32Array(halfN);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfN; tau++) {
    runningSum += diff[tau];
    cmnd[tau] = runningSum === 0 ? 0 : diff[tau] * tau / runningSum;
  }

  // 3. Find first dip below threshold
  let tau = 2;
  while (tau < halfN) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 < halfN && cmnd[tau + 1] < cmnd[tau]) tau++;
      break;
    }
    tau++;
  }
  if (tau === halfN || cmnd[tau] >= threshold) return null;

  // 4. Parabolic interpolation
  const x0 = tau > 0 ? tau - 1 : tau;
  const x2 = tau < halfN - 1 ? tau + 1 : tau;
  let betterTau;
  if (x0 === tau) {
    betterTau = cmnd[tau] <= cmnd[x2] ? tau : x2;
  } else if (x2 === tau) {
    betterTau = cmnd[tau] <= cmnd[x0] ? tau : x0;
  } else {
    const s0 = cmnd[x0], s1 = cmnd[tau], s2 = cmnd[x2];
    betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  return {
    freq:       sampleRate / betterTau,
    confidence: 1 - cmnd[tau],
  };
}
```

---

## Median filter (octave jitter fix)

This is the most important addition over a naive YIN implementation.
Operates on MIDI note numbers (integers), not Hz.
Working in semitone space means B2(47) and B3(59) are clearly separated.

```js
// freqBuffer: rolling array of MIDI note integers, max length MEDIAN_SIZE
const MEDIAN_SIZE = 5;  // must be odd
let freqBuffer = [];

function medianMidi(buffer) {
  const sorted = [...buffer].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function freqToMidi(freq) {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

function midiToNote(midi) {
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const octave = Math.floor(midi / 12) - 1;
  const name   = NOTE_NAMES[((midi % 12) + 12) % 12];
  const freq   = 440 * Math.pow(2, (midi - 69) / 12);
  const cents  = 0; // exact for median output
  return { name, octave, fullName: name + octave, freq, midi };
}

// In the detection loop:
function processDetection(yinResult, sampleRate) {
  if (!yinResult) return null;
  const { freq, confidence } = yinResult;

  // Range check
  if (freq < 70 || freq > 1400) return null;
  if (confidence < 0.70) return null;

  // Push to median buffer
  const midi = freqToMidi(freq);
  freqBuffer.push(midi);
  if (freqBuffer.length > MEDIAN_SIZE) freqBuffer.shift();

  // Need full buffer before reporting
  if (freqBuffer.length < MEDIAN_SIZE) return null;

  // Return median note
  const medianMidiVal = medianMidi(freqBuffer);
  return midiToNote(medianMidiVal);
}
```

---

## Noise gate

Apply to the RAW analyser (pre-gain), not the post-gain signal.
Gate on raw signal = honest acoustic threshold.
Gate on post-gain signal = noisy room at -60dB gets boosted to -40dB
and passes the gate — wrong behaviour.

```js
function getRmsDb(analyserNode) {
  const data = new Float32Array(analyserNode.fftSize);
  analyserNode.getFloatTimeDomainData(data);
  let rms = 0;
  for (let i = 0; i < data.length; i++) rms += data[i] * data[i];
  rms = Math.sqrt(rms / data.length);
  return rms > 0 ? 20 * Math.log10(rms) : -100;
}

// In loop:
const rawDb = getRmsDb(rawAnalyser);
if (rawDb < -60) {
  freqBuffer = []; // clear buffer when silent
  return null;
}
```

---

## Known limitations

**Octave jitter on open strings:**
The median filter eliminates single-frame jitter but cannot fix cases
where YIN is consistently wrong for 5+ frames (e.g. G2/G3 alternating
in stable 5-frame runs). Root cause: open string harmonics can dominate
the fundamental. The diagnostic showed this happens occasionally on
G and B strings. Recommended future fix: octave preference logic —
if detected note is exactly one octave above the previous stable note,
prefer the lower octave when in guitar context.

**Quiet environments / built-in Mac mic:**
At -54dB raw the signal is at the hardware noise floor. Pre-gain of 12×
helps but the fundamental issue is mic sensitivity. The app works well
in normal practice environments (bedroom, studio). Document the supported
use case as: moderate volume playing, reasonable room acoustics.

**HPF and low E:**
The low E string fundamental is 82Hz. HPF at 70Hz provides ~6dB of
attenuation at 70Hz with the 2-pole filter. The string is still detected
correctly. If the HPF is raised above 80Hz, low E detection degrades.
Do not raise the HPF cutoff above 75Hz in production.

---

## GitHub stories to create

### New story: Pitch detection service

**Title:** `[STORY] Pitch detection service — YIN + median filter`
**Epic:** Note Flash Exercise
**Labels:** `story` `component:audio` `priority:p0`

**Description:**
Implement production pitch detection as a reusable service/hook.
Use the signal chain, YIN implementation, and median filter documented
in `docs/woodshed_handoff_pitch_detection.md`.
Replace the simulated "Next" button in Note Flash v1.

Acceptance criteria:
- [ ] Web Audio API signal chain matches spec exactly (HPF × 2, gain, analyser)
- [ ] Mic constraints: echoCancellation, noiseSuppression, autoGainControl all false
- [ ] YIN implementation matches reference (de Cheveigné & Kawahara 2002)
- [ ] Median filter operates on MIDI integers, window size 5
- [ ] Noise gate applied to raw (pre-gain) signal at -60dB
- [ ] Returns null when below gate, no pitch found, or low confidence
- [ ] Returns { name, octave, fullName, freq, midi } on confident detection
- [ ] Guitar frequency range enforced: 70–1400Hz
- [ ] No audio output — analysis only (never connect to destination)
- [ ] Graceful handling of mic permission denied
- [ ] Works as a React hook: usePitchDetection({ onNote: fn })

### Update story: Note Flash v1

**Title:** Update `[STORY] Note Flash v1` — wire pitch detection
**Update:** Replace simulated Next button with usePitchDetection hook.
onNote callback compares detected note against expected note.
Call onCorrect() or onWrong() on the FlashCard component accordingly.
