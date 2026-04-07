// FlashCard interaction tests — Story #27 followup
// Reproduces the bug where a wrong-animation in flight blocks a subsequent
// correct call. Correct must always win.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRef } from 'react'
import { render, cleanup } from '@testing-library/react'
import FlashCard, { type FlashCardHandle } from './FlashCard'

describe('FlashCard imperative handle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('triggerCorrect calls onCorrect after the animation completes', () => {
    const onCorrect = vi.fn()
    const ref = createRef<FlashCardHandle>()
    render(<FlashCard ref={ref} value="A" stringIndex={5} onCorrect={onCorrect} />)

    ref.current!.triggerCorrect()
    expect(onCorrect).not.toHaveBeenCalled()

    vi.advanceTimersByTime(250)
    expect(onCorrect).toHaveBeenCalledTimes(1)
  })

  it('triggerWrong calls onWrong after the animation completes', () => {
    const onWrong = vi.fn()
    const ref = createRef<FlashCardHandle>()
    render(<FlashCard ref={ref} value="A" stringIndex={5} onWrong={onWrong} />)

    ref.current!.triggerWrong()
    vi.advanceTimersByTime(320)
    expect(onWrong).toHaveBeenCalledTimes(1)
  })

  it('triggerCorrect during an in-flight wrong animation still fires onCorrect', () => {
    // This is the real-world failure mode: pitch detection emits a wrong
    // octave first, then the correct note milliseconds later. The correct
    // call must not be silently dropped.
    const onCorrect = vi.fn()
    const onWrong = vi.fn()
    const ref = createRef<FlashCardHandle>()
    render(
      <FlashCard
        ref={ref}
        value="A"
        stringIndex={5}
        onCorrect={onCorrect}
        onWrong={onWrong}
      />,
    )

    ref.current!.triggerWrong()
    // 50ms into the wrong animation, correct fires
    vi.advanceTimersByTime(50)
    ref.current!.triggerCorrect()

    // Advance well past the correct animation
    vi.advanceTimersByTime(250)
    expect(onCorrect).toHaveBeenCalledTimes(1)
  })

  it('back-to-back triggerCorrect calls only fire onCorrect once per animation', () => {
    // Sustained correct notes from the polling loop should not stack
    // multiple advances. This is the parent's job (latch), but FlashCard
    // should also be idempotent within a single animation window.
    const onCorrect = vi.fn()
    const ref = createRef<FlashCardHandle>()
    render(<FlashCard ref={ref} value="A" stringIndex={5} onCorrect={onCorrect} />)

    ref.current!.triggerCorrect()
    ref.current!.triggerCorrect()
    ref.current!.triggerCorrect()
    vi.advanceTimersByTime(250)
    expect(onCorrect).toHaveBeenCalledTimes(1)
  })

  it('a second triggerCorrect AFTER the first completes fires onCorrect again', () => {
    const onCorrect = vi.fn()
    const ref = createRef<FlashCardHandle>()
    render(<FlashCard ref={ref} value="A" stringIndex={5} onCorrect={onCorrect} />)

    ref.current!.triggerCorrect()
    vi.advanceTimersByTime(250)
    expect(onCorrect).toHaveBeenCalledTimes(1)

    ref.current!.triggerCorrect()
    vi.advanceTimersByTime(250)
    expect(onCorrect).toHaveBeenCalledTimes(2)
  })
})
