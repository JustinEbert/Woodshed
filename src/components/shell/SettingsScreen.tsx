interface SettingsScreenProps {
  onBack: () => void
}

/**
 * Full-screen replacement for the practice view.
 * No bottom bar. Back navigation returns to practice view with state preserved.
 * Metronome continues running in background.
 */
export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  return (
    <div className="h-full w-full flex justify-center">
      <div className="h-full w-full max-w-[600px] flex flex-col">
        {/* Settings header */}
        <header
          className="flex items-center px-3 shrink-0"
          style={{
            height: 44,
            borderBottom: '0.5px solid var(--color-border-secondary)',
          }}
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-[13px]"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: 0,
              minHeight: 44,
            }}
          >
            <span>←</span>
            <span>settings</span>
          </button>
        </header>

        {/* Settings content — placeholder until Story #7 */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-6">
            {/* API Key section */}
            <section>
              <h2
                className="text-[11px] uppercase tracking-widest mb-2"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                API Key
              </h2>
              <p
                className="text-[13px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Not configured
              </p>
            </section>

            {/* Default BPM section */}
            <section>
              <h2
                className="text-[11px] uppercase tracking-widest mb-2"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Default BPM
              </h2>
              <p
                className="text-[13px] font-mono"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                90
              </p>
            </section>

            {/* About section */}
            <section>
              <h2
                className="text-[11px] uppercase tracking-widest mb-2"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                About
              </h2>
              <p
                className="text-[13px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Woodshed v0.0.0
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
