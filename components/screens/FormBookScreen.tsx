'use client'

import { useDeferredValue, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Player, Position } from '../types'

export type FormBookSortKey =
  | 'name'
  | 'team'
  | 'pos'
  | 'price'
  | 'net'
  | 'own'
  | 'form'
  | 'xg'
  | 'xa'
  | 'xgi'
  | 'ep'
  | 'value'
  | 'ict'

export interface FormBookFilters {
  pos: Position | 'All'
  avail: 'All' | 'Fit'
  team: string
  maxPrice: number
  maxOwn: number
  sortKey: FormBookSortKey
  sortDir: 1 | -1
}

const POS_FILTERS: (Position | 'All')[] = ['All', 'GKP', 'DEF', 'MID', 'FWD']

const COLUMNS: { key: FormBookSortKey; label: string; align: 'left' | 'right' }[] =
  [
    { key: 'name', label: 'Player', align: 'left' },
    { key: 'team', label: 'Club', align: 'left' },
    { key: 'pos', label: 'Pos', align: 'left' },
    { key: 'price', label: 'Price', align: 'right' },
    { key: 'net', label: 'Net transfers', align: 'right' },
    { key: 'own', label: 'Owned', align: 'right' },
    { key: 'form', label: 'Form', align: 'right' },
    { key: 'xg', label: 'xG', align: 'right' },
    { key: 'xa', label: 'xA', align: 'right' },
    { key: 'xgi', label: 'xGI', align: 'right' },
    { key: 'ep', label: 'EP', align: 'right' },
    { key: 'value', label: 'Value', align: 'right' },
    { key: 'ict', label: 'ICT', align: 'right' },
  ]

function IctBar({ ict }: { ict: [number, number, number] }) {
  const cols = ['var(--accent)', 'var(--pos)', 'var(--warn)']
  const max = Math.max(...ict, 1)
  return (
    <svg
      width={46}
      height={14}
      viewBox="0 0 46 14"
      role="img"
      aria-label={`Influence ${ict[0]}, creativity ${ict[1]}, threat ${ict[2]}`}
    >
      {ict.map((v, i) => {
        const h = Math.max(2, (v / max) * 13)
        return (
          <rect
            key={i}
            x={i * 16}
            y={14 - h}
            width={12}
            height={h}
            fill={cols[i]}
            opacity={0.85}
            rx={1}
          />
        )
      })}
    </svg>
  )
}

interface Row {
  p: Player
  net: number
  netLabel: string
  netFg: string
  value: number
  owned: boolean
}

