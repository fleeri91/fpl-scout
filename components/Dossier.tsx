'use client'

import { useMemo, useState } from 'react'
import { useElementSummary } from '@/lib/queries/fpl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { buildDossier } from './mapFplData'
import { PlayerBarChart } from './PlayerBarChart'
import type { Player } from './types'

export function Dossier({
  player,
  squad,
  onClose,
}: {
  player: Player
  squad: Player[]
  onClose: () => void
}) {
  const [rivalId, setRivalId] = useState<number | null>(null)
  const { data: summary, isLoading, isError } = useElementSummary(player.id)

  const dossier = useMemo(
    () => buildDossier(player, rivalId, squad),
    [player, rivalId, squad]
  )

  const chartData = (summary?.history ?? [])
    .slice(-5)
    .map((h) => ({ label: `GW${h.round}`, value: h.total_points }))

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="border-border w-118.75 max-w-[94vw] gap-0 overflow-y-auto rounded-none border-l-2 bg-(--card) px-6.5 py-6 sm:max-w-[94vw]">
        <div className="border-border flex items-start justify-between gap-3.5 border-b-2 pb-3.5">
          <div>
            <div className="lbl">Dossier</div>
            <div className="dsp mt-1.25 text-[34px] leading-[1.02]">
              {player.name}
            </div>
            <div className="mono mt-1.25 text-[11px] text-(--fg3)">
              {player.team} · {player.pos} · £{player.price.toFixed(1)}m ·{' '}
              {player.own.toFixed(1)}% owned
            </div>
            <div
              className="mt-1.5 text-xs italic"
              style={{ color: dossier?.statusFg ?? 'var(--fg3)' }}
            >
              {dossier?.newsLine}
            </div>
          </div>
        </div>

        {dossier ? (
          <>
            <p className="ed drop mt-4 mb-5 text-[15px] leading-[1.6] text-(--fg2)">
              {dossier.summary}
            </p>

            <div className="mb-2.25 flex items-baseline justify-between gap-3">
              <div className="lbl">Set against your own</div>
              <Select
                value={String(
                  dossier.rivalOptions.find((o) => o.selected)?.id ?? ''
                )}
                onValueChange={(v) => v != null && setRivalId(Number(v))}
              >
                <SelectTrigger className="text-primary h-auto max-w-52.5 border-0 border-b p-0 pb-0.75 text-[11px]">
                  <SelectValue>
                    {(v: string) =>
                      dossier.rivalOptions.find((o) => String(o.id) === v)
                        ?.label ?? ''
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {dossier.rivalOptions.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <table className="border-border w-full border-collapse border-t">
              <tbody>
                <tr className="border-border border-b">
                  <td className="lbl py-1.5">Measure</td>
                  <td className="lbl py-1.5 text-right">
                    {dossier.shortName}
                  </td>
                  <td className="lbl py-1.5 pl-2.5 text-right">
                    {dossier.rivalShort}
                  </td>
                  <td className="lbl py-1.5 pl-2.5 text-right">Delta</td>
                </tr>
                {dossier.versus.map((r) => (
                  <tr key={r.k} className="border-border border-b">
                    <td className="py-1.75 text-[12.5px] text-(--fg3)">
                      {r.k}
                    </td>
                    <td className="mono py-1.75 text-right text-[13px]">
                      {r.a}
                    </td>
                    <td className="mono py-1.75 pl-2.5 text-right text-[13px] text-(--fg3)">
                      {r.b}
                    </td>
                    <td
                      className="mono py-1.75 pl-2.5 text-right text-[13px]"
                      style={{ color: r.fg }}
                    >
                      {r.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2.5 text-[12.5px] leading-[1.55] text-(--fg2) italic">
              {dossier.versusVerdict}
            </div>

            <div className="lbl mt-5.5 mb-2">
              Recent points, last five gameweeks
            </div>
            <div className="border-border border-t border-b py-3">
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
            </div>

            <div className="lbl mt-5 mb-1.75">Everything else</div>
            <table className="w-full border-collapse">
              <tbody>
                {dossier.table.map((r) => (
                  <tr key={r.k} className="border-border border-b">
                    <td className="py-1.75 text-[13px] text-(--fg3)">
                      {r.k}
                    </td>
                    <td
                      className="mono py-1.75 text-right text-[13.5px]"
                      style={{ color: r.fg }}
                    >
                      {r.v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="lbl mt-5 mb-1.75">Next five</div>
            <div className="flex gap-1">
              {dossier.next.map((f, i) => (
                <span key={i} data-d={f.d} className="h-7 flex-1">
                  {f.label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6 text-center text-xs text-(--fg3)">
            No squad comparison available yet.
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
