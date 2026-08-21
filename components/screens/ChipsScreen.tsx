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
    <section className="h-full overflow-y-auto px-7.5 py-6.5">
      <h2 className="dsp m-0 mb-0.75 text-[46px] leading-[.98] font-bold">
        Chips
      </h2>
      <p className="m-0 mb-5.5 text-[13px] text-(--fg3) italic">
        Four instruments, one season. Recommendations are based on your
        squad&apos;s fixtures over the coming gameweeks.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {chips.map((c, i) => {
          const filledPips =
            c.conf > 0 ? Math.max(1, Math.min(5, Math.round(c.conf / 20))) : 0
          return (
            <div
              key={c.name}
              className="border-border mb-2 border-l pr-5.5 pb-2 pl-5.5"
            >
              <div className="mono text-[9px] tracking-[.2em] text-(--fg3)">
                {ROMAN[i] ?? i + 1}
              </div>
              <h3 className="dsp m-0 mt-1.5 mb-0.5 text-[31px] leading-[1.02]">
                {c.name}
              </h3>
              <div className="mb-3.5 text-[11px] text-(--fg3) italic">
                {c.availability} · {c.status}
              </div>
              <div className="lbl">Recommended</div>
              <div className="dsp text-primary my-0.75 mb-3.5 text-[26px]">
                {c.window}
              </div>
              {c.reasons.length > 0 ? (
                <div className="flex flex-col gap-2.25">
                  {c.reasons.map((r, n) => (
                    <div
                      key={r}
                      className="grid gap-2"
                      style={{ gridTemplateColumns: '14px minmax(0,1fr)' }}
                    >
                      <span className="mono text-[10px] leading-[1.7] text-(--fg3)">
                        {n + 1}
                      </span>
                      <span className="text-pretty text-[13px] leading-[1.6] text-(--fg2)">
                        {r}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {AGAINST_TEXT[c.name] ? (
                <div className="border-border mt-3.5 border-t pt-2.75">
                  <div className="lbl mb-1.25">What would change it</div>
                  <div className="text-pretty text-[12.5px] leading-[1.55] text-(--fg3) italic">
                    {AGAINST_TEXT[c.name]}
                  </div>
                </div>
              ) : null}
              <div className="mt-3.5 flex items-center gap-2.25">
                <span className="lbl">Conviction</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className="h-1 w-4"
                      style={{
                        background:
                          n <= filledPips ? 'var(--accent)' : 'var(--border)',
                      }}
                    />
                  ))}
                </div>
                <span className="mono text-[11px] text-(--fg3)">
                  {c.confLabel}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
