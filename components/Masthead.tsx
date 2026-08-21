'use client'

import type { PageConfig, PageKey } from './types'

export function Masthead({
  gw,
  season,
  countdown,
  teamId,
  pages,
  activePage,
  onNavigate,
  onDisconnect,
}: {
  gw: number
  season: string
  countdown: string
  teamId: string
  pages: PageConfig[]
  activePage: PageKey
  onNavigate: (key: PageKey) => void
  onDisconnect: () => void
}) {
  return (
    <header className="border-border flex-0 border-b-2 px-7.5 pt-3">
      <div className="flex items-end justify-between gap-6 pb-2.5">
        <div className="flex items-baseline gap-4">
          <span className="dsp text-[29px] leading-none font-extrabold tracking-[.01em]">
            FPL&#8202;Scout
          </span>
          <span className="lbl">
            The Weekly Ledger · Gameweek {gw} · {season}
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="mono text-primary text-xs">{countdown}</span>
          <span className="mono text-[10px] text-(--fg3)">ID {teamId}</span>
          <button
            onClick={onDisconnect}
            className="border-border rounded-(--r-ctl) border px-2.5 py-1 text-[11px] text-(--fg2) hover:text-foreground"
          >
            Change
          </button>
        </div>
      </div>
      <nav className="border-border flex items-stretch gap-0 border-t">
        {pages.map((p) => {
          const active = p.key === activePage
          return (
            <button
              key={p.key}
              data-sec
              onClick={() => onNavigate(p.key)}
              className="flex flex-1 cursor-pointer items-baseline gap-2 border-t-2 bg-transparent py-2.25 pb-2 text-left hover:text-foreground"
              style={{
                borderTopColor: active ? 'var(--accent)' : 'transparent',
                color: active ? 'var(--fg)' : 'var(--fg3)',
              }}
            >
              <span className="mono text-[9px] tracking-[.14em] text-(--fg3)">
                {p.roman}
              </span>
              <span className="dsp text-[16px] font-semibold whitespace-nowrap">
                {p.title}
              </span>
            </button>
          )
        })}
      </nav>
    </header>
  )
}
