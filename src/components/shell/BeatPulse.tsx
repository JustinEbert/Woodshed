// Beat pulse indicator — Story #3
// Small circle, top-left of top bar. Teal fill on quarter beat,
// instant attack, 400ms fade back to transparent.

import { useEffect, useRef } from 'react'
import { useMetronome } from '../../state/metronome'

export default function BeatPulse() {
  const { beat, running } = useMetronome()
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = dotRef.current
    if (!el || !running) return

    // Instant attack: jump to full opacity
    el.style.transition = 'none'
    el.style.opacity = '1'

    // Force reflow so the browser applies the instant value
    el.offsetHeight

    // 400ms fade back to resting opacity
    el.style.transition = 'opacity 400ms ease-out'
    el.style.opacity = '0.15'
  }, [beat, running])

  return (
    <div
      ref={dotRef}
      className="rounded-full shrink-0"
      style={{
        width: 10,
        height: 10,
        background: 'var(--color-accent)',
        opacity: running ? 0.15 : 0.15,
      }}
    />
  )
}
