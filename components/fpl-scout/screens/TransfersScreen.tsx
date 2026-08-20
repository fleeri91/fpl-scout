'use client'

import type { TransferSectionView } from '../mapFplData'

export function TransfersScreen({ transfers }: { transfers: TransferSectionView[] }) {
  if (transfers.length === 0) {
    return (
      <div style={{ padding: 22 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', padding: 24, textAlign: 'center', color: 'var(--fg3)', fontSize: 13 }}>
          No transfer suggestions right now — your squad looks efficient for its price.
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {transfers.map((t) => (
        <section key={t.outName} style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', overflow: 'hidden' }}>
          <div
            style={{
              padding: '15px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Replace {t.outName}</div>
              <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 2 }}>{t.rationale}</div>
            </div>
            <span
              className="mono"
              style={{
                fontSize: 11,
                padding: '3px 9px',
                borderRadius: 99,
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                color: 'var(--fg2)',
              }}
            >
              {t.bank} in bank
            </span>
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
            {t.cards.map((c) => (
              <div key={c.name} style={{ border: `1px solid ${c.border}`, borderRadius: 11, background: c.bg, overflow: 'hidden' }}>
                <div style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 650, letterSpacing: '-.01em' }}>{c.name}</span>
                    <span className="mono" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: c.tagFg, fontWeight: 700 }}>
                      {c.tag}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 4 }}>
                    {c.team} · {c.pos} · £{c.price}m
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {c.stats.map((s) => (
                      <tr key={s.k} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '7px 14px', color: 'var(--fg3)' }}>{s.k}</td>
                        <td className="mono" data-delta={s.dir} style={{ padding: '7px 14px', textAlign: 'right', fontWeight: 600 }}>
                          {s.v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)' }}>Next 5</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {c.next.map((f, i) => (
                      <span key={i} data-d={f.d} style={{ flex: 1, height: 22 }}>
                        {f.label}
                      </span>
                    ))}
                  </div>
                  <button
                    style={{
                      marginTop: 4,
                      padding: 8,
                      borderRadius: 8,
                      border: `1px solid ${c.ctaBorder}`,
                      background: c.ctaBg,
                      color: c.ctaFg,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {c.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
