'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { ChipCardView } from '../mapFplData'

export function ChipsScreen({ chips }: { chips: ChipCardView[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] items-start gap-4 p-5.5">
      {chips.map((c) => (
        <Card key={c.name} className="border-border gap-0 rounded-xl py-0">
          <CardHeader className="border-border flex flex-row items-start justify-between gap-3 border-b py-4">
            <div>
              <div className="font-heading text-[21px] font-extrabold tracking-[-0.035em]">
                {c.name}
              </div>
              <div className="mt-0.75 text-xs text-(--fg2)">
                {c.availability}
              </div>
            </div>
            <Badge
              className="mono rounded-full px-2 py-1 text-[10px] font-bold tracking-wider uppercase"
              style={{
                border: `1px solid ${c.badgeBorder}`,
                background: c.badgeBg,
                color: c.badgeFg,
              }}
            >
              {c.status}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5 py-4">
            <div>
              <div className="mb-1.25 text-[10px] tracking-wider text-(--fg3) uppercase">
                Recommended window
              </div>
              <div className="mono text-primary text-[26px] font-extrabold tracking-[-0.035em]">
                {c.window}
              </div>
            </div>
            {c.reasons.length > 0 ? (
              <>
                <ul className="m-0 flex list-disc flex-col gap-1.5 pl-4">
                  {c.reasons.map((r) => (
                    <li
                      key={r}
                      className="text-[12.5px] leading-relaxed text-(--fg2)"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
                <div>
                  <div className="mb-1.5 flex justify-between text-[11px] text-(--fg3)">
                    <span className="tracking-wider uppercase">
                      Confidence
                    </span>
                    <span className="mono text-(--fg2)">
                      {c.confLabel} · {c.conf}%
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${c.conf}%` }}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
