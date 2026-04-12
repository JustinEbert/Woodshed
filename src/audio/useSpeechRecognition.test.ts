import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechRecognition } from './useSpeechRecognition'

// ─── Mock SpeechRecognition ─────────────────────────────────────────────────

class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null

  start = vi.fn(() => { this.onstart?.() })
  stop = vi.fn(() => { this.onend?.() })
  abort = vi.fn(() => { this.onend?.() })
}

let lastInstance: MockSpeechRecognition | null = null

function installMock() {
  lastInstance = null
  // Use a real class so `new Ctor()` works — vi.fn() wrappers aren't constructors
  class CapturingSpeechRecognition extends MockSpeechRecognition {
    constructor() {
      super()
      lastInstance = this
    }
  }
  Object.defineProperty(window, 'SpeechRecognition', {
    value: CapturingSpeechRecognition,
    writable: true,
    configurable: true,
  })
}

function removeMock() {
  Object.defineProperty(window, 'SpeechRecognition', {
    value: undefined,
    writable: true,
    configurable: true,
  })
  // Also remove webkit prefix if set
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: undefined,
    writable: true,
    configurable: true,
  })
  lastInstance = null
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function defaultOptions() {
  return {
    mode: 'exercise' as const,
    onResult: vi.fn(),
    onError: vi.fn(),
  }
}

