// Tab component — horizontally scrolling tablature
// Stub: port from docs/prototypes/woodshed_metronome_v6_backup.html
// See CLAUDE.md for full behavior spec and component interface

export interface TabNote {
  // 6-element array: [e, B, G, D, A, E_low]
  // null = string not played (bare line)
  strings: (number | string | null)[]
}

interface TabComponentProps {
  sequence: TabNote[]
  displayMode?: 'fret' | 'name'
  onNoteAdvance?: () => void
  lookahead?: number
  colWidth?: number
}

export default function TabComponent(_props: TabComponentProps) {
  return <div>TabComponent — not yet implemented</div>
}
