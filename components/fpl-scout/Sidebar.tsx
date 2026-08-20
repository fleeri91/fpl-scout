'use client'

import type { Screen } from './types'

const NAV_ITEMS: { key: Screen; label: string; icon: string }[] = [
  { key: 'dash', label: 'Dashboard', icon: '▦' },
  { key: 'explorer', label: 'Player Explorer', icon: '☰' },
  { key: 'fixtures', label: 'Fixture Planner', icon: '⊞' },
  { key: 'chips', label: 'Chip Strategy', icon: '◆' },
  { key: 'transfers', label: 'Transfer Suggestions', icon: '⇄' },
]

export function Sidebar({
  screen,
  navOpen,
  deadlineLabel,
  countdown,
  onNavigate,
  onToggleNav,
}: {
  screen: Screen
  navOpen: boolean
  deadlineLabel: string
  countdown: string
  onNavigate: (screen: Screen) => void
  onToggleNav: () => void
}) {
  const navWidth = navOpen ? '212px' : '62px'

  return (
    <aside
      style={{
        width: navWidth,
        flex: '0 0 auto',
        borderRight: '1px solid var(--border)',
        background: 'var(--card)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        transition: 'width .18s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '16px 14px',
          borderBottom: '1px solid var(--border)',
          minHeight: 57,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            flex: '0 0 auto',
            borderRadius: 7,
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          FS
        </div>
        {navOpen ? (
          <div style={{ fontSize: 14, fontWeight: 650, letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>
            FPL Scout
          </div>
        ) : null}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 8px', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = screen === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              title={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
                background: active ? 'var(--muted)' : 'transparent',
                color: active ? 'var(--fg)' : 'var(--fg2)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 500,
                width: '100%',
              }}
            >
              <span className="mono" style={{ width: 16, flex: '0 0 auto', textAlign: 'center', opacity: 0.9, fontSize: 13 }}>
                {item.icon}
              </span>
              {navOpen ? <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span> : null}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ padding: 10, borderRadius: 9, background: 'var(--muted)', border: '1px solid var(--border)' }}>
          {navOpen ? (
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)', marginBottom: 5 }}>
              {deadlineLabel}
            </div>
          ) : null}
          <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>
            {countdown}
          </div>
        </div>
        <button
          onClick={onToggleNav}
          style={{
            padding: 7,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--fg2)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {navOpen ? '«' : '»'}
        </button>
      </div>
    </aside>
  )
}
