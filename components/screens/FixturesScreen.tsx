'use client'

import { useMemo, useState } from 'react'
import type { BestWindow, FixturePlannerRow } from '../mapFplData'

type FxSortKey = 'club' | 'mean'

export function FixturesScreen({
  gws,
  matrix,
  bestWindows,
  horizon,
  horizonMax,
  onHorizonChange,
  squadTeams,
}: {
  gws: string[]
  matrix: FixturePlannerRow[]
  bestWindows: BestWindow[]
  horizon: number
  horizonMax: number
  onHorizonChange: (v: number) => void
  squadTeams: string[]
}) {
  const [fxSort, setFxSort] = useState<FxSortKey>('club')

  const holdingCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of squadTeams) counts.set(t, (counts.get(t) ?? 0) + 1)
    return counts
  }, [squadTeams])

  const sortedMatrix = useMemo(
    () =>
      [...matrix].sort((a, b) =>
        fxSort === 'mean'
          ? parseFloat(a.avg) - parseFloat(b.avg)
          : a.team.localeCompare(b.team)
      ),
    [matrix, fxSort]
  )

  return (
    <section
      data-lay="split"
      className="grid flex-1 items-start gap-5.5 px-7.5 pt-5 pb-6.5"
      style={{ gridTemplateColumns: 'minmax(0,1fr) 260px' }}
    >
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="dsp text-[27px]">Fixture difficulty</div>
            <div
              className="ed mt-0.75 text-[13px]"
              style={{ color: 'var(--fg3)' }}
            >
              All twenty clubs, tagged H for home and A for away.
            </div>
          </div>
          <div className="flex items-end gap-5">
            <div className="flex items-center gap-1">
              <span className="lbl mr-1">Scale</span>
              {[1, 2, 3, 4, 5].map((d) => (
                <span key={d} data-d={d} className="px-2 py-0.75">
                  {d}
                </span>
              ))}
            </div>
            <div className="min-w-37.5">
              <div className="lbl mb-1.25">Horizon · {horizon} weeks</div>
              <input
                type="range"
                min={3}
                max={horizonMax}
                step={1}
                value={horizon}
                onChange={(e) => onHorizonChange(Number(e.target.value))}
                className="w-full accent-(--accent)"
              />
            </div>
          </div>
        </div>

        <div
          data-scroll
          className="overflow-x-auto rounded-(--r-card) border"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <table className="w-full min-w-155 border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: 'var(--border2)' }}
              >
                <th
                  onClick={() => setFxSort('club')}
                  className="lbl cursor-pointer px-3 py-2 text-left font-medium"
                  style={{
                    color: fxSort === 'club' ? 'var(--fg)' : 'var(--fg3)',
                  }}
                >
                  Club
                </th>
                {gws.map((g) => (
                  <th
                    key={g}
                    className="lbl px-1 py-2 text-[8.5px] font-medium"
                  >
                    {g}
                  </th>
                ))}
                <th
                  onClick={() => setFxSort('mean')}
                  className="lbl cursor-pointer px-3 py-2 text-right font-medium"
                  style={{
                    color: fxSort === 'mean' ? 'var(--fg)' : 'var(--fg3)',
                  }}
                >
                  Mean
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMatrix.map((row) => {
                const holding = holdingCounts.get(row.team) ?? 0
                const mean = parseFloat(row.avg)
                return (
                  <tr key={row.team} className="border-border border-b">
                    <td className="px-3 py-0.75 whitespace-nowrap">
                      <span className="dsp text-[14.5px]">{row.team}</span>
                      {holding > 0 ? (
                        <span
                          className="fig ml-1.25 text-[8px]"
                          style={{ color: 'var(--accent)' }}
                        >
                          {'●'.repeat(holding)}
                        </span>
                      ) : null}
                    </td>
                    {row.cells.map((c, i) => {
                      const home = c.opp === c.opp.toUpperCase()
                      return (
                        <td key={i} className="px-0.75 py-0.5">
                          <div
                            title={(home ? 'Home to ' : 'Away at ') + c.opp}
                            data-d={c.d}
                            className="relative h-6.5"
                            style={{ outline: c.ring, outlineOffset: -2 }}
                          >
                            <span>{c.label}</span>
                            <span className="fig absolute top-0.5 right-0.75 text-[7.5px] opacity-60">
                              {home ? 'H' : 'A'}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                    <td
                      className="fig px-3 py-0.75 text-right text-xs"
                      style={{
                        color:
                          mean < 2.5
                            ? 'var(--pos)'
                            : mean > 3.6
                              ? 'var(--neg)'
                              : 'var(--fg2)',
                      }}
                    >
                      {row.avg}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside>
        <div className="lbl mb-2">Best three-week windows</div>
        {bestWindows.map((w) => {
          const holding = holdingCounts.get(w.team) ?? 0
          return (
            <div
              key={w.team}
              className="mb-2.25 rounded-(--r-card) border px-3.5 py-3"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--card)',
              }}
            >
              <div className="flex items-baseline justify-between gap-2.5">
                <span className="dsp text-xl">{w.team}</span>
                <span
                  className="fig text-[13px]"
                  style={{ color: 'var(--accent)' }}
                >
                  {w.avg}
                </span>
              </div>
              <div
                className="fig mt-0.75 text-[10px]"
                style={{ color: 'var(--fg3)' }}
              >
                {w.range}
              </div>
              <div
                className="ed mt-1.25 text-[12.5px] text-pretty"
                style={{ color: 'var(--fg2)' }}
              >
                {w.note} {holding > 0 ? `You hold ${holding}` : 'Nobody held'}.
              </div>
            </div>
          )
        })}
      </aside>
    </section>
  )
}