export function FormBookScreen({
  players,
  teams,
  squadIds,
  filters,
  onFiltersChange,
  onSort,
  onOpenPlayer,
}: {
  players: Player[]
  teams: string[]
  squadIds: Set<number>
  filters: FormBookFilters
  onFiltersChange: (patch: Partial<FormBookFilters>) => void
  onSort: (key: FormBookSortKey) => void
  onOpenPlayer: (id: number) => void
}) {
  const deferredFilters = useDeferredValue(filters)

  const rows = useMemo<Row[]>(() => {
    const enriched: Row[] = players.map((p) => ({
      p,
      net: p.transfersInEvent - p.transfersOutEvent,
      netLabel:
        (p.transfersInEvent - p.transfersOutEvent > 0 ? '+' : '−') +
        Math.abs(Math.round((p.transfersInEvent - p.transfersOutEvent) / 1000)) +
        'k',
      netFg:
        p.transfersInEvent - p.transfersOutEvent > 20000
          ? 'var(--pos)'
          : p.transfersInEvent - p.transfersOutEvent < -20000
            ? 'var(--neg)'
            : 'var(--fg3)',
      value: p.price > 0 ? p.ppg / p.price : 0,
      owned: squadIds.has(p.id),
    }))

    const filtered = enriched.filter(
      ({ p }) =>
        (deferredFilters.pos === 'All' || p.pos === deferredFilters.pos) &&
        (deferredFilters.avail === 'All' || p.status === 'ok') &&
        (deferredFilters.team === 'All clubs' || p.team === deferredFilters.team) &&
        p.price <= deferredFilters.maxPrice &&
        p.own <= deferredFilters.maxOwn
    )

    const val = (r: Row): string | number => {
      switch (deferredFilters.sortKey) {
        case 'name':
          return r.p.name
        case 'team':
          return r.p.team
        case 'pos':
          return r.p.pos
        case 'price':
          return r.p.price
        case 'net':
          return r.net
        case 'own':
          return r.p.own
        case 'form':
          return r.p.form
        case 'xg':
          return r.p.xg
        case 'xa':
          return r.p.xa
        case 'xgi':
          return r.p.xgi
        case 'ep':
          return r.p.ep
        case 'value':
          return r.value
        case 'ict':
          return r.p.ict[2]
      }
    }

    return [...filtered].sort((a, b) => {
      const av = val(a)
      const bv = val(b)
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * deferredFilters.sortDir * -1
      }
      return ((av as number) - (bv as number)) * deferredFilters.sortDir
    })
  }, [players, squadIds, deferredFilters])

  return (
    <section className="flex h-full flex-col overflow-y-auto px-7.5 py-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="dsp text-[27px]">Form book</span>
          <p className="m-0 mt-0.75 text-[13px] text-(--fg3)">
            {rows.length} players. Value is points per million; ICT is the
            game&apos;s influence, creativity and threat index.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-5.5">
          <div>
            <div className="lbl mb-1.25">Position</div>
            <div className="flex gap-0.5">
              {POS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => onFiltersChange({ pos: f })}
                  className="border-0 border-b-2 bg-transparent px-2.25 py-1 text-xs"
                  style={{
                    borderBottomColor:
                      filters.pos === f ? 'var(--accent)' : 'transparent',
                    color: filters.pos === f ? 'var(--fg)' : 'var(--fg3)',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="lbl mb-1.25">Availability</div>
            <div className="flex gap-0.5">
              {(['All', 'Fit'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => onFiltersChange({ avail: f })}
                  className="border-0 border-b-2 bg-transparent px-2.25 py-1 text-xs"
                  style={{
                    borderBottomColor:
                      filters.avail === f ? 'var(--accent)' : 'transparent',
                    color: filters.avail === f ? 'var(--fg)' : 'var(--fg3)',
                  }}
                >
                  {f === 'Fit' ? 'Fit only' : 'All'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="lbl mb-1.25">Club</div>
            <select
              value={filters.team}
              onChange={(e) => onFiltersChange({ team: e.target.value })}
              className="border-border min-w-27.5 border-0 border-b-2 bg-transparent py-1 text-xs text-(--fg)"
            >
              {['All clubs', ...teams].map((t) => (
                <option key={t} value={t} className="bg-(--card)">
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-33">
            <div className="lbl mb-1.25">Up to £{filters.maxPrice.toFixed(1)}m</div>
            <input
              type="range"
              min={4}
              max={15}
              step={0.5}
              value={filters.maxPrice}
              onChange={(e) =>
                onFiltersChange({ maxPrice: Number(e.target.value) })
              }
              className="accent-(--accent) w-full"
            />
          </div>
          <div className="min-w-33">
            <div className="lbl mb-1.25">Owned under {filters.maxOwn}%</div>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={filters.maxOwn}
              onChange={(e) =>
                onFiltersChange({ maxOwn: Number(e.target.value) })
              }
              className="accent-(--accent) w-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-3.5 min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-border border-t-2 border-b">
              {COLUMNS.map((c) => {
                const active = filters.sortKey === c.key
                return (
                  <th
                    key={c.key}
                    onClick={() => onSort(c.key)}
                    className={cn(
                      'lbl cursor-pointer px-2.25 py-2 font-normal whitespace-nowrap',
                      c.align === 'right' ? 'text-right' : 'text-left'
                    )}
                    style={{ color: active ? 'var(--fg)' : 'var(--fg3)' }}
                  >
                    {c.label}
                    {active ? (filters.sortDir < 0 ? ' ↓' : ' ↑') : ''}
                  </th>
                )
              })}
              <th className="lbl px-2.25 py-2 text-right font-normal">
                Next three
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.p.id}
                data-row
                onClick={() => onOpenPlayer(r.p.id)}
                className="border-border cursor-pointer border-b"
                style={{ background: r.owned ? 'var(--card)' : 'transparent' }}
              >
                <td className="px-2.25 py-2">
                  <span className="text-[14.5px] font-medium tracking-[-.01em]">
                    {r.p.name}
                  </span>
                  {r.owned ? (
                    <span className="dsp text-primary ml-1.5 text-[10px]">
                      ●
                    </span>
                  ) : null}
                  {r.p.setPieces.length > 0 ? (
                    <span className="ml-1.25 inline-flex gap-0.75">
                      {r.p.setPieces.map((sp) => (
                        <span key={sp.mark} className="sp" title={sp.title}>
                          {sp.mark}
                        </span>
                      ))}
                    </span>
                  ) : null}
                  {r.p.status !== 'ok' ? (
                    <span
                      className="block text-[10px] italic"
                      style={{
                        color:
                          r.p.status === 'risk' ? 'var(--warn)' : 'var(--neg)',
                      }}
                    >
                      {r.p.note}
                    </span>
                  ) : null}
                </td>
                <td className="mono px-2.25 py-2 text-[11px] text-(--fg3)">
                  {r.p.team}
                </td>
                <td className="mono px-2.25 py-2 text-[11px] text-(--fg3)">
                  {r.p.pos}
                </td>
                <td className="mono px-2.25 py-2 text-right text-[13px]">
                  £{r.p.price.toFixed(1)}
                </td>
                <td
                  className="mono px-2.25 py-2 text-right text-[11.5px]"
                  style={{ color: r.netFg }}
                >
                  {r.netLabel}
                </td>
                <td className="mono px-2.25 py-2 text-right text-[11.5px] text-(--fg3)">
                  {r.p.own.toFixed(1)}%
                </td>
                <td className="mono px-2.25 py-2 text-right text-[12.5px]">
                  {r.p.form.toFixed(1)}
                </td>
                <td className="mono px-2.25 py-2 text-right text-[11.5px] text-(--fg3)">
                  {r.p.xg.toFixed(2)}
                </td>
                <td className="mono px-2.25 py-2 text-right text-[11.5px] text-(--fg3)">
                  {r.p.xa.toFixed(2)}
                </td>
                <td className="fig px-2.25 py-2 text-right text-[15px] text-primary">
                  {r.p.xgi.toFixed(2)}
                </td>
                <td className="fig px-2.25 py-2 text-right text-[15.5px]">
                  {r.p.ep.toFixed(1)}
                </td>
                <td className="mono px-2.25 py-2 text-right text-[11.5px] text-(--fg3)">
                  {r.value.toFixed(2)}
                </td>
                <td className="px-2.25 py-2">
                  <div className="flex justify-end">
                    <IctBar ict={r.p.ict} />
                  </div>
                </td>
                <td className="px-2.25 py-2">
                  <div className="flex justify-end gap-0.75">
                    {r.p.next3.map((f, i) => (
                      <span
                        key={i}
                        data-d={f.d}
                        className="h-5 w-8.5 text-[10px]"
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
