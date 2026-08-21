'use client'

import type { AlertItem, LeadCard } from '../mapFplData'
import type { Delta, PageKey } from '../types'

interface GlanceTile {
  label: string
  value: string
  note: string
  dir: Delta
}

export function MatchdayScreen({
  glance,
  leads,
  alerts,
  onNavigate,
  onDismissAlert,
}: {
  glance: GlanceTile[]
  leads: LeadCard[]
  alerts: AlertItem[]
  onNavigate: (page: PageKey) => void
  onDismissAlert: (id: string) => void
}) {
  return (
    <section className="h-full overflow-y-auto px-7.5 pb-10">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5 py-5.5">
        {glance.map((g) => (
          <div
            key={g.label}
            className="border-border rounded-(--r-card) border bg-(--card) px-4 pt-3.5 pb-3.75"
          >
            <div className="lbl">{g.label}</div>
            <div
              className="dsp mono mt-0.75 text-[23px] leading-[1.05]"
              style={{
                color: g.label.toLowerCase().includes('deadline')
                  ? 'var(--accent)'
                  : 'var(--fg)',
              }}
            >
              {g.value}
            </div>
            <div className="mt-0.5 text-[11px] italic" data-delta={g.dir}>
              {g.note}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-start gap-8.5">
        <div>
          <div className="lbl mb-2">
            This week&apos;s verdicts · decided by expected involvement, not
            points
          </div>
          {leads.length === 0 ? (
            <div className="py-6 text-center text-xs text-(--fg3)">
              Not enough squad data yet to draw a verdict.
            </div>
          ) : (
            leads.map((l, i) => (
              <div
                key={i}
                className="border-border mb-5.5 border-b pb-5.5 last:border-0"
              >
                <div
                  className="mb-3 h-0.5"
                  style={{ width: l.ruleW, background: 'var(--border2)' }}
                />
                <h2
                  className="dsp m-0 mb-2.5 text-pretty"
                  style={{ fontSize: l.size, lineHeight: 1.02 }}
                >
                  {l.headline}
                </h2>
                <p
                  className="ed m-0 mb-3 text-pretty italic"
                  style={{ fontSize: l.standSize, lineHeight: 1.46 }}
                >
                  {l.standfirst}
                </p>
                <p className="ed drop m-0 max-w-[70ch] text-pretty text-[15.5px] leading-[1.62] text-(--fg2)">
                  {l.body}
                </p>
                <div className="border-border mt-4 flex flex-wrap border-t">
                  {l.figures.map((f) => (
                    <div
                      key={f.k}
                      className="border-border mr-4.5 border-r py-2.5 pr-4.5"
                    >
                      <div className="lbl">{f.k}</div>
                      <div
                        className="fig mt-0.5 text-[19px]"
                        style={{ color: f.fg }}
                      >
                        {f.v}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-end gap-2.25 py-2.5">
                    <button
                      onClick={() => onNavigate(l.ctaPage)}
                      className="border-border rounded-(--r-ctl) text-primary border px-3 py-1.5 text-xs whitespace-nowrap"
                    >
                      {l.cta}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-border border-l pl-6.5">
          <div className="lbl mb-2.5">Late news</div>
          {alerts.map((a) => (
            <div key={a.id} className="border-border mb-3.5 border-b pb-3.5">
              <div className="mb-1 flex items-baseline justify-between gap-2.5">
                <span className="dsp text-[16.5px]">{a.title}</span>
                <button
                  onClick={() => onDismissAlert(a.id)}
                  className="text-[13px] leading-none text-(--fg3) hover:text-foreground"
                >
                  ×
                </button>
              </div>
              <div className="mb-1.5 flex items-baseline gap-2.25">
                <span
                  className="text-[9px] tracking-[.18em] uppercase"
                  data-delta={a.tone}
                >
                  {a.kind}
                </span>
              </div>
              <div className="text-pretty text-[13px] leading-[1.6] text-(--fg2)">
                {a.body}
              </div>
            </div>
          ))}
          {alerts.length === 0 ? (
            <div className="text-[13px] text-(--fg3) italic">
              Nothing further to report this week.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
