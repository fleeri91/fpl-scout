'use client'

import type { PageConfig, PageKey } from './types'

export interface MastheadMeter {
  k: string
  v: string
  fg?: string
}

export function Masthead({
  teamId,
  meters,
  pages,
  activePage,
  onNavigate,
  onDisconnect,
}: {
  teamId: string
  meters: MastheadMeter[]
  pages: PageConfig[]
  activePage: PageKey
  onNavigate: (key: PageKey) => void
  onDisconnect: () => void
}) {
  return (
    <header
      data-lay="header"
      className="border-border flex flex-0 flex-wrap items-center justify-between gap-6 border-b px-7.5 pt-2.75"
    >
      <div>
        <div className="flex items-baseline gap-3">
          <span className="dsp text-base" style={{ color: 'var(--accent)' }}>
            FPL&#8202;Scout
          </span>
          <button
            onClick={onDisconnect}
            title="Switch team"
            className="fig cursor-pointer border-0 bg-transparent p-0 text-[11.5px]"
            style={{ color: 'var(--fg3)' }}
          >
            Team {teamId} · switch
          </button>
        </div>
        <nav data-lay="nav" className="mt-2.25 flex items-stretch gap-5.5">
          {pages.map((p) => {
            const active = p.key === activePage
            return (
              <button
                key={p.key}
                data-nav
                onClick={() => onNavigate(p.key)}
                className="dsp cursor-pointer border-0 border-b-2 bg-transparent pb-2.25 text-[15px] font-semibold"
                style={{
                  borderBottomColor: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--fg)' : 'var(--fg3)',
                }}
              >
                {p.title}
              </button>
            )
          })}
        </nav>
      </div>
      <div
        data-lay="meters"
        className="rounded-(--r-card) flex items-center border"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        {meters.map((m) => (
          <div
            key={m.k}
            className="border-r px-3.75 py-1.75"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="lbl text-[8.5px]">{m.k}</div>
            <div
              className="fig mt-0.5 text-sm font-semibold"
              style={{ color: m.fg ?? 'var(--fg)' }}
            >
              {m.v}
            </div>
          </div>
        ))}
      </div>
    </header>
  )
}
