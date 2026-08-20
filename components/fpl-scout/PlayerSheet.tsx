'use client'

import { useElementSummary } from '@/lib/queries/fpl'
import { PlayerBarChart } from './PlayerBarChart'
import type { Player } from './types'

export function PlayerSheet({ player, onClose }: { player: Player; onClose: () => void }) {
  const { data: summary, isLoading, isError } = useElementSummary(player.id)

  const bigStats = [
    { k: 'xGI', v: player.xgi.toFixed(2) },
    { k: 'Form', v: player.form.toFixed(1) },
    { k: 'Mins', v: String(player.mins) },
  ]
  const table = [
    { k: 'Expected goals (xG)', v: player.xg.toFixed(2) },
    { k: 'Expected assists (xA)', v: player.xa.toFixed(2) },
    { k: 'xGI per 90', v: (player.mins > 0 ? player.xgi / (player.mins / 90) : 0).toFixed(2) },
    { k: 'Minutes played', v: String(player.mins) },
    { k: 'Ownership', v: player.own.toFixed(1) + '%' },
    { k: 'Price change (season)', v: player.priceMove + 'm' },
    { k: 'Next 5 avg FDR', v: (player.next.length ? player.next.reduce((s, f) => s + f.d, 0) / player.next.length : 0).toFixed(1) },
  ]

  const chartData = (summary?.history ?? []).slice(-5).map((h) => ({ label: `GW${h.round}`, value: h.total_points }))

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 60 }} onClick={onClose} />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          maxWidth: '92vw',
          background: 'var(--card)',
          borderLeft: '1px solid var(--border)',
          zIndex: 61,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: 18, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <i data-status={player.status} style={{ width: 8, height: 8, borderRadius: 9 }} />
              <span style={{ fontSize: 19, fontWeight: 650, letterSpacing: '-.02em' }}>{player.name}</span>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 5 }}>
              {player.team} · {player.pos} · £{player.price.toFixed(1)}m · {player.own.toFixed(1)}% owned
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 8, lineHeight: 1.5 }}>{player.note}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--fg2)',
              cursor: 'pointer',
              borderRadius: 8,
              padding: '4px 9px',
              fontSize: 14,
              lineHeight: 1.2,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {bigStats.map((s) => (
              <div key={s.k} style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--card2)', padding: 11 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)' }}>{s.k}</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 5 }}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Points per gameweek</div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--card2)', padding: 12 }}>
              {isLoading ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--fg3)' }}>Loading…</div>
              ) : isError || chartData.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--fg3)' }}>
                  No completed gameweeks yet this season.
                </div>
              ) : (
                <PlayerBarChart data={chartData} />
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Full breakdown</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, border: '1px solid var(--border)', borderRadius: 10 }}>
              <tbody>
                {table.map((r) => (
                  <tr key={r.k} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--fg3)' }}>{r.k}</td>
                    <td className="mono" style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                      {r.v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Next 5 fixtures</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {player.next.map((f, i) => (
                <span key={i} data-d={f.d} style={{ flex: 1, height: 28 }}>
                  {f.label}
                </span>
              ))}
            </div>
          </div>
          <button
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
            Add to shortlist
          </button>
        </div>
      </aside>
    </>
  )
}
