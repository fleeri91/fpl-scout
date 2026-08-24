'use client'

import { useMemo, useState } from 'react'
import type { BestWindow, FixturePlannerRow } from '../mapFplData'

type FxSortKey = 'team' | 'avg'
type Scope = 'All' | 'Mine'

export function FixturesScreen({
  gws,
  matrix,
  bestWindows,
  windowLen,
  windowMax,
  windowLenLabel,
  onWindowLenChange,
  horizon,
  horizonMax,
  horizonLabel,
  onHorizonChange,
  windowNote,
  cellW,
  squadTeams,
}: {
  gws: string[]
  matrix: FixturePlannerRow[]
  bestWindows: BestWindow[]
  windowLen: number
  windowMax: number
  windowLenLabel: string
  onWindowLenChange: (v: number) => void
  horizon: number
  horizonMax: number
  horizonLabel: string
  onHorizonChange: (v: number) => void
  windowNote: string
  cellW: string
  squadTeams: string[]
}) {
  const [fxSort, setFxSort] = useState<FxSortKey>('team')
  const [fxDir, setFxDir] = useState<1 | -1>(1)
  const [scope, setScope] = useState<Scope>('All')

  const holdingCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of squadTeams) counts.set(t, (counts.get(t) ?? 0) + 1)
    return counts
  }, [squadTeams])

  const sortedMatrix = useMemo(() => {
    const rows = matrix.filter(
      (r) => scope === 'All' || holdingCounts.has(r.team)
    )
    rows.sort((a, b) =>
      fxSort === 'team'
        ? a.team.localeCompare(b.team) * fxDir
        : (parseFloat(a.avg) - parseFloat(b.avg)) * fxDir
    )
    return rows
  }, [matrix, fxSort, fxDir, scope, holdingCounts])

  const toggleSort = (key: FxSortKey) => {
    if (fxSort === key) setFxDir((d) => (d === 1 ? -1 : 1))
    else {
      setFxSort(key)
      setFxDir(1)
    }
  }

  return (
    <section className="flex flex-col px-7.5 pt-5 pb-5">
      <div className="flex flex-0 flex-wrap items-end justify-between gap-6">
        <div>
          <span className="dsp text-[27px]">Fixtures</span>
          <p className="m-0 mt-0.75 text-[13px] text-(--fg3)">
            GW{gws[0]?.replace('GW', '')} to GW
            {gws[gws.length - 1]?.replace('GW', '')}, using the game&apos;s
            own home and away difficulty ratings. Home fixtures set in the
            heavier face.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex items-center gap-1.25">
            <span className="lbl mr-1">Difficulty</span>
            {[1, 2, 3, 4, 5].map((d) => (
              <span key={d} data-d={d} className="px-2 py-0.75">
                {d}
              </span>
            ))}
          </div>
          <div>
            <div className="lbl mb-1.25">Show</div>
            <div className="flex gap-0.5">
              {(['All', 'Mine'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className="border-0 border-b-2 bg-transparent px-2.25 py-1 text-xs whitespace-nowrap"
                  style={{
                    borderBottomColor:
                      scope === s ? 'var(--accent)' : 'transparent',
                    color: scope === s ? 'var(--fg)' : 'var(--fg3)',
                  }}
                >
                  {s === 'All' ? 'All clubs' : 'My clubs'}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-40">
            <div className="lbl mb-1.25">Horizon · {horizonLabel}</div>
            <input
              type="range"
              min={3}
              max={horizonMax}
              step={1}
              value={horizon}
              onChange={(e) => onHorizonChange(Number(e.target.value))}
              className="accent-(--accent) w-full"
            />
          </div>
          <div className="min-w-35">
            <div className="lbl mb-1.25">Window · {windowLenLabel}</div>
            <input
              type="range"
              min={2}
              max={windowMax}
              step={1}
              value={windowLen}
              onChange={(e) => onWindowLenChange(Number(e.target.value))}
              className="accent-(--accent) w-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-[minmax(0,1fr)_250px] gap-6.5">
        <div className="border-border overflow-x-auto border-t-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  onClick={() => toggleSort('team')}
                  className="lbl sticky top-0 left-0 z-3 cursor-pointer bg-(--bg) px-2.5 py-1.75 text-left whitespace-nowrap"
                  style={{ color: fxSort === 'team' ? 'var(--fg)' : 'var(--fg3)' }}
                >
                  Club{fxSort === 'team' ? (fxDir > 0 ? ' ↑' : ' ↓') : ''}
                </th>
                {gws.map((g) => (
                  <th
                    key={g}
                    className="mono sticky top-0 z-2 bg-(--bg) px-0.75 py-1.75 text-[9px] tracking-[.1em] text-(--fg3)"
                  >
                    {g}
                  </th>
                ))}
                <th
                  onClick={() => toggleSort('avg')}
                  className="lbl sticky top-0 z-2 cursor-pointer bg-(--bg) px-2.5 py-1.75 text-right whitespace-nowrap"
                  style={{ color: fxSort === 'avg' ? 'var(--fg)' : 'var(--fg3)' }}
                >
                  Mean{fxSort === 'avg' ? (fxDir > 0 ? ' ↑' : ' ↓') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedMatrix.map((row) => {
                const holding = holdingCounts.get(row.team) ?? 0
                return (
                  <tr key={row.team} className="border-border border-b">
                    <td className="sticky left-0 z-1 bg-(--bg) px-2.5 py-1 whitespace-nowrap">
                      <span className="dsp text-[15.5px]">{row.team}</span>
                      {holding > 0 ? (
                        <span className="text-primary mono ml-1.5 text-[9px]">
                          {'●'.repeat(holding)}
                        </span>
                      ) : null}
                    </td>
                    {row.cells.map((c, i) => (
                      <td key={i} className="p-0.75">
                        <div
                          title={
                            (c.opp === c.opp.toUpperCase()
                              ? 'Home to '
                              : 'Away at ') + c.opp
                          }
                          data-d={c.d}
                          className="relative h-8"
                          style={{
                            minWidth: cellW,
                            outline: c.ring,
                            outlineOffset: -2,
                            fontWeight: c.opp === c.opp.toUpperCase() ? 600 : 400,
                          }}
                        >
                          <span className="block w-full text-center">
                            {c.opp}
                          </span>
                        </div>
                      </td>
                    ))}
                    <td className="mono px-2.5 py-1 text-right text-xs text-(--fg2)">
                      {row.avg}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="border-border border-l pl-5.5">
          <div className="lbl mb-1">The favourable stretch</div>
          <p className="mb-3.5 text-[12px] leading-[1.55] text-(--fg3) italic">
            {windowNote}
          </p>
          {bestWindows.map((w) => {
            const holding = holdingCounts.get(w.team) ?? 0
            return (
              <div key={w.team} className="border-border mb-3.25 border-b pb-3.25">
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="dsp text-[22px]">{w.team}</span>
                  <span className="mono text-primary text-[13px]">
                    {w.avg}
                  </span>
                </div>
                <div className="mono mt-1 text-[10px] text-(--fg3)">
                  {w.range}
                </div>
                <div className="mt-1.5 text-pretty text-[12.5px] leading-[1.55] text-(--fg2)">
                  {w.note}
                </div>
                <div className="mt-1.25 text-[12px] text-(--fg3) italic">
                  {holding > 0
                    ? `You hold ${holding} player${holding > 1 ? 's' : ''} here.`
                    : 'You hold nobody here.'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
