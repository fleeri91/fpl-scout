'use client'

import { useMemo, useState } from 'react'
import type { FixturePlannerRow } from '../mapFplData'

type FxSortKey = 'club' | 'mean' | 'run'

const FX_SORTS: [FxSortKey, string][] = [
  ['club', 'A–Z'],
  ['mean', 'Easiest overall'],
  ['run', 'Easiest run'],
]

export function FixturesScreen({
  gws,
  rows,
  horizon,
  horizonMax,
  onHorizonChange,
  fromEventId,
  windowLen,
  onWindowChange,
  squadTeams,
}: {
  gws: string[]
  rows: FixturePlannerRow[]
  horizon: number
  horizonMax: number
  onHorizonChange: (v: number) => void
  fromEventId: number
  windowLen: number
  onWindowChange: (v: number) => void
  squadTeams: string[]
}) {
  const [fxSort, setFxSort] = useState<FxSortKey>('club')
  const [mineOnly, setMineOnly] = useState(false)
  const [pin, setPin] = useState<string | null>(null)

  const holdingCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of squadTeams) counts.set(t, (counts.get(t) ?? 0) + 1)
    return counts
  }, [squadTeams])

  const matrix = useMemo(
    () =>
      rows
        .filter((r) => !mineOnly || holdingCounts.has(r.team))
        .sort((a, b) =>
          fxSort === 'mean'
            ? a.mean - b.mean
            : fxSort === 'run'
              ? a.best.avg - b.best.avg
              : a.team.localeCompare(b.team)
        ),
    [rows, mineOnly, holdingCounts, fxSort]
  )

  const easiestRuns = useMemo(
    () => [...rows].sort((a, b) => a.best.avg - b.best.avg).slice(0, 5),
    [rows]
  )

  const topClubs = useMemo(
    () => new Set(easiestRuns.map((r) => r.team)),
    [easiestRuns]
  )

  const togglePin = (team: string) => setPin((p) => (p === team ? null : team))

  const lastGw = fromEventId + horizon - 1
  const horizonLabel =
    horizon === horizonMax && lastGw === 38
      ? `All · GW${fromEventId}–38`
      : `${horizon} ${horizon === 1 ? 'week' : 'weeks'} · GW${fromEventId}${horizon > 1 ? `–${lastGw}` : ''}`
  const weeks = (n: number) => `${n} ${n === 1 ? 'week' : 'weeks'}`

  return (
    <section
      data-lay="split"
      className="grid flex-1 items-start gap-5.5 px-7.5 pt-5 pb-6.5"
      style={{ gridTemplateColumns: 'minmax(0,1fr) 250px' }}
    >
      <div className="min-w-0">
        <div className="mb-3.5">
          <div className="dsp text-[27px]">Fixture difficulty</div>
          <div
            className="ed mt-0.75 text-[13px] text-pretty"
            style={{ color: 'var(--fg3)' }}
          >
            Green is easy, red is hard. The outlined boxes mark the five easiest
            runs. Click a club to see its own.
          </div>
        </div>

        <div
          data-fxctl
          className="mb-2.5 flex flex-wrap items-end gap-x-5.5 gap-y-3.5 rounded-(--r-card) border px-3.5 py-3"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <div className="min-w-45 flex-[1_1_220px]">
            <div className="mb-1.5 flex justify-between gap-2">
              <span className="lbl">Look ahead</span>
              <span
                className="fig text-[11px] whitespace-nowrap"
                style={{ color: 'var(--fg)' }}
              >
                {horizonLabel}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={horizonMax}
              step={1}
              value={horizon}
              onChange={(e) => onHorizonChange(Number(e.target.value))}
              className="m-0 w-full accent-(--accent)"
            />
          </div>
          <div className="min-w-37.5 flex-[1_1_160px]">
            <div className="mb-1.5 flex justify-between gap-2">
              <span
                className="lbl"
                title="How many weeks in a row count as a run (3–6)"
              >
                Run length
              </span>
              <span
                className="fig text-[11px] whitespace-nowrap"
                style={{ color: 'var(--fg)' }}
              >
                {weeks(windowLen)}
              </span>
            </div>
            <input
              type="range"
              min={Math.min(3, horizon)}
              max={Math.min(6, horizon)}
              step={1}
              value={windowLen}
              onChange={(e) => onWindowChange(Number(e.target.value))}
              className="m-0 w-full accent-(--accent)"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="lbl">Sort</span>
            <div
              data-seg
              className="flex gap-0.5 rounded-(--r-ctl) border p-0.5"
              style={{ borderColor: 'var(--border2)' }}
            >
              {FX_SORTS.map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFxSort(k)}
                  className="cursor-pointer rounded-sm border-0 px-2.5 py-1.25 text-xs whitespace-nowrap"
                  style={{
                    background: fxSort === k ? 'var(--card2)' : 'transparent',
                    color: fxSort === k ? 'var(--fg)' : 'var(--fg3)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setMineOnly((m) => !m)}
            className="flex cursor-pointer items-center gap-1.75 rounded-(--r-ctl) border bg-transparent px-2.75 py-1.75 text-xs whitespace-nowrap"
            style={{
              borderColor: mineOnly ? 'var(--accent)' : 'var(--border2)',
              color: mineOnly ? 'var(--fg)' : 'var(--fg2)',
            }}
          >
            <span
              className="block size-3 rounded-[3px] border"
              style={{
                borderColor: mineOnly ? 'var(--accent)' : 'var(--border2)',
                background: mineOnly ? 'var(--accent)' : 'transparent',
              }}
            />
            My clubs only
          </button>
        </div>

        <div data-runsm className="mb-3.5">
          <div className="mb-2 flex items-baseline gap-2.5">
            <span className="lbl">Easiest runs</span>
            <span
              className="ed text-xs whitespace-nowrap"
              style={{ color: 'var(--fg3)' }}
            >
              Tap to focus
            </span>
          </div>
          <div data-runs>
            {easiestRuns.map((r, rank) => (
              <button
                key={r.team}
                onClick={() => togglePin(r.team)}
                className="block cursor-pointer rounded-(--r-card) border px-3 py-2.5 text-left"
                style={{
                  borderColor:
                    pin === r.team ? 'var(--accent)' : 'var(--border)',
                  background: 'var(--card)',
                  color: 'var(--fg)',
                }}
              >
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="flex items-baseline gap-1.75">
                    <span
                      className="fig text-[10px]"
                      style={{ color: 'var(--fg3)' }}
                    >
                      {rank + 1}
                    </span>
                    <span className="dsp text-[17px]">{r.team}</span>
                  </span>
                  <span
                    className="fig text-xs whitespace-nowrap"
                    style={{ color: 'var(--pos)' }}
                  >
                    {r.best.avg.toFixed(1)} avg
                  </span>
                </div>
                <RunStrip row={r} windowLen={windowLen} className="mt-1.75" />
                <div
                  className="fig mt-1.5 text-[10px]"
                  style={{ color: 'var(--fg3)' }}
                >
                  {r.best.range}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span className="lbl mr-1">Easier</span>
            {[1, 2, 3, 4, 5].map((d) => (
              <span key={d} data-d={d} className="h-4 w-5.5">
                {d}
              </span>
            ))}
            <span className="lbl ml-1">Harder</span>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="lbl flex items-center gap-1.25">
              <span
                className="block h-2.25 w-3 rounded-[2px]"
                style={{ border: '1.5px solid var(--accent)' }}
              />
              Easiest run
            </span>
            {pin ? (
              <button
                onClick={() => setPin(null)}
                className="cursor-pointer rounded-(--r-ctl) border bg-transparent px-2 py-0.75 text-[11px] whitespace-nowrap"
                style={{ borderColor: 'var(--border2)', color: 'var(--fg2)' }}
              >
                Clear focus ×
              </button>
            ) : null}
          </div>
        </div>

        <div
          data-scroll
          className="overflow-x-auto rounded-(--r-card) border"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th
                  className="lbl sticky left-0 z-2 min-w-18.5 border-b px-3 py-2.25 text-left font-medium"
                  style={{
                    background: 'var(--card)',
                    borderColor: 'var(--border2)',
                  }}
                >
                  Club
                </th>
                {gws.map((g, i) => (
                  <th
                    key={g}
                    className="min-w-11.5 border-b px-0.75 py-1.75 font-medium"
                    style={{ borderColor: 'var(--border2)' }}
                  >
                    <div
                      className="fig text-[10px]"
                      style={{
                        color: i === 0 ? 'var(--accent)' : 'var(--fg3)',
                      }}
                    >
                      {g}
                    </div>
                  </th>
                ))}
                <th
                  className="lbl border-b px-2.5 py-2.25 text-right font-medium whitespace-nowrap"
                  style={{ borderColor: 'var(--border2)' }}
                >
                  Avg
                </th>
                <th
                  className="lbl border-b px-3 py-2.25 text-right font-medium whitespace-nowrap"
                  style={{ borderColor: 'var(--border2)' }}
                >
                  Best run
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => {
                const on = pin === row.team
                return (
                  <tr
                    key={row.team}
                    onClick={() => togglePin(row.team)}
                    className="cursor-pointer transition-opacity duration-150 hover:bg-(--card2)"
                    style={{ opacity: pin && !on ? 0.4 : 1 }}
                  >
                    <td
                      className="sticky left-0 z-1 border-b px-3 py-0.75 whitespace-nowrap"
                      style={{
                        background: on ? 'var(--card2)' : 'var(--card)',
                        borderColor: 'var(--border)',
                        boxShadow: `inset 2px 0 0 ${on ? 'var(--accent)' : 'transparent'}`,
                      }}
                    >
                      <span className="dsp text-[14.5px]">{row.team}</span>
                    </td>
                    {row.cells.map((c, i) => {
                      const home = c.opp === c.opp.toUpperCase()
                      const opp = c.opp.toUpperCase()
                      // Unfocused, the five easiest runs are outlined;
                      // focused, only the chosen club's.
                      const ringed =
                        (pin ? on : topClubs.has(row.team)) &&
                        i >= row.best.start &&
                        i < row.best.start + windowLen
                      return (
                        <td
                          key={i}
                          className="border-b px-0.5 py-0.5"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <div
                            title={`GW${c.event ?? fromEventId + i} · ${home ? 'home to' : 'away at'} ${opp} · difficulty ${c.d}`}
                            data-d={c.d}
                            className="relative h-7 min-w-10.5"
                            style={{
                              outline: ringed
                                ? '2px solid var(--accent)'
                                : 'none',
                              outlineOffset: -2,
                            }}
                          >
                            <span>{opp}</span>
                            <span className="fig absolute top-0.5 right-0.75 text-[7.5px] opacity-60">
                              {home ? 'H' : 'A'}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                    {Array.from(
                      { length: Math.max(0, gws.length - row.cells.length) },
                      (_, i) => (
                        <td
                          key={`blank-${i}`}
                          className="border-b"
                          style={{ borderColor: 'var(--border)' }}
                        />
                      )
                    )}
                    <td
                      className="fig border-b px-2.5 py-0.75 text-right text-xs"
                      style={{
                        borderColor: 'var(--border)',
                        color:
                          row.mean < 2.5
                            ? 'var(--pos)'
                            : row.mean > 3.6
                              ? 'var(--neg)'
                              : 'var(--fg2)',
                      }}
                    >
                      {row.mean.toFixed(1)}
                    </td>
                    <td
                      className="border-b px-3 py-0.75 text-right whitespace-nowrap"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div
                        className="fig text-xs leading-[1.1]"
                        style={{
                          color:
                            row.best.avg <= 2 ? 'var(--pos)' : 'var(--fg2)',
                        }}
                      >
                        {row.best.avg.toFixed(1)}
                      </div>
                      <div
                        className="fig text-[9.5px] leading-[1.2]"
                        style={{ color: 'var(--fg3)' }}
                      >
                        {row.best.range}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {matrix.length === 0 ? (
            <div
              className="ed p-4.5 text-center text-[13px]"
              style={{ color: 'var(--fg3)' }}
            >
              No clubs to show. Turn off &ldquo;My clubs only&rdquo;.
            </div>
          ) : null}
        </div>
      </div>

      <aside data-fxaside className="min-w-0">
        <div className="lbl mb-1">Easiest runs</div>
        <div className="ed mb-2.5 text-xs" style={{ color: 'var(--fg3)' }}>
          Lowest average difficulty over{' '}
          {windowLen === 1 ? '1 week' : `${windowLen} weeks in a row`}. Click to
          focus.
        </div>
        <div data-runs>
          {easiestRuns.map((r, rank) => (
            <button
              key={r.team}
              onClick={() => togglePin(r.team)}
              className="mb-2 block w-full cursor-pointer rounded-(--r-card) border px-3.25 py-2.75 text-left hover:border-(--border2)!"
              style={{
                borderColor: pin === r.team ? 'var(--accent)' : 'var(--border)',
                background: 'var(--card)',
                color: 'var(--fg)',
              }}
            >
              <div className="flex items-baseline justify-between gap-2.5">
                <span className="flex items-baseline gap-2">
                  <span
                    className="fig text-[10px]"
                    style={{ color: 'var(--fg3)' }}
                  >
                    {rank + 1}
                  </span>
                  <span className="dsp text-lg">{r.team}</span>
                </span>
                <span
                  className="fig text-[13px] whitespace-nowrap"
                  style={{ color: 'var(--pos)' }}
                >
                  {r.best.avg.toFixed(1)} avg
                </span>
              </div>
              <RunStrip row={r} windowLen={windowLen} className="mt-2" />
              <div
                className="fig mt-1.5 text-[10px]"
                style={{ color: 'var(--fg3)' }}
              >
                {r.best.range}
              </div>
            </button>
          ))}
        </div>
      </aside>
    </section>
  )
}

// The fixtures making up a club's easiest run, as difficulty chips.
function RunStrip({
  row,
  windowLen,
  className,
}: {
  row: FixturePlannerRow
  windowLen: number
  className: string
}) {
  return (
    <div className={`flex gap-0.75 ${className}`}>
      {row.cells
        .slice(row.best.start, row.best.start + windowLen)
        .map((c, i) => (
          <span key={i} data-d={c.d} className="h-5 flex-1 text-[10px]">
            {c.opp.toUpperCase()}
          </span>
        ))}
    </div>
  )
}
