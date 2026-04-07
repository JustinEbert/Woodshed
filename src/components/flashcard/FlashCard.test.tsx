// FlashCard interaction tests — Story #33
// Wrong-answer mechanic removed. Only correct advance remains.

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

  it('back-to-back triggerCorrect calls only fire onCorrect once per animation', () => {
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

  it('outer card has no border', () => {
    const ref = createRef<FlashCardHandle>()
    const { container } = render(
      <FlashCard ref={ref} value="A" stringIndex={5} />,
    )
    // The outer card div is the first div with explicit height: 120px
    const card = container.querySelector('div[style*="height: 120"]') as HTMLElement
    expect(card).toBeTruthy()
    expect(card.style.border).toBe('')
  })
})
