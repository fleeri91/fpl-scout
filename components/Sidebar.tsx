'use client'

import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListFilter,
  Grid2x2,
  Diamond,
  ArrowLeftRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Screen } from './types'

const NAV_ITEMS: {
  key: Screen
  label: string
  icon: typeof LayoutDashboard
}[] = [
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
        'border-border bg-card sticky top-0 flex h-screen flex-0 flex-col border-r transition-[width] duration-[.18s] ease-out',
        navOpen ? 'w-53' : 'w-15.5'
      )}
    >
      <div className="border-border flex min-h-14.25 items-center gap-2.5 border-b px-3.5 py-4">
        <div className="bg-primary text-primary-foreground flex size-7.5 items-center justify-center rounded-lg text-sm font-extrabold">
          FS
        </div>
        {navOpen ? (
          <div className="font-heading text-[17px] font-extrabold tracking-[-0.03em] whitespace-nowrap uppercase">
            FPL Scout
          </div>
        ) : null}
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
                active
                  ? 'border-border bg-muted text-foreground'
                  : 'border-transparent text-(--fg2)'
              )}
            >
              <Icon className="size-3.75 shrink-0 opacity-90" />
              {navOpen ? (
                <span className="whitespace-nowrap">{item.label}</span>
              ) : null}
            </Button>
          )
        })}
      </nav>

      <div className="border-border flex flex-col gap-2 border-t p-2">
        <div className="border-border bg-muted rounded-lg border p-2.5">
          {navOpen ? (
            <div className="mb-1 text-[10px] tracking-wider text-(--fg3) uppercase">
              {deadlineLabel}
            </div>
          ) : null}
          <div className="mono text-primary text-sm font-semibold">
            {countdown}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onToggleNav}
          className="h-auto rounded-lg py-1.5 text-(--fg2)"
        >
          {navOpen ? (
            <ChevronsLeft className="size-4" />
          ) : (
            <ChevronsRight className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}
