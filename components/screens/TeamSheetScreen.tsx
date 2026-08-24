'use client'

import type { ForcedDecision, TeamTotalRow } from '../mapFplData'
import { Sparkline } from '../Sparkline'
import type { PageKey, Player } from '../types'

const STATUS_WORD: Record<Player['status'], [string, string]> = {
  ok: ['', 'var(--fg3)'],
  risk: ['Doubt', 'var(--warn)'],
  out: ['Out', 'var(--neg)'],
}

function XiRow({
  p,
  armband,
  onOpen,
}: {
  p: Player
  armband: string
  onOpen: () => void
}) {
  const [, dot] = STATUS_WORD[p.status]
  return (
    <div
      onClick={onOpen}
      className="border-border grid cursor-pointer items-center gap-2.75 border-b py-1.75 px-3.5 hover:bg-(--card2)"
      style={{ gridTemplateColumns: '14px minmax(0,1fr) 66px 46px 46px 54px' }}
    >
      <span
        className="block size-1.5 rounded-full"
        style={{ background: dot }}
      />
      <span className="min-w-0">
        <span className="dsp text-[15px]">{p.name}</span>
        {armband ? (
          <span className="fig ml-1.25 text-[9.5px]" style={{ color: 'var(--accent)' }}>
            {armband}
          </span>
        ) : null}
        {p.setPieces.length > 0 ? (
          <span className="ml-1.5 inline-flex gap-0.75">
            {p.setPieces.map((sp) => (
              <span key={sp.mark} className="sp" title={sp.title}>
                {sp.mark}
              </span>
            ))}
          </span>
        ) : null}
        <span className="fig ml-1.75 text-[9.5px]" style={{ color: 'var(--fg3)' }}>
          {p.team} · {p.pos}
        </span>
        {p.status !== 'ok' ? (
          <span className="ed ml-1.75 text-xs" style={{ color: dot }}>
            {p.chance}%
          </span>
        ) : null}
      </span>
      <span className="flex justify-end">
        <Sparkline hist={p.hist} width={40} height={15} />
      </span>
      <span className="fig text-right text-[12.5px]" style={{ color: 'var(--accent)' }}>
        {p.xgi.toFixed(2)}
      </span>
      <span className="fig text-right text-[12.5px]">{p.ep.toFixed(1)}</span>
      <span className="fig text-right text-[11.5px]" style={{ color: 'var(--fg3)' }}>
        £{p.price.toFixed(1)}
      </span>
    </div>
  )
}

function BenchRow({ p, onOpen }: { p: Player; onOpen: () => void }) {
  const [word, dot] = STATUS_WORD[p.status]
  return (
    <div
      onClick={onOpen}
      className="border-border grid cursor-pointer items-center gap-2.75 border-b py-1.5 px-3.5 hover:bg-(--card2)"
      style={{ gridTemplateColumns: '14px minmax(0,1fr) 46px 54px' }}
    >
      <span
        className="block size-1.5 rounded-full"
        style={{ background: dot }}
      />
      <span className="min-w-0">
        <span className="dsp text-[15.5px]" style={{ color: 'var(--fg2)' }}>
          {p.name}
        </span>
        <span className="fig ml-1.75 text-[9.5px]" style={{ color: 'var(--fg3)' }}>
          {p.team} · {p.pos}
        </span>
        {p.status !== 'ok' ? (
          <span className="ed ml-1.75 text-xs" style={{ color: dot }}>
            {word} {p.chance}%
          </span>
        ) : null}
      </span>
      <span className="fig text-right text-xs" style={{ color: 'var(--fg2)' }}>
        {p.ep.toFixed(1)}
      </span>
      <span className="fig text-right text-[11.5px]" style={{ color: 'var(--fg3)' }}>
        £{p.price.toFixed(1)}
      </span>
    </div>
  )
}

export function TeamSheetScreen({
  xi,
  bench,
  captainId,
  viceId,
  totals,
  forced,
  onOpenPlayer,
  onNavigate,
}: {
  xi: Player[]
  bench: Player[]
  captainId: number | null
  viceId: number | null
  totals: TeamTotalRow[]
  forced: ForcedDecision[]
  onOpenPlayer: (id: number) => void
  onNavigate: (key: PageKey) => void
}) {
  const armbandFor = (id: number) =>
    id === captainId ? 'C' : id === viceId ? 'V' : ''

  return (
    <section
      data-lay="split"
      className="grid items-start gap-5.5 px-7.5 py-5"
      style={{ gridTemplateColumns: 'minmax(0,1fr) 300px' }}
    >
      <div>
        <div className="mb-2.5 flex items-baseline gap-3">
          <span className="dsp text-[27px]">Starting XI</span>
          <span className="ed text-[13px]" style={{ color: 'var(--fg3)' }}>
            <span className="sp">P</span> penalties · <span className="sp">C</span>{' '}
            corners · trend is points over the last five
          </span>
        </div>
        <div
          className="overflow-hidden rounded-(--r-card) border"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          {xi.map((p) => (
            <XiRow
              key={p.id}
              p={p}
              armband={armbandFor(p.id)}
              onOpen={() => onOpenPlayer(p.id)}
            />
          ))}
        </div>

        <div className="dsp mt-4 mb-2 text-[22px]">Bench, in order</div>
        <div
          className="overflow-hidden rounded-(--r-card) border"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          {bench.map((p) => (
            <BenchRow key={p.id} p={p} onOpen={() => onOpenPlayer(p.id)} />
          ))}
        </div>
      </div>

      <aside className="flex flex-col gap-3">
        <div
          className="rounded-(--r-card) border p-3.5"
          style={{ borderColor: 'var(--border2)', background: 'var(--card)' }}
        >
          {totals.map((t) => (
            <div
              key={t.k}
              className="flex items-baseline justify-between gap-2.5 py-1.25"
            >
              <span className="lbl">{t.k}</span>
              <span className="fig text-base font-semibold" style={{ color: t.fg }}>
                {t.v}
              </span>
            </div>
          ))}
        </div>

        {forced.length > 0 ? (
          <div
            className="rounded-(--r-card) border p-3.5"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <div className="lbl mb-1.75">Needs a decision</div>
            {forced.map((f) => (
              <div
                key={f.id}
                className="border-border border-b py-1.75"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="dsp text-[14.5px]">{f.name}</span>
                  <span className="fig text-[11px]" style={{ color: f.dot }}>
                    {f.chance}
                  </span>
                </div>
                <div
                  className="ed mt-0.5 text-xs text-pretty"
                  style={{ color: 'var(--fg3)' }}
                >
                  {f.note} · {f.where}
                </div>
              </div>
            ))}
            <button
              onClick={() => onNavigate('fixtures')}
              className="mt-2.75 cursor-pointer rounded-(--r-ctl) px-3.25 py-1.75 text-xs font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              Check fixtures
            </button>
          </div>
        ) : null}
      </aside>
    </section>
  )
}
