'use client'

import { useDeferredValue, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Player, Position } from '../types'

type SortKey = 'name' | 'team' | 'pos' | 'price' | 'priceMove' | 'own' | 'form' | 'xg' | 'xa' | 'xgi' | 'mins'

const POS_FILTERS: (Position | 'All')[] = ['All', 'GKP', 'DEF', 'MID', 'FWD']

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'name', label: 'Player', align: 'left' },
  { key: 'team', label: 'Team', align: 'left' },
  { key: 'pos', label: 'Pos', align: 'left' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'priceMove', label: 'Δ£', align: 'right' },
  { key: 'own', label: 'Own', align: 'right' },
  { key: 'form', label: 'Form', align: 'right' },
  { key: 'xg', label: 'xG', align: 'right' },
  { key: 'xa', label: 'xA', align: 'right' },
  { key: 'xgi', label: 'xGI', align: 'right' },
  { key: 'mins', label: 'Mins', align: 'right' },
]

export interface ExplorerFilters {
  pos: Position | 'All'
  team: string
  maxPrice: number
  maxOwn: number
  sortKey: SortKey
  sortDir: 1 | -1
}

export function ExplorerScreen({
  players,
  teams,
  filters,
  onFiltersChange,
  onSort,
  onReset,
  onOpenPlayer,
}: {
  players: Player[]
  teams: string[]
  filters: ExplorerFilters
  onFiltersChange: (patch: Partial<ExplorerFilters>) => void
  onSort: (key: SortKey) => void
  onReset: () => void
  onOpenPlayer: (id: number) => void
}) {
  // Dragging the price/ownership sliders fires onValueChange continuously;
  // deferring the filters used for the (up to 600-row) table keeps the
  // thumb and label responsive while the table update trails a frame behind.
  const deferredFilters = useDeferredValue(filters)

  const rows = useMemo(() => {
    const filtered = players.filter(
      (p) =>
        (deferredFilters.pos === 'All' || p.pos === deferredFilters.pos) &&
        (deferredFilters.team === 'All teams' || p.team === deferredFilters.team) &&
        p.price <= deferredFilters.maxPrice &&
        p.own <= deferredFilters.maxOwn
    )
    return [...filtered].sort((a, b) => {
      const av = a[deferredFilters.sortKey]
      const bv = b[deferredFilters.sortKey]
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * deferredFilters.sortDir * -1
      }
      return ((av as number) - (bv as number)) * deferredFilters.sortDir
    })
  }, [players, deferredFilters])

  return (
    <div className="flex flex-col gap-3.5 p-5.5">
      <Card className="flex-row flex-wrap items-center gap-4.5 rounded-xl border-border p-3.5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-wider text-(--fg3) uppercase">Position</span>
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-0.75">
            {POS_FILTERS.map((f) => {
              const active = filters.pos === f
              return (
                <Button
                  key={f}
                  size="sm"
                  variant="ghost"
                  onClick={() => onFiltersChange({ pos: f })}
                  className={cn(
                    'h-auto rounded-md px-2.5 py-1.25 text-xs font-medium',
                    active ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-(--fg2)'
                  )}
                >
                  {f}
                </Button>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-wider text-(--fg3) uppercase">Team</span>
          <Select value={filters.team} onValueChange={(v) => v != null && onFiltersChange({ team: v })}>
            <SelectTrigger className="min-w-[150px] rounded-lg border-border bg-muted text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['All teams', ...teams].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[190px] flex-col gap-2">
          <span className="text-[10px] tracking-wider text-(--fg3) uppercase">
            Max price · £{filters.maxPrice.toFixed(1)}m
          </span>
          <Slider
            min={4}
            max={15}
            step={0.5}
            value={[filters.maxPrice]}
            onValueChange={(v) => onFiltersChange({ maxPrice: Array.isArray(v) ? v[0] : v })}
          />
        </div>
        <div className="flex min-w-[190px] flex-col gap-2">
          <span className="text-[10px] tracking-wider text-(--fg3) uppercase">Max ownership · {filters.maxOwn}%</span>
          <Slider
            min={1}
            max={60}
            step={1}
            value={[filters.maxOwn]}
            onValueChange={(v) => onFiltersChange({ maxOwn: Array.isArray(v) ? v[0] : v })}
          />
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="mono text-xs text-(--fg3)">{rows.length} players</span>
          <Button variant="outline" onClick={onReset} className="h-auto rounded-lg px-3 py-1.75 text-xs text-(--fg2)">
            Reset
          </Button>
        </div>
      </Card>

      <Card className="gap-0 rounded-xl border-border py-0">
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow className="bg-(--card2) hover:bg-(--card2)">
              {COLUMNS.map((c) => {
                const active = filters.sortKey === c.key
                return (
                  <TableHead
                    key={c.key}
                    onClick={() => onSort(c.key)}
                    className={cn(
                      'h-auto cursor-pointer px-3 py-2.25 text-[10px] font-semibold tracking-wider uppercase',
                      c.align === 'right' ? 'text-right' : 'text-left',
                      active ? 'text-foreground' : 'text-(--fg3)'
                    )}
                  >
                    {c.label}
                    {active ? (filters.sortDir < 0 ? ' ↓' : ' ↑') : ''}
                  </TableHead>
                )
              })}
              <TableHead className="h-auto px-3 py-2.25 text-[10px] font-semibold tracking-wider text-(--fg3) uppercase">
                Next 3
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id} onClick={() => onOpenPlayer(p.id)} className="cursor-pointer border-border">
                <TableCell className="px-3 py-2.25">
                  <div className="flex items-center gap-2.25">
                    <i data-status={p.status} className="block size-1.5 shrink-0 rounded-full" />
                    <span className="font-semibold tracking-tight">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell className="mono px-3 py-2.25 text-xs text-(--fg2)">{p.team}</TableCell>
                <TableCell className="px-3 py-2.25">
                  <Badge variant="outline" className="mono rounded-full border-border bg-muted px-1.75 py-0.5 text-[11px] font-normal text-(--fg2)">
                    {p.pos}
                  </Badge>
                </TableCell>
                <TableCell className="mono px-3 py-2.25 text-right">£{p.price.toFixed(1)}</TableCell>
                <TableCell className="mono px-3 py-2.25 text-right" data-delta={p.priceDir}>
                  {p.priceMove}
                </TableCell>
                <TableCell className="mono px-3 py-2.25 text-right text-(--fg2)">{p.own.toFixed(1)}%</TableCell>
                <TableCell className="mono px-3 py-2.25 text-right">{p.form.toFixed(1)}</TableCell>
                <TableCell className="mono px-3 py-2.25 text-right text-(--fg2)">{p.xg.toFixed(2)}</TableCell>
                <TableCell className="mono px-3 py-2.25 text-right text-(--fg2)">{p.xa.toFixed(2)}</TableCell>
                <TableCell className="mono px-3 py-2.25 text-right font-semibold text-primary">{p.xgi.toFixed(2)}</TableCell>
                <TableCell className="mono px-3 py-2.25 text-right text-(--fg2)">{p.mins}</TableCell>
                <TableCell className="px-3 py-2.25">
                  <div className="flex justify-end gap-1">
                    {p.next3.map((f, i) => (
                      <span key={i} data-d={f.d} className="h-5.5 w-9.5">
                        {f.label}
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
