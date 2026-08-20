'use client'

export function Header({
  title,
  subtitle,
  teamId,
  gameweekLabel,
  initials,
  onDisconnect,
}: {
  title: string
  subtitle: string
  teamId: string
  gameweekLabel: string
  initials: string
  onDisconnect: () => void
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 22px',
        minHeight: 57,
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 650, letterSpacing: '-.01em' }}>{title}</h1>
        <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{subtitle}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--fg3)' }}>{gameweekLabel}</span>
        <span
          className="mono"
          style={{
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 99,
            background: 'var(--muted)',
            border: '1px solid var(--border)',
            color: 'var(--fg2)',
          }}
        >
          ID {teamId}
        </span>
        <button
          onClick={onDisconnect}
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--fg2)',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          Change
        </button>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 99,
            background: 'var(--muted)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--fg2)',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
