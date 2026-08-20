'use client'

import { useMemo } from 'react'
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
  const rows = useMemo(() => {
    const filtered = players.filter(
      (p) =>
        (filters.pos === 'All' || p.pos === filters.pos) &&
        (filters.team === 'All teams' || p.team === filters.team) &&
        p.price <= filters.maxPrice &&
        p.own <= filters.maxOwn
    )
    return [...filtered].sort((a, b) => {
      const av = a[filters.sortKey]
      const bv = b[filters.sortKey]
      if (typeof av === 'string' && typeof bv === 'string') {
        return av.localeCompare(bv) * filters.sortDir * -1
      }
      return ((av as number) - (bv as number)) * filters.sortDir
    })
  }, [players, filters])

  return (
    <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 12,
          background: 'var(--card)',
          padding: '12px 14px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 18,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)' }}>Position</span>
          <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--muted)', borderRadius: 9, border: '1px solid var(--border)' }}>
            {POS_FILTERS.map((f) => {
              const active = filters.pos === f
              return (
                <button
                  key={f}
                  onClick={() => onFiltersChange({ pos: f })}
                  style={{
                    padding: '5px 11px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'var(--accent-fg)' : 'var(--fg2)',
                  }}
                >
                  {f}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)' }}>Team</span>
          <select
            value={filters.team}
            onChange={(e) => onFiltersChange({ team: e.target.value })}
            style={{
              padding: '7px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--muted)',
              color: 'var(--fg)',
              fontSize: 12,
              minWidth: 150,
            }}
          >
            {['All teams', ...teams].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 190 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)' }}>
            Max price · £{filters.maxPrice.toFixed(1)}m
          </span>
          <input
            type="range"
            min={4}
            max={15}
            step={0.5}
            value={filters.maxPrice}
            onChange={(e) => onFiltersChange({ maxPrice: +e.target.value })}
            style={{ accentColor: 'var(--accent)', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 190 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--fg3)' }}>
            Max ownership · {filters.maxOwn}%
          </span>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={filters.maxOwn}
            onChange={(e) => onFiltersChange({ maxOwn: +e.target.value })}
            style={{ accentColor: 'var(--accent)', width: '100%' }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--fg3)' }}>
            {rows.length} players
          </span>
          <button
            onClick={onReset}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--fg2)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--card)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--card2)' }}>
                {COLUMNS.map((c) => {
                  const active = filters.sortKey === c.key
                  return (
                    <th
                      key={c.key}
                      onClick={() => onSort(c.key)}
                      style={{
                        textAlign: c.align,
                        padding: '9px 12px',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '.09em',
                        color: active ? 'var(--fg)' : 'var(--fg3)',
                        fontWeight: 600,
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.label}
                      {active ? (filters.sortDir < 0 ? ' ↓' : ' ↑') : ''}
                    </th>
                  )
                })}
                <th
                  style={{
                    padding: '9px 12px',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '.09em',
                    color: 'var(--fg3)',
                    fontWeight: 600,
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Next 3
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} data-row onClick={() => onOpenPlayer(p.id)} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <i data-status={p.status} style={{ width: 6, height: 6, borderRadius: 9, flex: '0 0 auto' }} />
                      <span style={{ fontWeight: 600, letterSpacing: '-.01em' }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ padding: '9px 12px', color: 'var(--fg2)', fontSize: 12 }}>
                    {p.team}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        padding: '2px 7px',
                        borderRadius: 99,
                        background: 'var(--muted)',
                        border: '1px solid var(--border)',
                        color: 'var(--fg2)',
                      }}
                    >
                      {p.pos}
                    </span>
                  </td>
                  <td className="mono" style={{ padding: '9px 12px', textAlign: 'right' }}>
                    £{p.price.toFixed(1)}
                  </td>
                  <td className="mono" data-delta={p.priceDir} style={{ padding: '9px 12px', textAlign: 'right' }}>
                    {p.priceMove}
                  </td>
                  <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--fg2)' }}>
                    {p.own.toFixed(1)}%
                  </td>
                  <td className="mono" style={{ padding: '9px 12px', textAlign: 'right' }}>
                    {p.form.toFixed(1)}
                  </td>
                  <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--fg2)' }}>
                    {p.xg.toFixed(2)}
                  </td>
                  <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--fg2)' }}>
                    {p.xa.toFixed(2)}
                  </td>
                  <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>
                    {p.xgi.toFixed(2)}
                  </td>
                  <td className="mono" style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--fg2)' }}>
                    {p.mins}
                  </td>
                  <td style={{ padding: '9px 12px' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {p.next3.map((f, i) => (
                        <span key={i} data-d={f.d} style={{ width: 38, height: 22 }}>
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
      </div>
    </div>
  )
}
