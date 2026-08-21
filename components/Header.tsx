'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function Header({
  title,
  subtitle,
  teamId,
  gameweekLabel,
  initials,
  onDisconnect,
}: {
  title: string
  subtitle: string
  teamId: string
  gameweekLabel: string
  initials: string
  onDisconnect: () => void
}) {
  return (
    <header className="border-border bg-card sticky top-0 z-20 flex min-h-14.25 items-center justify-between gap-4 border-b px-5.5">
      <div className="flex items-baseline gap-2.5">
        <h1 className="m-0 text-xl font-extrabold tracking-[-0.035em]">
          {title}
        </h1>
        <span className="text-xs text-(--fg3) italic">{subtitle}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-xs text-(--fg3)">{gameweekLabel}</span>
        <Badge
          variant="outline"
          className="mono border-border bg-muted rounded-full px-2 py-0.5 text-[11px] font-normal text-(--fg2)"
        >
          ID {teamId}
        </Badge>
        <Button
          variant="outline"
          onClick={onDisconnect}
          className="h-auto rounded-lg px-2.5 py-1.5 text-[11px] text-(--fg2)"
        >
          Change
        </Button>
        <div className="border-border bg-muted flex size-7 items-center justify-center rounded-full border text-[11px] font-semibold text-(--fg2)">
          {initials}
        </div>
      </div>
    </header>
  )
}
