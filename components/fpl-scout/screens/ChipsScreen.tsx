'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import type { ChipCardView } from '../mapFplData'

export function ChipsScreen({ chips }: { chips: ChipCardView[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-4 p-5.5">
      {chips.map((c) => (
        <Card key={c.name} className="gap-0 rounded-xl border-border py-0">
          <CardHeader className="flex flex-row items-start justify-between gap-3 py-4">
            <div>
              <div className="text-base font-bold tracking-tight">{c.name}</div>
              <div className="mt-0.75 text-xs text-[var(--fg2)]">{c.availability}</div>
            </div>
            <Badge
              className="mono rounded-full px-2 py-1 text-[10px] font-bold tracking-wider uppercase"
              style={{ border: `1px solid ${c.badgeBorder}`, background: c.badgeBg, color: c.badgeFg }}
            >
              {c.status}
            </Badge>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
