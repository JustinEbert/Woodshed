// Flash Card Component — Story #20
// Stateless display component. Renders one note challenge: string strip + large value.
// Sequence logic, pitch detection, and progression all live in the parent exercise.
// Prototype: docs/prototypes/woodshed_flashcard_proto_v1.html

import { forwardRef, useImperativeHandle, useRef } from 'react'

// ─── Constants (match tab component) ─────────────────────────────────────────

const STRING_COUNT   = 6
const STRING_SPACING = 14  // px — identical to tab component
const TEAL           = '#4ab8d4'

// String heights: index 0 = high e (top), index 5 = low E (bottom)
const STRING_HEIGHTS = [1, 1, 1, 1, 1, 2.5] // px

// ─── String strip ─────────────────────────────────────────────────────────────

function StringStrip({ stringIndex }: { stringIndex: number }) {
  const totalHeight = (STRING_COUNT - 1) * STRING_SPACING

  return (
    <div
      style={{
        position: 'relative',
        width: 48,
        height: totalHeight,
        flexShrink: 0,
      }}
    >
      {Array.from({ length: STRING_COUNT }, (_, i) => {
        const isActive = i === stringIndex
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: i * STRING_SPACING,
              height: isActive ? 2.5 : STRING_HEIGHTS[i],
              background: isActive ? TEAL : 'var(--color-border-secondary)',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlashCardProps {
  /** Display text: fret number ("3") or note name ("G") */
  value: string
  /** String index: 0 = high e, 5 = low E */
  stringIndex: number
  /** Called after correct animation completes — parent advances to next note */
  onCorrect?: () => void
}

/** Imperative handle — parent exercise calls when sustain threshold is reached */
export interface FlashCardHandle {
  triggerCorrect: () => void
}

// ─── FlashCard ────────────────────────────────────────────────────────────────

const FlashCard = forwardRef<FlashCardHandle, FlashCardProps>(function FlashCard(
  { value, stringIndex, onCorrect },
  ref
) {
  const numRef = useRef<HTMLSpanElement>(null)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animatingRef = useRef(false)

  useImperativeHandle(ref, () => ({
    triggerCorrect() {
      // Idempotent within a single animation window
      if (animatingRef.current) return

      const el = numRef.current
      if (!el) return

      animatingRef.current = true
      el.classList.remove('fc-correct')
      // Force reflow to restart animation
      void el.offsetWidth
      el.classList.add('fc-correct')

      pendingTimeoutRef.current = setTimeout(() => {
        el.classList.remove('fc-correct')
        pendingTimeoutRef.current = null
        animatingRef.current = false
        onCorrect?.()
      }, 210)
    },
  }), [onCorrect])

  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes fc-correctScale {
          0%   { transform: scale(1);    color: var(--color-text-primary); }
          40%  { transform: scale(1.10); color: ${TEAL}; }
          100% { transform: scale(1);    color: var(--color-text-primary); }
        }
        .fc-correct { animation: fc-correctScale 200ms ease-out forwards; }
      `}</style>

      {/* Card */}
      <div
        style={{
          height: 120,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/*
          Centered unit: string strip + number value.
          MUST use flexbox centering — not position:absolute — to avoid
          jump artifacts when transform animations run on the number element.
        */}
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <StringStrip stringIndex={stringIndex} />

          <span
            ref={numRef}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 76,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1,
              background: 'transparent',
              flexShrink: 0,
              display: 'block',
            }}
          >
            {value}
          </span>
        </div>
      </div>
    </>
  )
})

export default FlashCard
