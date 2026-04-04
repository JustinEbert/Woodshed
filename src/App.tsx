import { useState } from 'react'
import PracticeView from './components/shell/PracticeView'
import SettingsScreen from './components/shell/SettingsScreen'
import MetronomeDrawer from './components/metronome/MetronomeDrawer'

type AppView = 'practice' | 'settings'

export default function App() {
  const [view, setView] = useState<AppView>('practice')
  const [exerciseName] = useState<string | null>(null)
  const [metronomeOpen, setMetronomeOpen] = useState(false)

  if (view === 'settings') {
    return <SettingsScreen onBack={() => setView('practice')} />
  }

  return (
    <>
      <PracticeView
        exerciseName={exerciseName}
        onExerciseTap={() => {
          /* exercise select sheet — Story #6 */
        }}
        onMetronomeTap={() => setMetronomeOpen(true)}
        onSettingsTap={() => setView('settings')}
      />
      <MetronomeDrawer
        open={metronomeOpen}
        onClose={() => setMetronomeOpen(false)}
      />
    </>
  )
}
