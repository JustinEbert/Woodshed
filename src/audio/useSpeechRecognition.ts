// Shared voice engine — Story #55
// Wraps Web Speech API for both exercise (short utterances) and trainer
// (free-form speech) voice input. Chrome routes speech through Google
// servers — network is always required.

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type SpeechMode = 'exercise' | 'trainer'

export interface SpeechError {
  code: string
  message: string
}

export interface UseSpeechRecognitionOptions {
  mode: SpeechMode
  onResult: (transcript: string) => void
  onError: (error: SpeechError) => void
  /** If true, automatically restart recognition after each result (exercise mode). */
  autoRestart?: boolean
}

export interface UseSpeechRecognitionResult {
  start: () => void
  stop: () => void
  cancel: () => void
  isListening: boolean
  isAvailable: boolean
  isOnline: boolean
}

// ─── Browser compat ──────────────────────────────────────────────────────────

type SpeechRecognitionType = typeof window.SpeechRecognition

function getSpeechRecognitionCtor(): SpeechRecognitionType | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions,
): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  const isAvailable = getSpeechRecognitionCtor() !== null

  // Stale-closure prevention: keep callbacks in refs
  const onResultRef = useRef(options.onResult)
  useEffect(() => { onResultRef.current = options.onResult }, [options.onResult])

  const onErrorRef = useRef(options.onError)
  useEffect(() => { onErrorRef.current = options.onError }, [options.onError])

  const modeRef = useRef(options.mode)
  useEffect(() => { modeRef.current = options.mode }, [options.mode])

  const autoRestartRef = useRef(options.autoRestart ?? false)
  useEffect(() => { autoRestartRef.current = options.autoRestart ?? false }, [options.autoRestart])

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const listeningRef = useRef(false)
  // Tracks whether stop()/cancel() was called explicitly by the consumer
  const stoppedManuallyRef = useRef(false)

  // ── Online/offline tracking ────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ── Start ──────────────────────────────────────────────────────────────

  // startRef allows onend to call the latest start() without stale closures
  const startRef = useRef<() => void>(() => {})

  const start = useCallback(() => {
    if (listeningRef.current) return

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor || !navigator.onLine) return

    stoppedManuallyRef.current = false

    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.continuous = false

    if (modeRef.current === 'exercise') {
      recognition.interimResults = false
    } else {
      recognition.interimResults = true
    }

    recognition.onstart = () => {
      listeningRef.current = true
      setIsListening(true)
    }

    recognition.onend = () => {
      listeningRef.current = false
      setIsListening(false)
      recognitionRef.current = null

      // Auto-restart if enabled and not explicitly stopped by consumer
      if (autoRestartRef.current && !stoppedManuallyRef.current) {
        startRef.current()
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (modeRef.current === 'trainer') {
        // Trainer mode: emit on every result (interim + final)
        const last = event.results[event.results.length - 1]
        onResultRef.current(last[0].transcript)
      } else {
        // Exercise mode: emit only final results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            onResultRef.current(event.results[i][0].transcript)
          }
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onErrorRef.current({
        code: event.error,
        message: event.message,
      })
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  useEffect(() => { startRef.current = start }, [start])

  // ── Stop (graceful — triggers final result) ────────────────────────────

  const stop = useCallback(() => {
    stoppedManuallyRef.current = true
    recognitionRef.current?.stop()
  }, [])

  // ── Cancel (abort — no result fired) ───────────────────────────────────

  const cancel = useCallback(() => {
    stoppedManuallyRef.current = true
    recognitionRef.current?.abort()
  }, [])

  // ── Cleanup on unmount ─────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stoppedManuallyRef.current = true
      recognitionRef.current?.abort()
      recognitionRef.current = null
      listeningRef.current = false
    }
  }, [])

  return { start, stop, cancel, isListening, isAvailable, isOnline }
}
