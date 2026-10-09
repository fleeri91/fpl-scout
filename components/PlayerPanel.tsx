'use client'

import { useEffect } from 'react'
import { useElementSummary } from '@/lib/queries/fpl'
import { xgiHistory } from './mapFplData'
import { Sparkline } from './Sparkline'
import type { Player } from './types'

const STATUS_FG: Record<Player['status'], string> = {
  ok: 'var(--fg3)',
  risk: 'var(--warn)',
  out: 'var(--neg)',
}

// Right-hand drawer on desktop; the [data-sheet] rules in fpl-scout.css turn
// it into a bottom sheet on phones.
export function PlayerPanel({
  player,
  onClose,
}: {
  player: Player
  onClose: () => void
}) {
  // Squad players arrive with their trend already loaded; anyone else from
  // the Form table fetches theirs here.
  const { data: summary } = useElementSummary(player.id)
  const hist = player.hist.length ? player.hist : xgiHistory(summary?.history)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const dot = STATUS_FG[player.status]
  const stats: [string, string][] = [
    ['EP', player.ep.toFixed(1)],
    ['xGI', player.xgi.toFixed(2)],
    ['xG', player.xg.toFixed(2)],
    ['xA', player.xa.toFixed(2)],
    ['Form', player.form.toFixed(1)],
    ['BPS', String(player.bps)],
  ]

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-60"
        style={{ background: 'rgba(0,0,0,.6)' }}
      />
      <aside
        data-sheet
        role="dialog"
        aria-label={player.name}
        className="fixed top-0 right-0 bottom-0 z-61 w-95 max-w-[92vw] overflow-y-auto border-l px-5.5 pt-5.5 pb-7"
        style={{ background: 'var(--card)', borderColor: 'var(--border2)' }}
      >
        <div data-grab />
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.75">
              <span
                className="size-1.75 flex-none rounded-full"
                style={{ background: dot }}
              />
              <span className="dsp min-w-0 text-[19px] leading-[1.2] wrap-break-word">
                {player.name}
              </span>
              {player.setPieces.length > 0 ? (
                <span className="inline-flex flex-none gap-0.75">
                  {player.setPieces.map((sp) => (
                    <span key={sp.mark} className="sp" title={sp.title}>
                      {sp.mark}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
            <div
              className="fig mt-1.5 text-[11.5px]"
              style={{ color: 'var(--fg3)' }}
            >
              {player.team} · {player.pos} · £{player.price.toFixed(1)}m ·{' '}
              {player.own.toFixed(1)}% owned
            </div>
            {player.chance < 100 ? (
              <div className="ed mt-0.75 text-[12.5px]" style={{ color: dot }}>
                {player.chance}% chance of playing
              </div>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-none cursor-pointer rounded-(--r-ctl) border bg-transparent px-2.25 py-0.75 text-[13px]"
            style={{ borderColor: 'var(--border2)', color: 'var(--fg2)' }}
          >
            ×
          </button>
        </div>
        <div className="ed mt-3.5 text-[13.5px] leading-normal text-pretty">
          {player.note}
        </div>
        <div className="mt-4">
          <Sparkline hist={hist} width={200} height={46} />
        </div>
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {stats.map(([k, v]) => (
            <div
              key={k}
              className="rounded-(--r-card) border px-2.5 py-2.25"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--card2)',
              }}
            >
              <div className="lbl">{k}</div>
              <div className="fig mt-0.75 text-base font-semibold">{v}</div>
            </div>
          ))}
        </div>
        <div className="lbl mt-4 mb-1.5">Next three</div>
        <div className="flex gap-1">
          {player.next3.map((f, i) => (
            <span key={i} data-d={f.d} className="h-7 flex-1">
              {f.label}
            </span>
          ))}
        </div>
      </aside>
    </>
  )
}
