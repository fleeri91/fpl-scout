'use client'

import type { KeyboardEvent } from 'react'
import type { RecentTeam } from './recentTeams'

export function ConnectScreen({
  entry,
  entryError,
  recentTeams,
  onEntryChange,
  onEntryKeyDown,
  onConnect,
  onSelectRecent,
}: {
  entry: string
  entryError: string
  recentTeams: RecentTeam[]
  onEntryChange: (value: string) => void
  onEntryKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  onConnect: () => void
  onSelectRecent: (id: string) => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-107.5">
        <div className="dsp mb-4 text-base" style={{ color: 'var(--accent)' }}>
          FPL&#8202;Scout
        </div>
        <div
          className="rounded-(--r-card) border p-6.5 pt-6 pb-5.5"
          style={{ borderColor: 'var(--border2)', background: 'var(--card)' }}
        >
          <div className="dsp text-[28px] leading-[1.06]">
            Enter your team ID
          </div>
          <div className="ed mt-2 text-sm leading-relaxed text-pretty">
            Everything on the next screen is built from your own squad. Your ID
            is the number in your team&apos;s URL on the official site —
            fantasy.premierleague.com/entry/
            <span className="text-foreground">3821094</span>/event/12.
          </div>

          <div className="mt-4.5 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={entry}
              placeholder="e.g. 3821094"
              onChange={(e) => onEntryChange(e.target.value)}
              onKeyDown={onEntryKeyDown}
              className="fig min-w-0 flex-1 rounded-(--r-ctl) border px-3.25 py-2.75 text-[15px]"
              style={{
                borderColor: 'var(--border2)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
              // Sibling shadcn inputs set caret-color on the client only —
              // matching that here keeps this a benign, expected SSR mismatch.
              suppressHydrationWarning
            />
            <button
              onClick={onConnect}
              data-act
              className="cursor-pointer rounded-(--r-ctl) px-4.5 py-2.75 text-[13px] font-semibold whitespace-nowrap"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              Load squad
            </button>
          </div>
          {entryError ? (
            <div
              className="ed mt-1.75 text-[12.5px]"
              style={{ color: 'var(--neg)' }}
            >
              {entryError}
            </div>
          ) : null}

          {recentTeams.length > 0 ? (
            <div
              className="mt-5.5 border-t pt-3.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="lbl mb-1.5">Recently used</div>
              {recentTeams.map((t) => (
                <button
                  key={t.id}
                  data-exp
                  onClick={() => onSelectRecent(t.id)}
                  className="flex w-full cursor-pointer items-baseline justify-between gap-3 border-b bg-transparent px-0.5 py-2.5 text-left"
                  style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
                >
                  <span className="min-w-0 flex-auto overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="dsp text-[15px]">
                      {t.name ?? `Team ${t.id}`}
                    </span>
                    <span
                      className="fig ml-2 text-[11px]"
                      style={{ color: 'var(--fg3)' }}
                    >
                      {t.id}
                    </span>
                  </span>
                  {t.rank != null ? (
                    <span
                      className="fig text-[11.5px] whitespace-nowrap"
                      style={{ color: 'var(--fg3)' }}
                    >
                      rank {t.rank.toLocaleString('en-GB')}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
