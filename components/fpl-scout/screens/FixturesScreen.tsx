'use client'

import type { BestWindow, FixturePlannerRow } from '../mapFplData'

export function FixturesScreen({
  gws,
  matrix,
  bestWindows,
}: {
  gws: string[]
  matrix: FixturePlannerRow[]
  bestWindows: BestWindow[]
}) {
  return (
    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--fg3)' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '.09em' }}>Difficulty</span>
          {[1, 2, 3, 4, 5].map((d) => (
            <span key={d} data-d={d} style={{ padding: '3px 9px' }}>
              {d}
            </span>
          ))}
          <span style={{ marginLeft: 6 }}>Home in caps, away lowercase</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg2)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, border: '1.5px solid var(--accent)', display: 'inline-block' }} />
          Best 3-GW window
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--card2)' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '9px 12px',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '.09em',
                    color: 'var(--fg3)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  Team
                </th>
                {gws.map((g) => (
                  <th
                    key={g}
                    className="mono"
                    style={{
                      padding: '9px 6px',
                      fontSize: 10,
                      letterSpacing: '.06em',
                      color: 'var(--fg3)',
                      borderBottom: '1px solid var(--border)',
                      fontWeight: 600,
                    }}
                  >
                    {g}
                  </th>
                ))}
                <th
                  style={{
                    padding: '9px 12px',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '.09em',
                    color: 'var(--fg3)',
                    borderBottom: '1px solid var(--border)',
                    textAlign: 'right',
                  }}
                >
                  Avg
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.team} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{row.team}</td>
                  {row.cells.map((c, i) => (
                    <td key={i} style={{ padding: '3px 3px' }}>
                      <div data-d={c.d} style={{ height: 30, outline: c.ring, outlineOffset: -2, borderRadius: 5 }}>
                        {c.opp}
                      </div>
                    </td>
                  ))}
                  <td className="mono" style={{ padding: '6px 12px', textAlign: 'right', fontSize: 12, color: 'var(--fg2)' }}>
                    {row.avg}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Best windows</div>
        <div style={{ fontSize: 12, color: 'var(--fg2)', marginBottom: 14 }}>
          Lowest average difficulty across any three consecutive gameweeks.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 10 }}>
          {bestWindows.map((w) => (
            <div key={w.team} style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--card2)', padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 650 }}>{w.team}</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                  {w.avg} avg
                </span>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 6 }}>
                {w.range}
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 6, lineHeight: 1.45 }}>{w.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
