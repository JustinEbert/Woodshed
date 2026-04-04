import { useMetronome } from '../../state/metronome'

// ─── SVG Icons ──────────────────────────────────────────────────────────────

function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.4 3.4l1.4 1.4M15.2 15.2l1.4 1.4M3.4 16.6l1.4-1.4M15.2 4.8l1.4-1.4" />
    </svg>
  )
}

function MetronomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 18l2-14h4l2 14" />
      <path d="M5 18h10" />
      <path d="M10 10l4-5" />
    </svg>
  )
}

function ChevronUpDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4.5l3-2.5 3 2.5M3 7.5l3 2.5 3-2.5" />
    </svg>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

interface BottomBarProps {
  /** Current exercise name — null when idle */
  exerciseName?: string | null
  /** Called when user taps the exercise name area */
  onExerciseTap?: () => void
  /** Called when user taps the settings icon */
  onSettingsTap?: () => void
}

export default function BottomBar({
  exerciseName,
  onExerciseTap,
  onSettingsTap,
}: BottomBarProps) {
  const { running, toggle } = useMetronome()

  return (
    <nav
      className="flex items-center px-4 shrink-0"
      style={{
        height: 44,
        borderTop: '0.5px solid var(--color-border-secondary)',
      }}
    >
      {/* Exercise name / navigation trigger */}
      <button
        type="button"
        onClick={onExerciseTap}
        className="flex-1 text-left flex items-center gap-2 min-w-0"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          minHeight: 44,
        }}
      >
        <span
          className="truncate"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
          }}
        >
          {exerciseName ?? 'tap to choose an exercise'}
        </span>
        <span className="shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
          <ChevronUpDown />
        </span>
      </button>

      {/* Action icons */}
      <div className="flex items-center gap-2 ml-4">
        {/* Settings icon */}
        <button
          type="button"
          onClick={onSettingsTap}
          className="flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-tertiary)',
          }}
          aria-label="Settings"
        >
          <SettingsIcon />
        </button>

        {/* Metronome play/stop toggle */}
        <button
          type="button"
          onClick={toggle}
          className="flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: running ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
            transition: 'color 120ms ease',
          }}
          aria-label={running ? 'Stop metronome' : 'Start metronome'}
        >
          <MetronomeIcon />
        </button>
      </div>
    </nav>
  )
}
