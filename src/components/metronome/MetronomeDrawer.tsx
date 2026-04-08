// Metronome drawer — Story #19
// Minimal floating panel above bottom bar. Always in DOM, animated with translateY.
// Drag handle always visible. Tighter spacing, design-system-consistent.

import { useEffect, useRef, useState } from 'react'
import { useMetronome } from '../../state/metronome'

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
      el.style.transition = 'background 0ms, border-color 0ms'
      el.style.background = 'color-mix(in srgb, var(--color-text-secondary) 15%, transparent)'
      el.style.borderColor = 'var(--color-text-primary)'
    } else {
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

// ─── Drag handle (always visible) ───────────────────────────────────────────

interface DragHandleProps {
  onClick: () => void
}

export function MetronomeDragHandle({ onClick }: DragHandleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: 16,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
      aria-label="Toggle metronome drawer"
    >
      <div
        style={{
          width: 32,
          height: 3,
          borderRadius: 2,
          background: 'var(--color-border-secondary)',
        }}
      />
    </button>
  )
}

// ─── Drawer panel ───────────────────────────────────────────────────────────

interface MetronomeDrawerProps {
  open: boolean
}

export default function MetronomeDrawer({ open }: MetronomeDrawerProps) {
  const { bpm, beat, running, setBpm } = useMetronome()
  const [hasAnimated, setHasAnimated] = useState(false)

  // Enable animation after first render to prevent flash on mount
  useEffect(() => {
    requestAnimationFrame(() => setHasAnimated(true))
  }, [])

  return (
    <div
      style={{
        overflow: 'hidden',
        transition: hasAnimated ? (open ? 'max-height 200ms ease-out' : 'max-height 150ms ease-in') : 'none',
        maxHeight: open ? 100 : 0,
      }}
    >
      <div
        style={{
          background: 'var(--color-background-primary)',
          borderTop: '0.5px solid var(--color-border-secondary)',
        }}
      >
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto',
            padding: '8px 16px 8px',
          }}
        >
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

          {/* BPM controls — single row: −5 −1 [number BPM] +1 +5 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            {/* Left-justified decrease buttons */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { label: '−5', delta: -5 },
                { label: '−1', delta: -1 },
              ].map(({ label, delta }) => (
                <button
                  key={label}
                  onClick={() => setBpm(bpm + delta)}
                  style={{
                    padding: '2px 8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    fontWeight: 400,
                    borderRadius: 0,
                    border: '0.5px solid var(--color-border-secondary)',
                    background: 'var(--color-background-secondary)',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Centered BPM display */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  minWidth: 28,
                  textAlign: 'center',
                }}
              >
                {bpm}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: 400,
                  color: 'var(--color-text-tertiary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                BPM
              </span>
            </div>

            {/* Right-justified increase buttons */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { label: '+1', delta: 1 },
                { label: '+5', delta: 5 },
              ].map(({ label, delta }) => (
                <button
                  key={label}
                  onClick={() => setBpm(bpm + delta)}
                  style={{
                    padding: '2px 8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    fontWeight: 400,
                    borderRadius: 0,
                    border: '0.5px solid var(--color-border-secondary)',
                    background: 'var(--color-background-secondary)',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
