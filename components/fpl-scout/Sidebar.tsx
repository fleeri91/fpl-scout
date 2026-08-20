'use client'

import { ChevronsLeft, ChevronsRight, LayoutDashboard, ListFilter, Grid2x2, Diamond, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Screen } from './types'

const NAV_ITEMS: { key: Screen; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dash', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'explorer', label: 'Player Explorer', icon: ListFilter },
  { key: 'fixtures', label: 'Fixture Planner', icon: Grid2x2 },
  { key: 'chips', label: 'Chip Strategy', icon: Diamond },
  { key: 'transfers', label: 'Transfer Suggestions', icon: ArrowLeftRight },
]

export function Sidebar({
  screen,
  navOpen,
  deadlineLabel,
  countdown,
  onNavigate,
  onToggleNav,
}: {
  screen: Screen
  navOpen: boolean
  deadlineLabel: string
  countdown: string
  onNavigate: (screen: Screen) => void
  onToggleNav: () => void
}) {
  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-0 flex-col border-r border-border bg-card transition-[width] duration-[.18s] ease-out',
        navOpen ? 'w-[212px]' : 'w-[62px]'
      )}
    >
      <div className="flex min-h-[57px] items-center gap-2.5 border-b border-border px-3.5 py-4">
        <div className="flex size-[26px] flex-0 items-center justify-center rounded-md bg-primary text-[13px] font-extrabold text-primary-foreground">
          FS
        </div>
        {navOpen ? <div className="text-sm font-semibold tracking-tight whitespace-nowrap">FPL Scout</div> : null}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const active = screen === item.key
          const Icon = item.icon
          return (
            <Button
              key={item.key}
              variant="ghost"
              onClick={() => onNavigate(item.key)}
              title={item.label}
              className={cn(
                'h-auto w-full justify-start gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] font-medium',
                active ? 'border-border bg-muted text-foreground' : 'border-transparent text-(--fg2)'
              )}
            >
              <Icon className="size-[15px] shrink-0 opacity-90" />
              {navOpen ? <span className="whitespace-nowrap">{item.label}</span> : null}
            </Button>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-2">
        <div className="rounded-lg border border-border bg-muted p-2.5">
          {navOpen ? (
            <div className="mb-1 text-[10px] tracking-wider text-(--fg3) uppercase">{deadlineLabel}</div>
          ) : null}
          <div className="mono text-sm font-semibold text-primary">{countdown}</div>
        </div>
        <Button variant="outline" onClick={onToggleNav} className="h-auto rounded-lg py-1.5 text-(--fg2)">
          {navOpen ? <ChevronsLeft className="size-4" /> : <ChevronsRight className="size-4" />}
        </Button>
      </div>
    </aside>
  )
}
