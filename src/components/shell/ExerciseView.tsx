import { type ReactNode } from 'react'

interface ExerciseViewProps {
  /** The active exercise component — null renders idle state */
  children?: ReactNode
}

export default function ExerciseView({ children }: ExerciseViewProps) {
  return (
    <main className="flex-1 flex items-stretch justify-center overflow-hidden min-h-0">
      {children ?? (
        <div
          className="flex items-center justify-center w-full"
          style={{
            color: 'var(--color-text-tertiary)',
            fontSize: 13,
            letterSpacing: '0.08em',
          }}
        >
          exercise view
        </div>
      )}
    </main>
  )
}
