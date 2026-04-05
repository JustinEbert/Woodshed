import { useState } from 'react'
import PracticeView from './components/shell/PracticeView'
import SettingsScreen from './components/shell/SettingsScreen'
import NoteFlash from './exercises/note-flash/NoteFlash'

type AppView = 'practice' | 'settings'

export default function App() {
  const [view, setView] = useState<AppView>('practice')

  if (view === 'settings') {
    return <SettingsScreen onBack={() => setView('practice')} />
  }

  return (
    <PracticeView
      exercise={<NoteFlash />}
      exerciseName="Note Flash"
      onExerciseTap={() => {
        /* exercise select sheet — Story #6 */
      }}
      onSettingsTap={() => setView('settings')}
    />
  )
}
