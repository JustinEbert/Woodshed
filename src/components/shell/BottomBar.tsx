interface BottomBarProps {
  /** Current exercise name — null when idle */
  exerciseName?: string | null
  /** Called when user taps the exercise name area */
  onExerciseTap?: () => void
  /** Called when user taps the metronome icon */
  onMetronomeTap?: () => void
  /** Called when user taps the settings icon */
  onSettingsTap?: () => void
}

export default function BottomBar({
  exerciseName,
  onExerciseTap,
  onMetronomeTap,
  onSettingsTap,
}: BottomBarProps) {
  return (
    <nav
      className="flex items-center px-3 shrink-0"
      style={{
        height: 44,
        borderTop: '0.5px solid var(--color-border-secondary)',
      }}
    >
      {/* Exercise name / navigation trigger */}
      <button
        type="button"
        onClick={onExerciseTap}
        className="flex-1 text-left flex items-center gap-1 min-w-0"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          minHeight: 44,
        }}
      >
        <span
          className="truncate text-[13px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {exerciseName ?? 'tap to choose an exercise'}
        </span>
        <span
          className="text-[11px] shrink-0"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          ↕
        </span>
      </button>

      {/* Action icons */}
      <div className="flex items-center gap-2 ml-3">
        {/* Settings icon */}
        <button
          type="button"
          onClick={onSettingsTap}
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 44,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            fontSize: 18,
          }}
          aria-label="Settings"
        >
          ⚙
        </button>

        {/* Metronome icon */}
        <button
          type="button"
          onClick={onMetronomeTap}
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 44,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
            fontSize: 18,
          }}
          aria-label="Metronome"
        >
          ⏱
        </button>
      </div>
    </nav>
  )
}
