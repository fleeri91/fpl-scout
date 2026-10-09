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
        <div className="flex min-w-0 flex-wrap items-baseline gap-3">
          <span
            className="dsp text-base whitespace-nowrap"
            style={{ color: 'var(--accent)' }}
          >
            FPL&#8202;Scout
          </span>
          <button
            onClick={onDisconnect}
            title="Switch team"
            className="fig cursor-pointer border-0 bg-transparent p-0 text-[11.5px] whitespace-nowrap"
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
        className="flex max-w-full items-stretch rounded-(--r-card) border"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        {meters.map((m) => (
          <div
            key={m.k}
            className="flex-none border-r px-3.75 py-1.75 whitespace-nowrap"
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

// Phone-only bottom navigation; fpl-scout.css hides the masthead nav and
// shows this below 620px.
export function TabBar({
  pages,
  activePage,
  onNavigate,
}: {
  pages: PageConfig[]
  activePage: PageKey
  onNavigate: (key: PageKey) => void
}) {
  return (
    <nav data-tabbar>
      {pages.map((p) => {
        const active = p.key === activePage
        return (
          <button
            key={p.key}
            onClick={() => onNavigate(p.key)}
            className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1.25 border-0 bg-transparent"
            style={{ color: active ? 'var(--fg)' : 'var(--fg3)' }}
          >
            <span
              className="block h-0.5 w-4.5 rounded-[2px]"
              style={{ background: active ? 'var(--accent)' : 'transparent' }}
            />
            <span className="dsp text-[13px] font-semibold">{p.title}</span>
          </button>
        )
      })}
    </nav>
  )
}
