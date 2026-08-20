'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import type { TransferSectionView } from '../mapFplData'

export function TransfersScreen({ transfers }: { transfers: TransferSectionView[] }) {
  if (transfers.length === 0) {
    return (
      <div className="p-5.5">
        <Card className="rounded-xl border-border p-6 text-center text-[13px] text-[var(--fg3)]">
          No transfer suggestions right now — your squad looks efficient for its price.
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-5.5">
      {transfers.map((t) => (
        <Card key={t.outName} className="gap-0 rounded-xl border-border py-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border py-4">
            <div>
              <div className="text-sm font-semibold">Replace {t.outName}</div>
              <div className="mt-0.5 text-xs text-[var(--fg2)]">{t.rationale}</div>
            </div>
            <Badge variant="outline" className="mono rounded-full border-border bg-muted px-2.25 py-0.75 text-[11px] font-normal text-[var(--fg2)]">
              {t.bank} in bank
            </Badge>
          </CardHeader>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3 p-4">
            {t.cards.map((c) => (
              <div key={c.name} className="overflow-hidden rounded-[11px] border" style={{ borderColor: c.border, background: c.bg }}>
                <div className="border-b border-border p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold tracking-tight">{c.name}</span>
                    <span className="mono text-[10px] font-bold tracking-wider uppercase" style={{ color: c.tagFg }}>
                      {c.tag}
                    </span>
                  </div>
                  <div className="mono mt-1 text-[11px] text-[var(--fg3)]">
                    {c.team} · {c.pos} · £{c.price}m
                  </div>
                </div>
                <Table className="text-xs">
                  <TableBody>
                    {c.stats.map((s) => (
                      <TableRow key={s.k} className="border-border hover:bg-transparent">
                        <TableCell className="px-3.5 py-1.75 text-[var(--fg3)]">{s.k}</TableCell>
                        <TableCell className="mono px-3.5 py-1.75 text-right font-semibold" data-delta={s.dir}>
                          {s.v}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex flex-col gap-2 p-3.5">
                  <div className="text-[10px] tracking-wider text-[var(--fg3)] uppercase">Next 5</div>
                  <div className="flex gap-1">
                    {c.next.map((f, i) => (
                      <span key={i} data-d={f.d} className="h-5.5 flex-1">
                        {f.label}
                      </span>
                    ))}
                  </div>
                  <Button
                    className="mt-1 h-auto rounded-lg py-2 text-xs font-semibold"
                    style={{ border: `1px solid ${c.ctaBorder}`, background: c.ctaBg, color: c.ctaFg }}
                  >
                    {c.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
