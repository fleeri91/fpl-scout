'use client'

import type { KeyboardEvent } from 'react'

export function ConnectScreen({
  entry,
  entryError,
  connectLabel,
  onEntryChange,
  onEntryKeyDown,
  onConnect,
}: {
  entry: string
  entryError: string
  connectLabel: string
  onEntryChange: (value: string) => void
  onEntryKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  onConnect: () => void
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            FS
          </div>
          <div style={{ fontSize: 16, fontWeight: 650, letterSpacing: '-.01em' }}>FPL Scout</div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', overflow: 'hidden' }}>
          <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 16, fontWeight: 650, letterSpacing: '-.015em' }}>Connect your team</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg2)', marginTop: 5, lineHeight: 1.5 }}>
              Enter your FPL team ID so Scout can pull your squad, transfers and chip history.
            </div>
          </div>
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)' }}>
                Team ID
              </label>
              <input
                className="mono"
                value={entry}
                onChange={(e) => onEntryChange(e.target.value)}
                onKeyDown={onEntryKeyDown}
                placeholder="e.g. 3842106"
                inputMode="numeric"
                style={{
                  padding: '11px 12px',
                  borderRadius: 9,
                  border: '1px solid var(--border)',
                  background: 'var(--muted)',
                  color: 'var(--fg)',
                  fontSize: 14,
                  outline: 'none',
                  width: '100%',
                }}
              />
              {entryError ? (
                <span data-delta="down" style={{ fontSize: 12 }}>
                  {entryError}
                </span>
              ) : null}
            </div>
            <button
              onClick={onConnect}
              style={{
                padding: 11,
                borderRadius: 9,
                border: 'none',
                background: 'var(--accent)',
                color: 'var(--accent-fg)',
                fontSize: 13,
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              {connectLabel}
            </button>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <div style={{ fontSize: 12, color: 'var(--fg3)', lineHeight: 1.55 }}>
              Find it in the URL of your points page on the official site:{' '}
              <span className="mono" style={{ color: 'var(--fg2)' }}>
                /entry/&lt;your-id&gt;/event/3
              </span>
              . Scout only reads public data.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
