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
  /** Called after wrong animation completes — parent stays on same note */
  onWrong?: () => void
}

/** Imperative handle — parent exercise calls these when pitch detection responds */
export interface FlashCardHandle {
  triggerCorrect: () => void
  triggerWrong: () => void
}

// ─── FlashCard ────────────────────────────────────────────────────────────────

const FlashCard = forwardRef<FlashCardHandle, FlashCardProps>(function FlashCard(
  { value, stringIndex, onCorrect, onWrong },
  ref
) {
  const numRef = useRef<HTMLSpanElement>(null)
  // Track whichever animation is currently running so a new trigger
  // can cancel its pending timeout instead of being silently dropped.
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeKindRef = useRef<'correct' | 'wrong' | null>(null)

  useImperativeHandle(ref, () => {
    const clearPending = () => {
      if (pendingTimeoutRef.current !== null) {
        clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = null
      }
    }

    return {
      triggerCorrect() {
        // Idempotent within a single correct animation window — don't
        // stack multiple advances when polling fires repeatedly.
        if (activeKindRef.current === 'correct') return

        const el = numRef.current
        if (!el) return

        // Cancel any in-flight wrong animation. Correct always wins.
        clearPending()
        activeKindRef.current = 'correct'

        el.classList.remove('fc-correct', 'fc-wrong')
        el.style.color = ''
        // Force reflow to restart animation
        void el.offsetWidth
        el.classList.add('fc-correct')

        pendingTimeoutRef.current = setTimeout(() => {
          el.classList.remove('fc-correct')
          pendingTimeoutRef.current = null
          activeKindRef.current = null
          onCorrect?.()
        }, 210)
      },

      triggerWrong() {
        // If a correct animation is in flight, do not interrupt it.
        // If a wrong animation is in flight, do not stack it either —
        // the parent's cooldown is the source of truth for spacing.
        if (activeKindRef.current !== null) return

        const el = numRef.current
        if (!el) return

        activeKindRef.current = 'wrong'
        el.classList.remove('fc-correct', 'fc-wrong')
        void el.offsetWidth
        el.classList.add('fc-wrong')
        el.style.color = 'var(--color-text-tertiary)'

        pendingTimeoutRef.current = setTimeout(() => {
          el.classList.remove('fc-wrong')
          el.style.color = ''
          pendingTimeoutRef.current = null
          activeKindRef.current = null
          onWrong?.()
        }, 290)
      },
    }
  }, [onCorrect, onWrong])

  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes fc-correctScale {
          0%   { transform: scale(1);    color: var(--color-text-primary); }
          40%  { transform: scale(1.10); color: ${TEAL}; }
          100% { transform: scale(1);    color: var(--color-text-primary); }
        }
        @keyframes fc-shakeX {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        .fc-correct { animation: fc-correctScale 200ms ease-out forwards; }
        .fc-wrong   { animation: fc-shakeX 280ms ease-out forwards; }
      `}</style>

      {/* Card */}
      <div
        style={{
          border: '0.5px solid var(--color-border-secondary)',
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
