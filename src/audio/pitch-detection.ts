// Pitch detection engine — Story #24
// Pure YIN algorithm implementation. No browser APIs, no AudioContext.
// Takes a raw audio buffer + sample rate, returns frequency + confidence.
//
// Reference: De Cheveigné & Kawahara, "YIN, a fundamental frequency estimator
// for speech and music" (2002).

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PitchResult {
  /** Estimated fundamental frequency in Hz */
  frequency: number
  /** Confidence score: 0 (uncertain) to 1 (very confident) */
  confidence: number
}

// ─── YIN Algorithm ───────────────────────────────────────────────────────────

/**
 * Detect pitch from an audio buffer using the YIN algorithm.
 *
 * @param buffer - Raw audio samples (Float32Array), typically 2048–4096 samples.
 * @param sampleRate - Sample rate in Hz (e.g. 44100).
 * @param threshold - Confidence threshold 0–1. Detections below this are rejected.
 *   Default: 0.85. Higher = stricter, fewer false positives.
 * @returns PitchResult with frequency and confidence, or null if no clear pitch.
 */
export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = 0.85,
): PitchResult | null {
  const halfLen = Math.floor(buffer.length / 2)

  // Need a minimum buffer size for meaningful analysis
  if (halfLen < 2) return null

  // ── Step 1: Difference function ──────────────────────────────────────────
  // For each lag τ, compute the squared difference between the signal
  // and a delayed version of itself.

  const diff = new Float32Array(halfLen)
  for (let tau = 0; tau < halfLen; tau++) {
    let sum = 0
    for (let i = 0; i < halfLen; i++) {
      const delta = buffer[i] - buffer[i + tau]
      sum += delta * delta
    }
    diff[tau] = sum
  }

  // ── Step 2: Cumulative mean normalized difference (CMND) ─────────────────
  // Normalizes the difference function so we can apply a fixed threshold.
  // CMND'(0) = 1 by definition.

  const cmnd = new Float32Array(halfLen)
  cmnd[0] = 1
  let runningSum = 0
  for (let tau = 1; tau < halfLen; tau++) {
    runningSum += diff[tau]
    cmnd[tau] = diff[tau] / (runningSum / tau)
  }

  // ── Step 3: Absolute threshold ───────────────────────────────────────────
  // Find the first tau where CMND dips below the threshold.
  // This corresponds to a confident period estimate.
  // The lower the CMND value, the higher the confidence.

  const yinThreshold = 1 - threshold  // e.g. threshold 0.85 → look for CMND < 0.15

  let tauEstimate = -1
  for (let tau = 2; tau < halfLen; tau++) {
    if (cmnd[tau] < yinThreshold) {
      // Walk forward to find the local minimum (best match in this dip)
      while (tau + 1 < halfLen && cmnd[tau + 1] < cmnd[tau]) {
        tau++
      }
      tauEstimate = tau
      break
    }
  }

  // No confident period found
  if (tauEstimate === -1) return null

  // ── Step 4: Parabolic interpolation ──────────────────────────────────────
  // Refine the tau estimate to sub-sample accuracy using the three points
  // around the minimum.

  let betterTau = tauEstimate
  if (tauEstimate > 0 && tauEstimate < halfLen - 1) {
    const s0 = cmnd[tauEstimate - 1]
    const s1 = cmnd[tauEstimate]
    const s2 = cmnd[tauEstimate + 1]
    const shift = (s0 - s2) / (2 * (s0 - 2 * s1 + s2))
    if (isFinite(shift)) {
      betterTau = tauEstimate + shift
    }
  }

  // ── Result ───────────────────────────────────────────────────────────────

  const frequency = sampleRate / betterTau
  const confidence = 1 - cmnd[tauEstimate]

  // Sanity: reject frequencies outside useful range
  if (frequency < 20 || frequency > 5000) return null

  return {
    frequency,
    confidence: Math.max(0, Math.min(1, confidence)),
  }
}
