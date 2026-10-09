'use client'

import { useDeferredValue, useMemo } from 'react'
import { Sparkline } from '../Sparkline'
import type { Player, Position } from '../types'

export type FormBookSortKey =
  | 'name'
  | 'team'
  | 'pos'
  | 'price'
  | 'own'
  | 'form'
  | 'ep'
  | 'xg'
  | 'xa'
  | 'xgi'
  | 'bps'

export interface FormBookFilters {
  pos: Position | 'All'
  sortKey: FormBookSortKey
  sortDir: 1 | -1
}

const POS_FILTERS: (Position | 'All')[] = ['All', 'GKP', 'DEF', 'MID', 'FWD']

const COLUMNS: {
  key: FormBookSortKey
  label: string
  align: 'left' | 'right'
}[] = [
  { key: 'name', label: 'Player', align: 'left' },
  { key: 'team', label: 'Club', align: 'left' },
  { key: 'pos', label: 'Pos', align: 'left' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'own', label: 'Own', align: 'right' },
  { key: 'form', label: 'Form', align: 'right' },
  { key: 'ep', label: 'EP', align: 'right' },
  { key: 'xg', label: 'xG', align: 'right' },
  { key: 'xa', label: 'xA', align: 'right' },
  { key: 'xgi', label: 'xGI', align: 'right' },
  { key: 'bps', label: 'BPS', align: 'right' },
]

const STATUS_WORD: Record<Player['status'], [string, string]> = {
  ok: ['', 'var(--fg3)'],
  risk: ['Doubt', 'var(--warn)'],
  out: ['Out', 'var(--neg)'],
}

export function FormBookScreen({
  players,
  squadIds,
  filters,
  onFiltersChange,
  onSort,
  onOpenPlayer,
}: {
  players: Player[]
  squadIds: Set<number>
  filters: FormBookFilters
  onFiltersChange: (patch: Partial<FormBookFilters>) => void
  onSort: (key: FormBookSortKey) => void
  onOpenPlayer: (id: number) => void
}) {
  const deferredFilters = useDeferredValue(filters)

  const rows = useMemo(() => {
    const { pos, sortKey, sortDir } = deferredFilters
    return players
      .filter((p) => pos === 'All' || p.pos === pos)
      .sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        if (typeof av === 'string' && typeof bv === 'string') {
          return av.localeCompare(bv) * sortDir * -1
        }
        return ((av as number) - (bv as number)) * sortDir
      })
  }, [players, deferredFilters])

  return (
    <section className="flex-1 px-7.5 pt-5 pb-6.5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="dsp text-[27px]">Form</div>
          <div
            className="ed mt-0.75 text-[13px]"
            style={{ color: 'var(--fg3)' }}
          >
            {rows.length} players. Sort any column; your own are marked.
          </div>
        </div>
        <div className="flex items-end gap-5">
          <div>
            <div className="lbl mb-1.25">Position</div>
            <div className="flex gap-0.5">
              {POS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => onFiltersChange({ pos: f })}
                  className="cursor-pointer border-0 border-b-2 bg-transparent px-2.5 py-1 text-xs"
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
        </div>
      </div>

      <div
        data-scroll
        className="overflow-x-auto rounded-(--r-card) border"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border2)' }}>
              {COLUMNS.map((c) => {
                const active = filters.sortKey === c.key
                return (
                  <th
                    key={c.key}
                    onClick={() => onSort(c.key)}
                    className="lbl cursor-pointer px-2.5 py-2.25 font-medium whitespace-nowrap"
                    style={{
                      textAlign: c.align,
                      color: active ? 'var(--fg)' : 'var(--fg3)',
                    }}
                  >
                    {c.label}
                    {active ? (filters.sortDir === 1 ? ' ↑' : ' ↓') : ''}
                  </th>
                )
              })}
              <th className="lbl px-2.5 py-2.25 text-right font-medium">
                Trend
              </th>
              <th className="lbl px-2.5 py-2.25 text-right font-medium">
                Next three
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const mine = squadIds.has(p.id)
              const [word, flagFg] = STATUS_WORD[p.status]
              return (
                <tr
                  key={p.id}
                  data-exp
                  onClick={() => onOpenPlayer(p.id)}
                  className="border-border cursor-pointer border-b"
                  style={{ background: mine ? 'var(--card2)' : 'transparent' }}
                >
                  <td className="px-2.5 py-1.5">
                    <span className="dsp text-[14.5px]">{p.name}</span>
                    {mine ? (
                      <span
                        className="fig ml-1.25 text-[9px]"
                        style={{ color: 'var(--accent)' }}
                      >
                        ●
                      </span>
                    ) : null}
                    {p.setPieces.length > 0 ? (
                      <span className="ml-1.25 inline-flex gap-0.75">
                        {p.setPieces.map((sp) => (
                          <span key={sp.mark} className="sp" title={sp.title}>
                            {sp.mark}
                          </span>
                        ))}
                      </span>
                    ) : null}
                    {p.status !== 'ok' ? (
                      <span
                        className="ed block text-[11px]"
                        style={{ color: flagFg }}
                      >
                        {word}
                        {p.chance ? ` ${p.chance}%` : ''}
                      </span>
                    ) : null}
                  </td>
                  <td
                    className="fig px-2.5 py-1.5 text-[11px]"
                    style={{ color: 'var(--fg3)' }}
                  >
                    {p.team}
                  </td>
                  <td
                    className="fig px-2.5 py-1.5 text-[11px]"
                    style={{ color: 'var(--fg3)' }}
                  >
                    {p.pos}
                  </td>
                  <td className="fig px-2.5 py-1.5 text-right text-[12.5px]">
                    £{p.price.toFixed(1)}
                  </td>
                  <td
                    className="fig px-2.5 py-1.5 text-right text-[11.5px]"
                    style={{ color: 'var(--fg3)' }}
                  >
                    {p.own.toFixed(1)}%
                  </td>
                  <td className="fig px-2.5 py-1.5 text-right text-[12.5px]">
                    {p.form.toFixed(1)}
                  </td>
                  <td className="fig px-2.5 py-1.5 text-right text-sm font-semibold">
                    {p.ep.toFixed(1)}
                  </td>
                  <td
                    className="fig px-2.5 py-1.5 text-right text-[11.5px]"
                    style={{ color: 'var(--fg3)' }}
                  >
                    {p.xg.toFixed(2)}
                  </td>
                  <td
                    className="fig px-2.5 py-1.5 text-right text-[11.5px]"
                    style={{ color: 'var(--fg3)' }}
                  >
                    {p.xa.toFixed(2)}
                  </td>
                  <td
                    className="fig px-2.5 py-1.5 text-right text-sm"
                    style={{ color: 'var(--accent)' }}
                  >
                    {p.xgi.toFixed(2)}
                  </td>
                  <td
                    className="fig px-2.5 py-1.5 text-right text-[11.5px]"
                    style={{ color: 'var(--fg3)' }}
                  >
                    {p.bps}
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex justify-end">
                      <Sparkline hist={p.hist} width={46} height={16} />
                    </div>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <div className="flex justify-end gap-0.75">
                      {p.next3.map((f, i) => (
                        <span key={i} data-d={f.d} className="h-4.75 w-8">
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
