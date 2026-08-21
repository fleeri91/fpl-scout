'use client'

import { useElementSummary } from '@/lib/queries/fpl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { PlayerBarChart } from './PlayerBarChart'
import type { Player } from './types'

export function PlayerSheet({
  player,
  onClose,
}: {
  player: Player
  onClose: () => void
}) {
  const { data: summary, isLoading, isError } = useElementSummary(player.id)

  const bigStats = [
    { k: 'xGI', v: player.xgi.toFixed(2) },
    { k: 'Form', v: player.form.toFixed(1) },
    { k: 'Mins', v: String(player.mins) },
  ]
  const table = [
    { k: 'Expected goals (xG)', v: player.xg.toFixed(2) },
    { k: 'Expected assists (xA)', v: player.xa.toFixed(2) },
    {
      k: 'xGI per 90',
      v: (player.mins > 0 ? player.xgi / (player.mins / 90) : 0).toFixed(2),
    },
    { k: 'Minutes played', v: String(player.mins) },
    { k: 'Ownership', v: player.own.toFixed(1) + '%' },
    { k: 'Price change (season)', v: player.priceMove + 'm' },
    {
      k: 'Next 5 avg FDR',
      v: (player.next.length
        ? player.next.reduce((s, f) => s + f.d, 0) / player.next.length
        : 0
      ).toFixed(1),
    },
  ]

  const chartData = (summary?.history ?? [])
    .slice(-5)
    .map((h) => ({ label: `GW${h.round}`, value: h.total_points }))

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="border-border w-105 gap-0 overflow-y-auto sm:max-w-105">
        <SheetHeader className="border-border gap-1 border-b p-4.5 pr-10">
          <SheetTitle className="flex items-center gap-2.25 text-[25px] font-extrabold tracking-[-0.035em]">
            <i data-status={player.status} className="size-2 rounded-[2px]" />
            {player.name}
          </SheetTitle>
          <SheetDescription className="mono text-xs text-(--fg3)">
            {player.team} · {player.pos} · £{player.price.toFixed(1)}m ·{' '}
            {player.own.toFixed(1)}% owned
          </SheetDescription>
          <div className="text-xs leading-relaxed text-(--fg2)">
            {player.note}
          </div>
        </SheetHeader>
        <div className="flex flex-col gap-4.5 p-4.5">
          <div className="grid grid-cols-3 gap-2.5">
            {bigStats.map((s) => (
              <Card
                key={s.k}
                className="border-border gap-1 rounded-[2px] bg-(--card2) p-2.75"
              >
                <div className="text-[10px] tracking-wider text-(--fg3) uppercase">
                  {s.k}
                </div>
                <div className="mono text-[22px] font-semibold">{s.v}</div>
              </Card>
            ))}
          </div>
          <div>
            <div className="mb-2.5 text-xs font-semibold">
              Points per gameweek
            </div>
            <Card className="border-border rounded-[2px] bg-(--card2) p-3">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-(--fg3)">
                  Loading…
                </div>
              ) : isError || chartData.length === 0 ? (
                <div className="p-6 text-center text-xs text-(--fg3)">
                  No completed gameweeks yet this season.
                </div>
              ) : (
                <PlayerBarChart data={chartData} />
              )}
            </Card>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold">Full breakdown</div>
            <Table className="border-border rounded-[2px] border text-[12.5px]">
              <TableBody>
                {table.map((r) => (
                  <TableRow
                    key={r.k}
                    className="border-border hover:bg-transparent"
                  >
                    <TableCell className="px-3 py-2 text-(--fg3)">
                      {r.k}
                    </TableCell>
                    <TableCell className="mono px-3 py-2 text-right font-semibold">
                      {r.v}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold">Next 5 fixtures</div>
            <div className="flex gap-1.25">
              {player.next.map((f, i) => (
                <span key={i} data-d={f.d} className="h-7 flex-1">
                  {f.label}
                </span>
              ))}
            </div>
          </div>
          <Button className="h-auto rounded-lg py-2.75 text-[13px] font-semibold">
            Add to shortlist
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
