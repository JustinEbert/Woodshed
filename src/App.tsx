export default function App() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-background-primary)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Top bar placeholder */}
      <div style={{
        height: 36,
        borderBottom: '0.5px solid var(--color-border-secondary)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 12,
        flexShrink: 0,
      }}>
        {/* Beat pulse indicator */}
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          opacity: 0.3,
        }} />
        {/* AI trainer text line */}
        <span style={{
          flex: 1,
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--color-text-tertiary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          offline — self-directed mode
        </span>
      </div>

      {/* Exercise view — primary canvas */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-tertiary)',
        fontSize: 13,
        letterSpacing: '0.08em',
      }}>
        exercise view
      </div>

      {/* Bottom bar placeholder */}
      <div style={{
        height: 44,
        borderTop: '0.5px solid var(--color-border-secondary)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        flexShrink: 0,
      }}>
        <span style={{
          flex: 1,
          fontSize: 13,
          color: 'var(--color-text-tertiary)',
        }}>
          tap to choose an exercise ↕
        </span>
        <span style={{
          fontSize: 20,
          color: 'var(--color-text-tertiary)',
          marginLeft: 12,
        }}>⏱</span>
      </div>
    </div>
  )
}
