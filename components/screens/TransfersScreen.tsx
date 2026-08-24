'use client'

// Ported from the Claude Design mockup (project "FPL Scout Dashboard",
// FPL Scout v3.dc.html) — now the whole app's shared v3 look, defined in
// components/fpl-scout.css.
import { useState } from 'react'
import type {
  ChipInterplayView,
  ForcedDecision,
  TransferCallView,
  WatchItem,
} from '../mapFplData'
import type { PageKey } from '../types'

function Spark({ hist, w, h }: { hist: number[]; w: number; h: number }) {
  if (hist.length === 0) return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} />
  const max = Math.max(...hist, 0.1)
  const pts = hist.map((v, i): [number, number] => [
    (i / (hist.length - 1)) * (w - 3) + 1.5,
    h - 2 - (v / max) * (h - 4),
  ])
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill="var(--accent)" />
    </svg>
  )
}

function Pips({ conf, size = 14 }: { conf: number; size?: number }) {
  const filled = conf > 0 ? Math.max(1, Math.min(5, Math.round(conf / 20))) : 0
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            width: size,
            height: 4,
            borderRadius: 1,
            background: n <= filled ? 'var(--accent)' : 'var(--border2)',
          }}
        />
      ))}
    </div>
  )
}

export function TransfersScreen({
  calls,
  forced,
  chipInterplay,
  watch,
  onOpenPlayer,
  onNavigate,
}: {
  calls: TransferCallView[]
  forced: ForcedDecision[]
  chipInterplay: ChipInterplayView | null
  watch: WatchItem[]
  onOpenPlayer: (id: number) => void
  onNavigate: (page: PageKey) => void
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  return (
    <section className="flex h-full flex-col overflow-y-auto">
      {forced.length > 0 ? (
        <div
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--card)',
            padding: '10px 30px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <span className="lbl" style={{ color: 'var(--neg)' }}>
            Demands a decision
          </span>
          {forced.map((f) => (
            <button
              key={f.id}
              onClick={() => onOpenPlayer(f.id)}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 9,
                  background: f.dot,
                  display: 'block',
                  transform: 'translateY(-2px)',
                }}
              />
              <span className="dsp" style={{ fontSize: '14.5px' }}>
                {f.name}
              </span>
              <span className="fig" style={{ fontSize: 11, color: f.dot }}>
                {f.chance}
              </span>
              <span className="ed" style={{ fontSize: 13, color: 'var(--fg2)' }}>
                {f.note}
              </span>
              <span className="lbl" style={{ color: 'var(--fg3)' }}>
                {f.where}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <main
        data-lay="split"
        style={{
          flex: 1,
          padding: '24px 30px 30px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 320px',
          gap: 26,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {calls.length === 0 ? (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-card)',
                padding: '40px 20px',
                textAlign: 'center',
                fontSize: 13,
                color: 'var(--fg3)',
                fontStyle: 'italic',
              }}
            >
              No move worth making right now — your squad looks efficient
              for its price.
            </div>
          ) : null}

          {calls.map((c, i) => {
            const isPrimary = i === 0
            const isOpen = !!open[c.id]
            return (
              <div
                key={c.id}
                style={{
                  border: `1px solid ${isPrimary ? 'var(--border2)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-card)',
                  background: isPrimary ? 'var(--card2)' : 'var(--card)',
                  marginBottom: 14,
                  overflow: 'hidden',
                }}
              >
                <div
                  data-lay="verdict"
                  style={{
                    padding: '15px 20px 13px',
                    display: 'grid',
                    gridTemplateColumns:
                      c.swing.length > 0 ? 'minmax(0,1fr) minmax(0,0.72fr)' : '1fr',
                    gap: 22,
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 11,
                        marginBottom: 7,
                      }}
                    >
                      <span className="fig" style={{ fontSize: 11, color: 'var(--fg3)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="lbl" style={{ color: c.kindFg }}>
                        {c.kind}
                      </span>
                      <span
                        className="fig"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--r-chip)',
                          background: c.costBg,
                          color: c.costFg,
                        }}
                      >
                        {c.cost}
                      </span>
                    </div>
                    <div
                      className="dsp"
                      data-hl
                      style={{
                        fontSize: isPrimary ? '44px' : '34px',
                        lineHeight: 0.96,
                        letterSpacing: '.006em',
                        textWrap: 'balance',
                      }}
                    >
                      {c.verdict}
                    </div>
                    <div
                      className="ed"
                      style={{
                        fontSize: '14.5px',
                        lineHeight: 1.4,
                        color: 'var(--fg2)',
                        marginTop: 7,
                        maxWidth: '58ch',
                        textWrap: 'pretty',
                      }}
                    >
                      {c.line}
                    </div>
                  </div>
                  {c.swing.length > 0 ? (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
                        gap: '2px 14px',
                        borderLeft: '1px solid var(--border)',
                        paddingLeft: 20,
                      }}
                    >
                      {c.swing.map((s) => (
                        <div key={s.k} style={{ padding: '3px 0' }}>
                          <div className="lbl" style={{ fontSize: '8.5px' }}>
                            {s.k}
                          </div>
                          <div
                            className="fig"
                            style={{
                              fontSize: 16,
                              fontWeight: 600,
                              marginTop: 1,
                              color: s.fg,
                            }}
                          >
                            {s.v}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {c.evidence ? (
                  <div
                    data-lay="pair"
                    style={{
                      margin: '0 20px 13px',
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      padding: '10px 0',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                      gap: 20,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div>
                        <div className="lbl" style={{ fontSize: '8.5px', marginBottom: 5 }}>
                          {c.evidence.club} next five
                        </div>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {c.evidence.clubStrip.map((f, j) => (
                            <span
                              key={j}
                              data-d={f.d}
                              style={{ width: 31, height: 19 }}
                            >
                              {f.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="ed"
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--fg3)',
                            lineHeight: 1.4,
                            textWrap: 'pretty',
                          }}
                        >
                          {c.evidence.clubNote}
                        </div>
                        <button
                          data-exp
                          onClick={() => onNavigate('fixtures')}
                          style={{
                            padding: 0,
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--accent)',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            marginTop: 3,
                            textAlign: 'left',
                          }}
                        >
                          See {c.evidence.club} in Fixtures →
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        borderLeft: '1px solid var(--border)',
                        paddingLeft: 20,
                      }}
                    >
                      <div>
                        <div className="lbl" style={{ fontSize: '8.5px', marginBottom: 3 }}>
                          {c.evidence.player} trend
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <Spark hist={c.evidence.hist} w={88} h={26} />
                        </div>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="ed"
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--fg3)',
                            lineHeight: 1.4,
                            textWrap: 'pretty',
                          }}
                        >
                          {c.evidence.playerNote}
                        </div>
                        <button
                          data-exp
                          onClick={() => onOpenPlayer(c.evidence!.playerId)}
                          style={{
                            padding: 0,
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--accent)',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            marginTop: 3,
                            textAlign: 'left',
                          }}
                        >
                          See {c.evidence.player} in Form book →
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div
                  data-lay="pair"
                  style={{
                    padding: '0 20px 13px',
                    display: isPrimary || isOpen ? 'grid' : 'none',
                    gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)',
                    gap: 20,
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <div className="lbl" style={{ marginBottom: 6 }}>
                      Why
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {c.reasons.map((r) => (
                        <div
                          key={r.n}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '15px minmax(0,1fr)',
                            gap: 9,
                            alignItems: 'start',
                          }}
                        >
                          <span
                            className="fig"
                            style={{ fontSize: 10, color: 'var(--accent)', lineHeight: 1.6 }}
                          >
                            {r.n}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              lineHeight: 1.45,
                              color: 'var(--fg2)',
                              textWrap: 'pretty',
                            }}
                          >
                            {r.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 18 }}>
                    <div className="lbl" style={{ marginBottom: 5 }}>
                      What would change it
                    </div>
                    <div
                      className="ed"
                      style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--fg3)', textWrap: 'pretty' }}
                    >
                      {c.against}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '9px 20px',
                    borderTop: '1px solid var(--border)',
                    background: 'rgba(0,0,0,.13)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="lbl">Conviction</span>
                    <Pips conf={c.conf} size={17} />
                    <span className="fig" style={{ fontSize: 11, color: 'var(--fg2)' }}>
                      {c.confLabel}
                    </span>
                  </div>
                  {c.heads.length > 0 ? (
                    <button
                      data-exp
                      onClick={() => toggle(c.id)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-ctl)',
                        background: 'transparent',
                        color: 'var(--fg2)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {isOpen ? 'Hide the numbers' : 'See the numbers'}
                    </button>
                  ) : null}
                </div>

                {isOpen && c.heads.length > 0 ? (
                  <div
                    style={{
                      borderTop: '1px solid var(--border2)',
                      padding: '16px 20px 18px',
                      background: 'var(--bg)',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th
                            className="lbl"
                            style={{ textAlign: 'left', padding: '0 10px 8px 0', fontWeight: 500 }}
                          >
                            Measure
                          </th>
                          {c.heads.map((h) => (
                            <th
                              key={h.id}
                              onClick={() => onOpenPlayer(h.id)}
                              style={{ textAlign: 'right', padding: '0 0 8px 14px', cursor: 'pointer' }}
                            >
                              <span
                                className="dsp"
                                style={{ display: 'block', fontSize: 17, color: h.tagFg }}
                              >
                                {h.name}
                              </span>
                              <span className="fig" style={{ fontSize: 10, color: 'var(--fg3)' }}>
                                {h.sub}
                              </span>
                              <span
                                className="lbl"
                                style={{ display: 'block', fontSize: '8.5px', color: h.tagFg, marginTop: 3 }}
                              >
                                {h.tag}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {c.measures.map((m) => (
                          <tr key={m.k} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '7px 10px 7px 0', fontSize: '12.5px', color: 'var(--fg3)' }}>
                              {m.k}
                            </td>
                            {m.cells.map((cell, j) => (
                              <td
                                key={j}
                                className="fig"
                                style={{ padding: '7px 0 7px 14px', textAlign: 'right', fontSize: 13, color: cell.fg }}
                              >
                                {cell.v}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr>
                          <td className="lbl" style={{ padding: '9px 10px 0 0' }}>
                            Next five
                          </td>
                          {c.fixtureCells.map((fc, j) => (
                            <td key={j} style={{ padding: '9px 0 0 14px' }}>
                              <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
                                {fc.next.map((f, k) => (
                                  <span key={k} data-d={f.d} style={{ width: 33, height: 20 }}>
                                    {f.label}
                                  </span>
                                ))}
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 24 }}>
          {chipInterplay ? (
            <div
              style={{
                border: '1px solid var(--border2)',
                borderRadius: 'var(--r-card)',
                background: 'var(--card)',
                padding: '15px 16px 16px',
              }}
            >
              <div className="lbl" style={{ color: 'var(--accent)', marginBottom: 8 }}>
                Chip interplay
              </div>
              <div className="dsp" style={{ fontSize: 20, lineHeight: 1.05 }}>
                {chipInterplay.head}
              </div>
              <div
                className="ed"
                style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--fg2)', marginTop: 8, textWrap: 'pretty' }}
              >
                {chipInterplay.body}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  marginTop: 12,
                  paddingTop: 11,
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span className="lbl">{chipInterplay.name}</span>
                <Pips conf={chipInterplay.conf} size={14} />
                <span className="fig" style={{ fontSize: 11, color: 'var(--fg2)' }}>
                  {chipInterplay.window}
                </span>
              </div>
            </div>
          ) : null}

          {watch.length > 0 ? (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-card)',
                background: 'var(--card)',
                padding: '15px 16px 6px',
              }}
            >
              <div className="lbl" style={{ marginBottom: 9 }}>
                Watchlist, not yet a move
              </div>
              {watch.map((w) => (
                <button
                  key={w.id}
                  onClick={() => onOpenPlayer(w.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '9px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                    <span className="dsp" style={{ fontSize: '14.5px' }}>
                      {w.name}
                    </span>
                    <span className="fig" style={{ fontSize: 11, color: w.fg }}>
                      {w.v}
                    </span>
                  </div>
                  <div
                    className="ed"
                    style={{ fontSize: '12.5px', color: 'var(--fg3)', marginTop: 3, textWrap: 'pretty' }}
                  >
                    {w.why}
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--r-card)', padding: '13px 16px' }}>
            <div className="lbl" style={{ marginBottom: 6 }}>
              Everything else
            </div>
            <div className="ed" style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--fg3)' }}>
              The full pool, ownership and every stat column live in Form
              book. Nothing there changes this week&apos;s call.
            </div>
            <button
              data-exp
              onClick={() => onNavigate('form-book')}
              style={{
                padding: 0,
                border: 'none',
                background: 'transparent',
                color: 'var(--accent)',
                fontSize: '11.5px',
                cursor: 'pointer',
                marginTop: 6,
              }}
            >
              Open Form book →
            </button>
          </div>
        </aside>
      </main>
    </section>
  )
}
