// Claude API integration
// Stub: will be implemented in the AI Trainer epic
// Uses user-supplied API key stored locally
// Model: claude-sonnet-4-20250514
// max_tokens: 150 (one-line response in v0.1)

export interface PerformanceSummary {
  timestamp: string
  exercise: string
  display_mode: 'fret_number' | 'note_name'
  note: string
  fret: number
  string: string
  response_time_ms: number
  beat_accuracy_ms: number
  correct: boolean
}
