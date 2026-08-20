'use client'

import { Sparkline } from '../Sparkline'
import type { Delta, Player } from '../types'

interface SummaryStat {
  label: string
  value: string
  note: string
  dir: Delta
}

interface Alert {
  id: string
  kind: string
  tone: Delta
  title: string
  body: string
}

function PlayerCard({ p, dim, onOpen }: { p: Player; dim?: boolean; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      style={{
        textAlign: 'left',
        border: '1px solid var(--border)',
        borderRadius: 10,
        background: dim ? 'transparent' : 'var(--card2)',
        padding: 10,
        cursor: 'pointer',
        color: 'var(--fg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      data-hover-accent
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i data-status={p.status} style={{ width: 7, height: 7, borderRadius: 9, flex: '0 0 auto' }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '-.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {p.name}
        </span>
      </div>
      <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg3)' }}>
        <span>
          {p.team} · {p.pos}
        </span>
        {!dim ? <span>£{p.price.toFixed(1)}m</span> : null}
      </div>
      {dim ? (
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg3)' }}>
          <span />
          <span>{p.xgi.toFixed(1)} xGI</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <Sparkline hist={p.hist} />
          <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
            {p.xgi.toFixed(1)}
          </span>
        </div>
      )}
    </button>
  )
}

export function DashboardScreen({
  summary,
  xi,
  bench,
  alerts,
  onOpenPlayer,
  onDismissAlert,
}: {
  summary: SummaryStat[]
  xi: Player[]
  bench: Player[]
  alerts: Alert[]
  onOpenPlayer: (id: number) => void
  onDismissAlert: (id: string) => void
}) {
  const squad = [...xi, ...bench]
  const injuredCount = squad.filter((p) => p.status === 'out').length
  const riskCount = squad.filter((p) => p.status === 'risk').length
  const squadNote =
    injuredCount === 0 && riskCount === 0
      ? 'Full squad available'
      : [
          injuredCount ? `${injuredCount} ${injuredCount > 1 ? 'injuries' : 'injury'}` : null,
          riskCount ? `${riskCount} doubtful` : null,
        ]
          .filter(Boolean)
          .join(', ')

  return (
    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
        {summary.map((s) => (
          <div key={s.label} style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', padding: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)' }}>{s.label}</div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', marginTop: 8 }}>
              {s.value}
            </div>
            <div className="mono" data-delta={s.dir} style={{ fontSize: 12, marginTop: 4 }}>
              {s.note}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2.1fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }}>
        <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '15px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Squad health</div>
              <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 2 }}>Points trend over recent gameweeks · {squadNote}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--fg3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <i data-status="ok" style={{ width: 7, height: 7, borderRadius: 9, display: 'block' }} />
                Starting
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <i data-status="risk" style={{ width: 7, height: 7, borderRadius: 9, display: 'block' }} />
                Rotation
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <i data-status="out" style={{ width: 7, height: 7, borderRadius: 9, display: 'block' }} />
                Injured
              </span>
            </div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)', marginBottom: 10 }}>
              Starting XI
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(168px,1fr))', gap: 10 }}>
              {xi.map((p) => (
                <PlayerCard key={p.id} p={p} onOpen={() => onOpenPlayer(p.id)} />
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)', marginBottom: 10 }}>
              Bench
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(168px,1fr))', gap: 10, opacity: 0.7 }}>
              {bench.map((p) => (
                <PlayerCard key={p.id} p={p} dim onOpen={() => onOpenPlayer(p.id)} />
              ))}
            </div>
          </div>
        </section>

        <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', overflow: 'hidden' }}>
          <div
            style={{
              padding: '15px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>This week&apos;s alerts</div>
            <span
              className="mono"
              style={{
                fontSize: 11,
                padding: '2px 7px',
                borderRadius: 99,
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                color: 'var(--fg2)',
              }}
            >
              {alerts.length}
            </span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {alerts.map((a) => (
              <div
                key={a.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: 'var(--card2)',
                  padding: '11px 12px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <span
                      className="mono"
                      data-delta={a.tone}
                      style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}
                    >
                      {a.kind}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{a.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg2)', lineHeight: 1.45 }}>{a.body}</div>
                </div>
                <button
                  onClick={() => onDismissAlert(a.id)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--fg3)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '2px 3px' }}
                >
                  ×
                </button>
              </div>
            ))}
            {alerts.length === 0 ? (
              <div style={{ padding: 18, textAlign: 'center', fontSize: 12, color: 'var(--fg3)' }}>
                All clear. Nothing needs your attention.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
