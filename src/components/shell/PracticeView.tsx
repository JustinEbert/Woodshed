import { type ReactNode } from 'react'
import TopBar from './TopBar'
import BeatPulse from './BeatPulse'
import BottomBar from './BottomBar'
import ExerciseView from './ExerciseView'

interface PracticeViewProps {
  /** Active exercise component */
  exercise?: ReactNode
  /** Current exercise name for bottom bar */
  exerciseName?: string | null
  /** Callbacks */
  onExerciseTap?: () => void
  onMetronomeTap?: () => void
  onSettingsTap?: () => void
}

/**
 * Primary app layout: top bar (36px) + exercise view (flex) + bottom bar (44px).
 * Centered at max-width 600px for readability on desktop.
 */
export default function PracticeView({
  exercise,
  exerciseName,
  onExerciseTap,
  onMetronomeTap,
  onSettingsTap,
}: PracticeViewProps) {
  return (
    <div className="h-full w-full flex justify-center">
      <div className="h-full w-full max-w-[600px] flex flex-col">
        <TopBar pulse={<BeatPulse />} />
        <ExerciseView>{exercise}</ExerciseView>
        <BottomBar
          exerciseName={exerciseName}
          onExerciseTap={onExerciseTap}
          onMetronomeTap={onMetronomeTap}
          onSettingsTap={onSettingsTap}
        />
      </div>
    </div>
  )
}
