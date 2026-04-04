import { useState, type ReactNode } from 'react'
import TopBar from './TopBar'
import BeatPulse from './BeatPulse'
import BottomBar from './BottomBar'
import ExerciseView from './ExerciseView'
import MetronomeDrawer, { MetronomeDragHandle } from '../metronome/MetronomeDrawer'

interface PracticeViewProps {
  /** Active exercise component */
  exercise?: ReactNode
  /** Current exercise name for bottom bar */
  exerciseName?: string | null
  /** Callbacks */
  onExerciseTap?: () => void
  onSettingsTap?: () => void
}

/**
 * Primary app layout: top bar (36px) + exercise view (flex) + metronome drawer + bottom bar (44px).
 * The metronome drawer sits between the exercise view and bottom bar.
 * Drag handle is always visible; drawer panel slides open/closed above bottom bar.
 * Centered at max-width 600px for readability on desktop.
 */
export default function PracticeView({
  exercise,
  exerciseName,
  onExerciseTap,
  onSettingsTap,
}: PracticeViewProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="h-full w-full flex justify-center">
      <div className="h-full w-full max-w-[600px] flex flex-col">
        <TopBar pulse={<BeatPulse />} />
        <ExerciseView>{exercise}</ExerciseView>

        {/* Metronome zone: handle always visible, drawer slides open/closed */}
        <div className="shrink-0">
          <MetronomeDragHandle onClick={() => setDrawerOpen(o => !o)} />
          <MetronomeDrawer open={drawerOpen} />
        </div>

        <BottomBar
          exerciseName={exerciseName}
          onExerciseTap={onExerciseTap}
          onSettingsTap={onSettingsTap}
        />
      </div>
    </div>
  )
}
