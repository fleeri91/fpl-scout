'use client'

import type { KeyboardEvent } from 'react'

export function ConnectScreen({
  entry,
  entryError,
  recentTeamIds,
  onEntryChange,
  onEntryKeyDown,
  onConnect,
  onSelectRecent,
  onRemoveRecent,
}: {
  entry: string
  entryError: string
  recentTeamIds: string[]
  onEntryChange: (value: string) => void
  onEntryKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
  onConnect: () => void
  onSelectRecent: (id: string) => void
  onRemoveRecent: (id: string) => void
}) {
  return (
    <div className="grid min-h-screen place-items-center p-6">
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
            Everything on the next screen is built from your own squad. Your
            ID is the number in your team&apos;s URL on the official site —
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
              className="rounded-(--r-ctl) px-4.5 py-2.75 text-[13px] font-semibold whitespace-nowrap"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              Load squad
            </button>
          </div>
          {entryError ? (
            <div className="mt-1.75 text-xs" style={{ color: 'var(--neg)' }}>
              {entryError}
            </div>
          ) : null}

          {recentTeamIds.length > 0 ? (
            <div
              className="mt-5.5 border-t pt-3.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="lbl mb-1.5">Recently used</div>
              {recentTeamIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 border-b py-2.5"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <button
                    onClick={() => onSelectRecent(id)}
                    className="fig flex-1 cursor-pointer text-left text-[13px]"
                  >
                    {id}
                  </button>
                  <button
                    onClick={() => onRemoveRecent(id)}
                    aria-label={`Remove ${id} from recent teams`}
                    className="cursor-pointer px-1 text-xs"
                    style={{ color: 'var(--fg3)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
