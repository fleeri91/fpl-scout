'use client'

import { useMemo, useState } from 'react'
import type { FixtureCell, Player, Position } from '../types'

const POS_FILTERS: (Position | 'All')[] = ['All', 'GKP', 'DEF', 'MID', 'FWD']
const PRICE_ANY = 15

export function PicksScreen({
  players,
  squadIds,
  fixturesByTeam,
  fromEventId,
  onOpenPlayer,
}: {
  players: Player[]
  squadIds: Set<number>
  // Upcoming fixtures per club short name, starting at fromEventId.
  fixturesByTeam: Record<string, FixtureCell[]>
  fromEventId: number
  onOpenPlayer: (id: number) => void
}) {
  const [pos, setPos] = useState<Position | 'All'>('All')
  const [weeks, setWeeks] = useState(4)
  const [maxPrice, setMaxPrice] = useState(PRICE_ANY)
  const [hideMine, setHideMine] = useState(false)

  // Form and fixture ease, each scaled to 0–1; form carries 75%, fixtures 25%.
  // Players under 3.0 form or without regular minutes are left out.
  const rows = useMemo(() => {
    const maxForm = Math.max(0.1, ...players.map((p) => p.form))
    return players
      .filter(
        (p) =>
          p.status !== 'out' &&
          p.form >= 3 &&
          p.mins >= 180 &&
          p.bps > 0 &&
          (pos === 'All' || p.pos === pos) &&
          p.price <= maxPrice &&
          !(hideMine && squadIds.has(p.id))
      )
      .map((p) => {
        const fx = (fixturesByTeam[p.team] ?? []).slice(0, weeks)
        const fdr = fx.reduce((s, c) => s + c.d, 0) / (fx.length || 1)
        const score = fx.length
          ? Math.round(
              ((p.form / maxForm) * 0.75 + ((5 - fdr) / 4) * 0.25) * 100
            )
          : 0
        return { p, fx, fdr, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
  }, [players, squadIds, fixturesByTeam, pos, weeks, maxPrice, hideMine])

  const lastGw = fromEventId + weeks - 1
  const weeksLabel = `${weeks} weeks · GW${fromEventId}–${lastGw}`
  const priceLabel = maxPrice >= PRICE_ANY ? 'Any' : `£${maxPrice.toFixed(1)}m`

  return (
    <section className="flex-1 px-7.5 pt-5 pb-6.5">
      <div className="mb-3.5">
        <div className="dsp text-[27px]">Picks</div>
        <div
          className="ed mt-0.75 max-w-155 text-[13px] text-pretty"
          style={{ color: 'var(--fg3)' }}
        >
          Players in form with the easiest fixtures ahead. Ranked mainly on form
          (75%), with fixture difficulty as the tiebreaker (25%). Players
          without regular minutes are left out.
        </div>
      </div>

      <div
        className="mb-4 flex flex-wrap items-end gap-x-6.5 gap-y-3.5 rounded-(--r-card) border px-3.5 py-3"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="flex-[0_1_auto]">
          <div className="lbl mb-1.5">Position</div>
          <div
            data-seg
            className="flex gap-0.5 rounded-(--r-ctl) border p-0.5"
            style={{ borderColor: 'var(--border2)' }}
          >
            {POS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setPos(f)}
                className="min-h-8.5 cursor-pointer rounded-(--r-ctl) border-0 px-3 py-1.5 text-xs"
                style={{
                  background: pos === f ? 'var(--card2)' : 'transparent',
                  color: pos === f ? 'var(--fg)' : 'var(--fg3)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="max-w-65 min-w-40 flex-[1_1_170px]">
          <div className="mb-1.5 flex justify-between gap-2">
            <span className="lbl">Fixtures ahead</span>
            <span
              className="fig text-[11px] whitespace-nowrap"
              style={{ color: 'var(--fg)' }}
            >
              {weeksLabel}
            </span>
          </div>
          <input
            type="range"
            min={3}
            max={6}
            step={1}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="m-0 w-full accent-(--accent)"
          />
        </div>
        <div className="max-w-65 min-w-40 flex-[1_1_170px]">
          <div className="mb-1.5 flex justify-between gap-2">
            <span className="lbl">Max price</span>
            <span
              className="fig text-[11px] whitespace-nowrap"
              style={{ color: 'var(--fg)' }}
            >
              {priceLabel}
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={PRICE_ANY}
            step={0.5}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="m-0 w-full accent-(--accent)"
          />
        </div>
        <button
          onClick={() => setHideMine((h) => !h)}
          className="flex min-h-8.5 cursor-pointer items-center gap-2 rounded-(--r-ctl) border bg-transparent px-3 py-1.5 text-xs whitespace-nowrap"
          style={{
            borderColor: hideMine ? 'var(--accent)' : 'var(--border2)',
            color: hideMine ? 'var(--fg)' : 'var(--fg2)',
          }}
        >
          <span
            className="block size-2.75 rounded-[2px] border"
            style={{
              borderColor: 'var(--border2)',
              background: hideMine ? 'var(--accent)' : 'transparent',
            }}
          />
          Hide players I own
        </button>
      </div>

      {rows.length === 0 ? (
        <div
          className="ed rounded-(--r-card) border border-dashed p-7 text-center text-[13px]"
          style={{ color: 'var(--fg3)', borderColor: 'var(--border2)' }}
        >
          No players match. Raise the max price or pick another position.
        </div>
      ) : null}

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns:
            'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
        }}
      >
        {rows.map(({ p, fx, fdr, score }, i) => {
          const mine = squadIds.has(p.id)
          const meta = `${p.team} · ${p.pos} · £${p.price.toFixed(1)}m · ${p.own.toFixed(1)}%${mine ? ' · In your team' : ''}`
          const fdrFg =
            fdr <= 2.5 ? 'var(--pos)' : fdr >= 3.5 ? 'var(--neg)' : 'var(--fg)'
          return (
            <button
              key={p.id}
              onClick={() => onOpenPlayer(p.id)}
              className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-(--r-card) border p-3.5 text-left"
              style={{
                borderColor: i === 0 ? 'var(--accent)' : 'var(--border)',
                background: 'var(--card)',
                color: 'var(--fg)',
              }}
            >
              <div className="flex w-full items-start justify-between gap-2.5">
                <div className="flex min-w-0 items-baseline gap-2.5">
                  <span
                    className="fig flex-none text-xs"
                    style={{ color: 'var(--fg3)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="dsp text-[17px] leading-[1.2] wrap-break-word">
                      {p.name}
                    </div>
                    <div
                      className="fig mt-0.75 text-[11px]"
                      style={{ color: 'var(--fg3)' }}
                    >
                      {meta}
                    </div>
                    {p.status === 'risk' ? (
                      <div
                        className="ed mt-0.5 text-[11.5px]"
                        style={{ color: 'var(--warn)' }}
                      >
                        Doubt{p.chance ? ` · ${p.chance}% chance` : ''}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex-none text-right">
                  <div
                    className="fig text-[22px] leading-none font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    {score}
                  </div>
                  <div className="lbl mt-1">Score</div>
                </div>
              </div>
              <div
                className="grid w-full grid-cols-3 gap-2 border-t pt-2.5"
                style={{ borderColor: 'var(--border)' }}
              >
                <div>
                  <div className="lbl">Form</div>
                  <div className="fig mt-0.75 text-[15px]">
                    {p.form.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="lbl">xGI</div>
                  <div className="fig mt-0.75 text-[15px]">
                    {p.xgi.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="lbl">Avg FDR</div>
                  <div
                    className="fig mt-0.75 text-[15px]"
                    style={{ color: fdrFg }}
                  >
                    {fx.length ? fdr.toFixed(1) : '—'}
                  </div>
                </div>
              </div>
              <div className="flex w-full gap-0.75">
                {fx.map((c, k) => {
                  const home = c.opp === c.opp.toUpperCase()
                  const opp = c.opp.toUpperCase()
                  return (
                    <span
                      key={k}
                      data-d={c.d}
                      title={`GW${c.event ?? fromEventId + k} · ${home ? 'home to' : 'away at'} ${opp} · difficulty ${c.d}`}
                      className="h-6 min-w-0 flex-1 text-[10px] whitespace-nowrap"
                    >
                      {opp} {home ? 'H' : 'A'}
                    </span>
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
