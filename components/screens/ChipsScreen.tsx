'use client'

import type { ChipCardView } from '../mapFplData'

const ROMAN = ['I', 'II', 'III', 'IV']

const AGAINST_TEXT: Record<string, string> = {
  Wildcard:
    'A run of injuries to key players, or a sharp fixture swing, would move this window earlier.',
  'Free Hit':
    'If the blank turns out smaller than projected, a single free transfer covers it instead.',
  'Bench Boost':
    "If the bench isn't rebuilt in time, the chip returns fewer points than simply holding it.",
  'Triple Captain':
    'A confirmed double gameweek for a premium player would change the recommended date immediately.',
}

export function ChipsScreen({ chips }: { chips: ChipCardView[] }) {
  return (
    <section
      className="grid h-full items-start gap-3.5 overflow-y-auto px-7.5 py-5"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
    >
      {chips.map((c, i) => {
        const filledPips =
          c.conf > 0 ? Math.max(1, Math.min(5, Math.round(c.conf / 20))) : 0
        return (
          <div
            key={c.name}
            className="rounded-(--r-card) border px-4.5 pt-4 pb-3.5"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <div className="flex items-baseline justify-between gap-2.5">
              <span
                className="fig text-[10px] tracking-[.12em]"
                style={{ color: 'var(--fg3)' }}
              >
                {ROMAN[i] ?? i + 1}
              </span>
              <span
                className="lbl"
                style={{
                  color:
                    c.status === 'Unused' ? 'var(--pos)' : 'var(--fg3)',
                }}
              >
                {c.status}
              </span>
            </div>
            <div className="dsp mt-1.25 text-[25px] leading-[1.04]">
              {c.name}
            </div>
            <div className="ed mt-0.5 text-xs" style={{ color: 'var(--fg3)' }}>
              {c.availability}
            </div>

            <div className="lbl mt-3">Recommended</div>
            <div
              className="fig mt-0.5 text-[19px] font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              {c.window}
            </div>

            {c.reasons.length > 0 ? (
              <div className="mt-3 flex flex-col gap-1.5">
                {c.reasons.map((r, n) => (
                  <div
                    key={r}
                    className="grid gap-2"
                    style={{ gridTemplateColumns: '14px minmax(0,1fr)' }}
                  >
                    <span
                      className="fig text-[10px] leading-[1.6]"
                      style={{ color: 'var(--accent)' }}
                    >
                      {n + 1}
                    </span>
                    <span
                      className="text-pretty text-[12.5px] leading-[1.45]"
                      style={{ color: 'var(--fg2)' }}
                    >
                      {r}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {AGAINST_TEXT[c.name] ? (
              <div
                className="mt-3 border-t pt-2.5"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="lbl mb-1">What would change it</div>
                <div
                  className="text-pretty text-[12.5px] leading-[1.45]"
                  style={{ color: 'var(--fg3)' }}
                >
                  {AGAINST_TEXT[c.name]}
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-2.25">
              <span className="lbl">Conviction</span>
              <div className="flex gap-0.75">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className="h-1 w-3.5 rounded-[1px]"
                    style={{
                      background:
                        n <= filledPips ? 'var(--accent)' : 'var(--border2)',
                    }}
                  />
                ))}
              </div>
              <span className="fig text-[11px]" style={{ color: 'var(--fg2)' }}>
                {c.confLabel}
              </span>
            </div>
          </div>
        )
      })}
    </section>
  )
}
