import { type ReactNode } from 'react'

interface TopBarProps {
  /** Slot for the beat pulse indicator */
  pulse?: ReactNode
  /** Slot for the AI trainer text line */
  trainerLine?: ReactNode
}

export default function TopBar({ pulse, trainerLine }: TopBarProps) {
  return (
    <header
      className="flex items-center gap-3 px-3 shrink-0"
      style={{
        height: 36,
        borderBottom: '0.5px solid var(--color-border-secondary)',
      }}
    >
      {/* Beat pulse indicator slot — defaults to inert dot */}
      {pulse ?? (
        <div
          className="rounded-full shrink-0"
          style={{
            width: 10,
            height: 10,
            background: 'var(--color-accent)',
            opacity: 0.15,
          }}
        />
      )}

      {/* AI trainer text line slot */}
      <div
        className="flex-1 min-w-0 flex items-center"
        style={{ minHeight: 44 }}
      >
        {trainerLine ?? (
          <span
            className="truncate text-[13px] italic"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            offline — self-directed mode
          </span>
        )}
      </div>
    </header>
  )
}
