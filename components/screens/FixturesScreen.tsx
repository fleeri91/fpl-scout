'use client'

import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { BestWindow, FixturePlannerRow } from '../mapFplData'

export function FixturesScreen({
  gws,
  matrix,
  bestWindows,
}: {
  gws: string[]
  matrix: FixturePlannerRow[]
  bestWindows: BestWindow[]
}) {
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
          <span className="ml-1.5">Home in caps, away lowercase</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-(--fg2)">
          <span className="border-primary inline-block size-2.5 rounded-sm border-[1.5px]" />
          Best 3-GW window
        </div>
      </div>

      <Card className="border-border gap-0 rounded-xl py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-(--card2) hover:bg-(--card2)">
              <TableHead className="h-auto px-3 py-2.25 text-[10px] font-semibold tracking-wider text-(--fg3) uppercase">
                Team
              </TableHead>
              {gws.map((g) => (
                <TableHead
                  key={g}
                  className="mono h-auto px-1.5 py-2.25 text-center text-[10px] font-semibold tracking-wider text-(--fg3)"
                >
                  {g}
                </TableHead>
              ))}
              <TableHead className="h-auto px-3 py-2.25 text-right text-[10px] font-semibold tracking-wider text-(--fg3) uppercase">
                Avg
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.map((row) => (
              <TableRow
                key={row.team}
                className="border-border hover:bg-transparent"
              >
                <TableCell className="px-3 py-1.5 text-[13px] font-semibold">
                  {row.team}
                </TableCell>
                {row.cells.map((c, i) => (
                  <TableCell key={i} className="px-0.75 py-0.75">
                    <div
                      data-d={c.d}
                      className="h-7.5"
                      style={{
                        outline: c.ring,
                        outlineOffset: -2,
                        borderRadius: 5,
                      }}
                    >
                      {c.opp}
                    </div>
                  </TableCell>
                ))}
                <TableCell className="mono px-3 py-1.5 text-right text-xs text-(--fg2)">
                  {row.avg}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="border-border gap-0 rounded-xl p-4">
        <div className="mb-1 text-sm font-semibold">Best windows</div>
        <div className="mb-3.5 text-xs text-(--fg2)">
          Lowest average difficulty across any three consecutive gameweeks.
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2.5">
          {bestWindows.map((w) => (
            <div
              key={w.team}
              className="border-border rounded-[10px] border bg-(--card2) p-3"
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