function makeSpeechResultEvent(transcript: string, isFinal: boolean) {
  return {
    resultIndex: 0,
    results: [
      Object.assign([{ transcript, confidence: 0.9 }], { isFinal }),
    ],
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  })

  afterEach(() => {
    removeMock()
    vi.restoreAllMocks()
  })

  // ── Availability ────────────────────────────────────────────────────────

  it('isAvailable is false when SpeechRecognition is undefined', () => {
    removeMock()
    const { result } = renderHook(() => useSpeechRecognition(defaultOptions()))
    expect(result.current.isAvailable).toBe(false)
  })

  it('isAvailable is true when SpeechRecognition is defined', () => {
    installMock()
    const { result } = renderHook(() => useSpeechRecognition(defaultOptions()))
    expect(result.current.isAvailable).toBe(true)
  })

  // ── Start guards ────────────────────────────────────────────────────────

  it('start() is a no-op when unavailable', () => {
    removeMock()
    const { result } = renderHook(() => useSpeechRecognition(defaultOptions()))
    act(() => { result.current.start() })
    expect(result.current.isListening).toBe(false)
  })

  it('start() is a no-op when offline', () => {
    installMock()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useSpeechRecognition(defaultOptions()))
    act(() => { result.current.start() })
    expect(result.current.isListening).toBe(false)
    expect(lastInstance).toBeNull()
  })

  // ── Mode configuration ─────────────────────────────────────────────────

  it('exercise mode: continuous=false, interimResults=false', () => {
    installMock()
    const { result } = renderHook(() =>
      useSpeechRecognition({ ...defaultOptions(), mode: 'exercise' }),
    )
    act(() => { result.current.start() })
    expect(lastInstance!.continuous).toBe(false)
    expect(lastInstance!.interimResults).toBe(false)
  })

  it('trainer mode: continuous=false, interimResults=true', () => {
    installMock()
    const { result } = renderHook(() =>
      useSpeechRecognition({ ...defaultOptions(), mode: 'trainer' }),
    )
    act(() => { result.current.start() })
    expect(lastInstance!.continuous).toBe(false)
    expect(lastInstance!.interimResults).toBe(true)
  })

  // ── Results ─────────────────────────────────────────────────────────────

  it('exercise mode fires onResult only for final results', () => {
    installMock()
    const onResult = vi.fn()
    const { result } = renderHook(() =>
      useSpeechRecognition({ ...defaultOptions(), onResult }),
    )
    act(() => { result.current.start() })

    // Interim — should not fire
    act(() => { lastInstance!.onresult?.(makeSpeechResultEvent('fo', false)) })
    expect(onResult).not.toHaveBeenCalled()

    // Final — should fire
    act(() => { lastInstance!.onresult?.(makeSpeechResultEvent('four', true)) })
    expect(onResult).toHaveBeenCalledWith('four')
  })

  it('trainer mode fires onResult for interim results', () => {
    installMock()
    const onResult = vi.fn()
    const { result } = renderHook(() =>
      useSpeechRecognition({ ...defaultOptions(), mode: 'trainer', onResult }),
    )
    act(() => { result.current.start() })

    act(() => { lastInstance!.onresult?.(makeSpeechResultEvent('hel', false)) })
    expect(onResult).toHaveBeenCalledWith('hel')
  })

  // ── Errors ──────────────────────────────────────────────────────────────

  it('onerror fires onError callback', () => {
    installMock()
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useSpeechRecognition({ ...defaultOptions(), onError }),
    )
    act(() => { result.current.start() })

    act(() => {
      lastInstance!.onerror?.({ error: 'network', message: 'Network error' })
    })
    expect(onError).toHaveBeenCalledWith({
      code: 'network',
      message: 'Network error',
    })
  })

  // ── Stop / cancel ──────────────────────────────────────────────────────

  it('stop() calls recognition.stop()', () => {
    installMock()
    const { result } = renderHook(() => useSpeechRecognition(defaultOptions()))
    act(() => { result.current.start() })
    act(() => { result.current.stop() })
    expect(lastInstance!.stop).toHaveBeenCalled()
  })

  it('cancel() calls recognition.abort()', () => {
    installMock()
    const { result } = renderHook(() => useSpeechRecognition(defaultOptions()))
    act(() => { result.current.start() })
    act(() => { result.current.cancel() })
    expect(lastInstance!.abort).toHaveBeenCalled()
  })

  // ── Online/offline events ──────────────────────────────────────────────

  it('online/offline events update isOnline', () => {
    installMock()
    const { result } = renderHook(() => useSpeechRecognition(defaultOptions()))
    expect(result.current.isOnline).toBe(true)

    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(result.current.isOnline).toBe(false)

    act(() => { window.dispatchEvent(new Event('online')) })
    expect(result.current.isOnline).toBe(true)
  })

  // ── Cleanup on unmount ─────────────────────────────────────────────────

  it('unmount aborts active recognition', () => {
    installMock()
    const { result, unmount } = renderHook(() =>
      useSpeechRecognition(defaultOptions()),
    )
    act(() => { result.current.start() })
    const instance = lastInstance!
    unmount()
    expect(instance.abort).toHaveBeenCalled()
  })

  // ── Listening state ────────────────────────────────────────────────────

  it('isListening reflects recognition lifecycle', () => {
    installMock()
    const { result } = renderHook(() => useSpeechRecognition(defaultOptions()))
    expect(result.current.isListening).toBe(false)

    act(() => { result.current.start() })
    expect(result.current.isListening).toBe(true)

    act(() => { result.current.stop() })
    expect(result.current.isListening).toBe(false)
  })

  // ── Auto-restart ───────────────────────────────────────────────────────

  it('autoRestart: restarts recognition after onend', () => {
    installMock()
    const { result } = renderHook(() =>
      useSpeechRecognition({ ...defaultOptions(), autoRestart: true }),
    )
    act(() => { result.current.start() })
    const firstInstance = lastInstance!

    // Simulate recognition ending naturally (not via stop/cancel)
    act(() => { firstInstance.onend?.() })

    // A new instance should have been created and started
    expect(lastInstance).not.toBe(firstInstance)
    expect(lastInstance!.start).toHaveBeenCalled()
  })

  it('autoRestart: does NOT restart after manual stop()', () => {
    installMock()
    const { result } = renderHook(() =>
      useSpeechRecognition({ ...defaultOptions(), autoRestart: true }),
    )
    act(() => { result.current.start() })
    const firstInstance = lastInstance!

    act(() => { result.current.stop() })

    // lastInstance should still be the first one (no new instance created)
    expect(lastInstance).toBe(firstInstance)
  })

  it('autoRestart: does NOT restart after cancel()', () => {
    installMock()
    const { result } = renderHook(() =>
      useSpeechRecognition({ ...defaultOptions(), autoRestart: true }),
    )
    act(() => { result.current.start() })
    const firstInstance = lastInstance!

    act(() => { result.current.cancel() })

    expect(lastInstance).toBe(firstInstance)
  })
})
