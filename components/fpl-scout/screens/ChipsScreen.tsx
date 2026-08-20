'use client'

import type { ChipCardView } from '../mapFplData'

export function ChipsScreen({ chips }: { chips: ChipCardView[] }) {
  return (
    <div style={{ padding: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, alignItems: 'start' }}>
      {chips.map((c) => (
        <section key={c.name} style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', overflow: 'hidden' }}>
          <div
            style={{
              padding: 16,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 650, letterSpacing: '-.015em' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 3 }}>{c.availability}</div>
            </div>
            <span
              className="mono"
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: 99,
                border: `1px solid ${c.badgeBorder}`,
                background: c.badgeBg,
                color: c.badgeFg,
                whiteSpace: 'nowrap',
              }}
            >
              {c.status}
            </span>
          </div>
        </section>
      ))}
    </div>
  )
}
