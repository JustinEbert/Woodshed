// Metronome drawer — Story #11
// Slide-up drawer, v6 design ported from prototype.
// 4 sharp-cornered cells with drum pattern bars, BPM controls.

import { useEffect, useRef } from 'react'
import { useMetronome, MIN_BPM, MAX_BPM } from '../../state/metronome'

// ─── Drum pattern (same as audio engine) ─────────────────────────────────────

const KICK = new Set([0, 8, 10])
const SNARE = new Set([4, 12])
const HAT = new Set([0, 2, 4, 6, 8, 10, 12, 14])

function opacityFor(step: number): number {
  let v = 0
  if (KICK.has(step)) v += 0.80
  if (SNARE.has(step)) v += 0.50
  if (HAT.has(step)) v += 0.25
  return Math.min(1, v)
}

function barHeight(step: number): string {
  if (KICK.has(step)) return '100%'
  if (SNARE.has(step)) return '50%'
  if (HAT.has(step)) return '25%'
  return '0%'
}

function hasBar(step: number): boolean {
  return KICK.has(step) || SNARE.has(step) || HAT.has(step)
}

// ─── Beat cell ───────────────────────────────────────────────────────────────

function BeatCell({ beatIndex, active }: { beatIndex: number; active: boolean }) {
  const cellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = cellRef.current
    if (!el) return

    if (active) {
      // Instant attack
      el.style.transition = 'background 0ms, border-color 0ms'
      el.style.background = 'color-mix(in srgb, var(--color-text-secondary) 15%, transparent)'
      el.style.borderColor = 'var(--color-text-primary)'
    } else {
      // 120ms fade release
      el.style.transition = 'background 120ms ease, border-color 120ms ease'
      el.style.background = 'transparent'
      el.style.borderColor = 'var(--color-border-secondary)'
    }
  }, [active])

  return (
    <div
      ref={cellRef}
      style={{
        height: 24,
        borderRadius: 0,
        border: '1.5px solid var(--color-border-secondary)',
        background: 'transparent',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
      }}
    >
      {/* Subdivision lines at 25%, 50%, 75% */}
      {[25, 50, 75].map(pct => (
        <div
          key={pct}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pct}%`,
            width: 1,
            background: 'var(--color-border-tertiary)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* 4 sixteenth-note slots per beat */}
      {[0, 1, 2, 3].map(sub => {
        const step = beatIndex * 4 + sub
        const show = hasBar(step)
        return (
          <div key={sub} style={{ position: 'relative', height: '100%' }}>
            {show && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 1,
                  right: 1,
                  height: barHeight(step),
                  background: '#4ab8d4',
                  opacity: opacityFor(step),
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

interface MetronomeDrawerProps {
  open: boolean
  onClose: () => void
}

export default function MetronomeDrawer({ open, onClose }: MetronomeDrawerProps) {
  const { bpm, beat, running, setBpm, toggle } = useMetronome()

  if (!open) return null

  return (
    <>
      {/* Backdrop — tap to dismiss */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'var(--color-background-primary)',
          borderTop: '0.5px solid var(--color-border-secondary)',
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            padding: '12px 16px 24px',
          }}
        >
          {/* Drag handle */}
          <div
            onClick={onClose}
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '4px 0 12px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 32,
                height: 3,
                borderRadius: 2,
                background: 'var(--color-border-secondary)',
              }}
            />
          </div>

          {/* Beat grid — 4 cells */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 4,
            }}
          >
            {[0, 1, 2, 3].map(b => (
              <BeatCell key={b} beatIndex={b} active={running && beat === b} />
            ))}
          </div>

          {/* BPM display + play/stop */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginTop: 16,
            }}
          >
            <button
              onClick={toggle}
              style={{
                background: running ? 'var(--color-accent)' : 'var(--color-background-secondary)',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 0,
                color: running ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
                padding: '6px 16px',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                cursor: 'pointer',
                minHeight: 36,
              }}
            >
              {running ? 'Stop' : 'Play'}
            </button>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 20,
                color: 'var(--color-text-primary)',
                minWidth: 60,
                textAlign: 'center',
              }}
            >
              {bpm}
            </span>

            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-tertiary)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              BPM
            </span>
          </div>

          {/* BPM slider */}
          <div style={{ marginTop: 12 }}>
            <input
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--color-accent)',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* ±1 / ±5 buttons */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 12,
              justifyContent: 'center',
            }}
          >
            {[
              { label: '−5', delta: -5 },
              { label: '−1', delta: -1 },
              { label: '+1', delta: 1 },
              { label: '+5', delta: 5 },
            ].map(({ label, delta }) => (
              <button
                key={label}
                onClick={() => setBpm(bpm + delta)}
                style={{
                  flex: 1,
                  maxWidth: 64,
                  padding: '8px 0',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 0,
                  border: '0.5px solid var(--color-border-secondary)',
                  background: 'var(--color-background-secondary)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  minHeight: 36,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
