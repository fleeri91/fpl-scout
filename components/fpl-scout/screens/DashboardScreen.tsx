'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Sparkline } from '../Sparkline'
import type { Delta, Player } from '../types'

interface SummaryStat {
  label: string
  value: string
  note: string
  dir: Delta
}

interface Alert {
  id: string
  kind: string
  tone: Delta
  title: string
  body: string
}

function StatusDot({ status }: { status: string }) {
  return <i data-status={status} className="block size-1.75 shrink-0 rounded-full" />
}

function PlayerCard({ p, dim, onOpen }: { p: Player; dim?: boolean; onOpen: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onOpen}
      className={cn(
        'h-auto flex-col items-stretch gap-2 rounded-[10px] border-border p-2.5 text-left whitespace-normal',
        dim ? 'bg-transparent' : 'bg-(--card2)'
      )}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={p.status} />
        <span className="overflow-hidden text-[13px] font-semibold text-ellipsis whitespace-nowrap text-foreground">
          {p.name}
        </span>
      </div>
      <div className="mono flex justify-between text-[11px] text-(--fg3)">
        <span>
          {p.team} · {p.pos}
        </span>
        {!dim ? <span>£{p.price.toFixed(1)}m</span> : null}
      </div>
      {dim ? (
        <div className="mono flex justify-between text-[11px] text-(--fg3)">
          <span />
          <span>{p.xgi.toFixed(1)} xGI</span>
        </div>
      ) : (
        <div className="flex items-end justify-between gap-2">
          <Sparkline hist={p.hist} />
          <span className="mono text-xs font-semibold text-primary">{p.xgi.toFixed(1)}</span>
        </div>
      )}
    </Button>
  )
}

export function DashboardScreen({
  summary,
  xi,
  bench,
  alerts,
  onOpenPlayer,
  onDismissAlert,
}: {
  summary: SummaryStat[]
  xi: Player[]
  bench: Player[]
  alerts: Alert[]
  onOpenPlayer: (id: number) => void
  onDismissAlert: (id: string) => void
}) {
  const squad = [...xi, ...bench]
  const injuredCount = squad.filter((p) => p.status === 'out').length
  const riskCount = squad.filter((p) => p.status === 'risk').length
  const squadNote =
    injuredCount === 0 && riskCount === 0
      ? 'Full squad available'
      : [
          injuredCount ? `${injuredCount} ${injuredCount > 1 ? 'injuries' : 'injury'}` : null,
          riskCount ? `${riskCount} doubtful` : null,
        ]
          .filter(Boolean)
          .join(', ')

  return (
    <div className="flex flex-col gap-4.5 p-5.5">
      <div className="grid grid-cols-4 gap-3.5">
        {summary.map((s) => (
          <Card key={s.label} className="gap-1 rounded-xl border-border p-4">
            <div className="text-[11px] tracking-wider text-(--fg3) uppercase">{s.label}</div>
            <div className="mono mt-1 text-[28px] font-semibold tracking-tight">{s.value}</div>
            <div className="mono text-xs" data-delta={s.dir}>
              {s.note}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-start gap-4.5">
        <Card className="gap-0 rounded-xl border-border py-0">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
            <div>
              <div className="text-sm font-semibold">Squad health</div>
              <div className="mt-0.5 text-xs text-(--fg2)">Points trend over recent gameweeks · {squadNote}</div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-(--fg3)">
              <span className="flex items-center gap-1.5">
                <StatusDot status="ok" />
                Starting
              </span>
              <span className="flex items-center gap-1.5">
                <StatusDot status="risk" />
                Rotation
              </span>
              <span className="flex items-center gap-1.5">
                <StatusDot status="out" />
                Injured
              </span>
            </div>
          </CardHeader>
          <CardContent className="py-3.5">
            <div className="mb-2.5 text-[11px] tracking-wider text-(--fg3) uppercase">Starting XI</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5">
              {xi.map((p) => (
                <PlayerCard key={p.id} p={p} onOpen={() => onOpenPlayer(p.id)} />
              ))}
            </div>
            <div className="my-4 h-px bg-border" />
            <div className="mb-2.5 text-[11px] tracking-wider text-(--fg3) uppercase">Bench</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-2.5 opacity-70">
              {bench.map((p) => (
                <PlayerCard key={p.id} p={p} dim onOpen={() => onOpenPlayer(p.id)} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-xl border-border py-0">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
            <div className="text-sm font-semibold">This week&apos;s alerts</div>
            <Badge variant="outline" className="mono rounded-full border-border bg-muted px-1.75 py-0.5 text-[11px] font-normal text-(--fg2)">
              {alerts.length}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.25 py-3">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 rounded-[10px] border border-border bg-(--card2) p-2.75">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.75">
                    <span className="mono text-[10px] font-bold tracking-wider uppercase" data-delta={a.tone}>
                      {a.kind}
                    </span>
                    <span className="text-xs font-semibold">{a.title}</span>
                  </div>
                  <div className="text-xs leading-relaxed text-(--fg2)">{a.body}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDismissAlert(a.id)}
                  className="text-(--fg3)"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
            {alerts.length === 0 ? (
              <div className="p-4.5 text-center text-xs text-(--fg3)">All clear. Nothing needs your attention.</div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
