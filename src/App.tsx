import { useState } from 'react'
import PracticeView from './components/shell/PracticeView'
import SettingsScreen from './components/shell/SettingsScreen'
import { useMetronome } from './state/metronome'

type AppView = 'practice' | 'settings'

export default function App() {
  const [view, setView] = useState<AppView>('practice')
  const [exerciseName] = useState<string | null>(null)
  const metronome = useMetronome()

  if (view === 'settings') {
    return <SettingsScreen onBack={() => setView('practice')} />
  }

  return (
    <PracticeView
      exerciseName={exerciseName}
      onExerciseTap={() => {
        /* exercise select sheet — Story #6 */
      }}
      onMetronomeTap={() => metronome.toggle()}
      onSettingsTap={() => setView('settings')}
    />
  )
}
