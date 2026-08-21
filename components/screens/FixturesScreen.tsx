'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { BestWindow, FixturePlannerRow } from '../mapFplData'

type FxSortKey = 'team' | 'avg'

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
  cellFont,
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
  cellFont: string
}) {
  const [fxSort, setFxSort] = useState<FxSortKey>('team')
  const [fxDir, setFxDir] = useState<1 | -1>(1)

  const sortedMatrix = useMemo(() => {
    const rows = [...matrix]
    rows.sort((a, b) =>
      fxSort === 'team'
        ? a.team.localeCompare(b.team) * fxDir
        : (parseFloat(a.avg) - parseFloat(b.avg)) * fxDir
    )
    return rows
  }, [matrix, fxSort, fxDir])

  const toggleSort = (key: FxSortKey) => {
    if (fxSort === key) setFxDir((d) => (d === 1 ? -1 : 1))
    else {
      setFxSort(key)
      setFxDir(1)
    }
  }

  return (
    <div className="flex flex-col gap-3.5 p-5.5">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex items-center gap-2 text-[11px] text-(--fg3)">
          <span className="tracking-wider uppercase">Difficulty</span>
          {[1, 2, 3, 4, 5].map((d) => (
            <span key={d} data-d={d} className="px-2.25 py-0.75">
              {d}
            </span>
          ))}
          <span className="ml-2.5 inline-flex items-center gap-1 text-(--fg2)">
            <Badge
              variant="outline"
              className="h-auto w-auto min-w-0 gap-0 rounded-[4px] border-current px-0.75 py-px text-[9px] font-medium text-current opacity-70"
            >
              H
            </Badge>
            home ·
            <Badge
              variant="outline"
              className="h-auto w-auto min-w-0 gap-0 rounded-[4px] border-current px-0.75 py-px text-[9px] font-medium text-current opacity-70"
            >
              A
            </Badge>
            away
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-2 text-xs text-(--fg2)">
            <span className="border-primary inline-block size-2.5 rounded-[3px] border-[1.5px]" />
            Best {windowLenLabel} window
          </div>
          <div className="flex min-w-42.5 flex-col gap-1.25">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[10px] tracking-wider text-(--fg3) uppercase">
                Window
              </span>
              <span className="mono text-xs text-(--fg2)">
                {windowLenLabel}
              </span>
            </div>
            <Slider
              min={2}
              max={windowMax}
              step={1}
              value={[windowLen]}
              onValueChange={(v) =>
                onWindowLenChange(Array.isArray(v) ? v[0] : v)
              }
            />
          </div>
          <div className="flex min-w-62.5 flex-col gap-1.25">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[10px] tracking-wider text-(--fg3) uppercase">
                Horizon
              </span>
              <span className="mono text-xs text-(--fg2)">{horizonLabel}</span>
            </div>
            <Slider
              min={3}
              max={horizonMax}
              step={1}
              value={[horizon]}
              onValueChange={(v) =>
                onHorizonChange(Array.isArray(v) ? v[0] : v)
              }
            />
          </div>
        </div>
      </div>

      <Card className="border-border max-h-120 gap-0 overflow-y-auto rounded-xl py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-(--card2)">
              <TableHead
                onClick={() => toggleSort('team')}
                className={cn(
                  'sticky top-0 left-0 z-20 h-auto cursor-pointer bg-(--card2) px-3 py-2.25 text-[10px] font-semibold tracking-wider whitespace-nowrap uppercase',
                  fxSort === 'team' ? 'text-foreground' : 'text-(--fg3)'
                )}
              >
                Team{fxSort === 'team' ? (fxDir > 0 ? ' ↑' : ' ↓') : ''}
              </TableHead>
              {gws.map((g) => (
                <TableHead
                  key={g}
                  className="mono sticky top-0 z-10 h-auto bg-(--card2) px-1.5 py-2.25 text-center text-[10px] font-semibold tracking-wider text-(--fg3)"
                >
                  {g}
                </TableHead>
              ))}
              <TableHead
                onClick={() => toggleSort('avg')}
                className={cn(
                  'sticky top-0 z-10 h-auto cursor-pointer bg-(--card2) px-3 py-2.25 text-right text-[10px] font-semibold tracking-wider whitespace-nowrap uppercase',
                  fxSort === 'avg' ? 'text-foreground' : 'text-(--fg3)'
                )}
              >
                Avg{fxSort === 'avg' ? (fxDir > 0 ? ' ↑' : ' ↓') : ''}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMatrix.map((row) => (
              <TableRow
                key={row.team}
                className="border-border hover:bg-transparent"
              >
                <TableCell className="bg-card sticky left-0 z-5 px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap">
                  {row.team}
                </TableCell>
                {row.cells.map((c, i) => {
                  const home = c.opp === c.opp.toUpperCase()
                  const venueTitle = (home ? 'Home vs ' : 'Away at ') + c.opp
                  return (
                    <TableCell key={i} className="px-0.75 py-0.75">
                      <div
                        title={venueTitle}
                        data-d={c.d}
                        className="h-9 gap-1 font-bold uppercase"
                        style={{
                          outline: c.ring,
                          outlineOffset: -2,
                          borderRadius: 2,
                          minWidth: cellW,
                          fontSize: cellFont,
                        }}
                      >
                        <span>{c.opp}</span>
                        <span>{home ? '(H)' : '(A)'}</span>
                      </div>
                    </TableCell>
                  )
                })}
                <TableCell className="mono px-3 py-1.5 text-right text-xs text-(--fg2)">
                  {row.avg}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="border-border gap-0 rounded-xl p-4">
        <div className="font-heading mb-1 text-[17px] font-bold tracking-tight">
          Best {windowLenLabel} windows
        </div>
        <div className="mb-3.5 text-xs text-(--fg2)">{windowNote}</div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2.5">
          {bestWindows.map((w) => (
            <div
              key={w.team}
              className="border-border rounded-xs border bg-(--card2) p-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold">{w.team}</span>
                <span className="mono text-primary text-xs font-semibold">
                  {w.avg} avg
                </span>
              </div>
              <div className="mono mt-1.5 text-[11px] text-(--fg3)">
                {w.range}
              </div>
              <div className="mt-1.5 text-xs leading-relaxed text-(--fg2)">
                {w.note}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
