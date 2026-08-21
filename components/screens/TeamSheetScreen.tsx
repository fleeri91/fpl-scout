'use client'

import type { PositionAuditRow } from '../mapFplData'
import { Sparkline } from '../Sparkline'
import type { Player } from '../types'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function XiRow({
  p,
  n,
  armband,
  onOpen,
}: {
  p: Player
  n: number
  armband: string
  onOpen: () => void
}) {
  return (
    <div
      data-row
      onClick={onOpen}
      className="border-border grid cursor-pointer items-baseline gap-2.5 border-b py-2 hover:bg-(--card2)"
      style={{ gridTemplateColumns: '20px minmax(0,1fr) 46px 46px 40px 46px' }}
    >
      <span className="mono text-[10px] text-(--fg3)">{pad(n)}</span>
      <span>
        <span className="text-[15px] font-medium tracking-[-.01em]">
          {p.name}
        </span>
        {armband ? (
          <span className="dsp text-primary ml-1.5 text-[10px]">
            {armband}
          </span>
        ) : null}
        <span className="mono ml-1.75 text-[10px] text-(--fg3)">
          {p.team} · {p.pos}
        </span>
        {p.setPieces.length > 0 ? (
          <span className="ml-1.5 inline-flex gap-0.75">
            {p.setPieces.map((sp) => (
              <span key={sp.mark} className="sp" title={sp.title}>
                {sp.mark}
              </span>
            ))}
          </span>
        ) : null}
        {p.status !== 'ok' ? (
          <span
            className="mt-0.75 block text-pretty text-[11px] italic"
            style={{
              color:
                p.status === 'risk' ? 'var(--warn)' : 'var(--neg)',
            }}
          >
            {p.note}
          </span>
        ) : null}
      </span>
      <span className="flex items-end justify-end">
        <Sparkline hist={p.hist} width={40} height={15} />
      </span>
      <span className="mono text-primary text-right text-[13px]">
        {p.xgi.toFixed(2)}
      </span>
      <span className="mono text-right text-[13px] text-(--fg2)">
        {p.ep.toFixed(1)}
      </span>
      <span className="mono text-right text-xs text-(--fg2)">
        £{p.price.toFixed(1)}
      </span>
    </div>
  )
}

function BenchRow({ p, n, onOpen }: { p: Player; n: number; onOpen: () => void }) {
  return (
    <div
      data-row
      onClick={onOpen}
      className="border-border grid cursor-pointer items-baseline gap-2.5 border-b py-1.75 text-(--fg2) hover:bg-(--card2)"
      style={{ gridTemplateColumns: '20px minmax(0,1fr) 46px 40px 46px' }}
    >
      <span className="mono text-[10px] text-(--fg3)">{pad(n)}</span>
      <span>
        <span className="text-[15.5px]">{p.name}</span>
        <span className="mono ml-1.75 text-[10px] text-(--fg3)">
          {p.team} · {p.pos}
        </span>
        {p.status !== 'ok' ? (
          <span
            className="mt-0.5 block text-[11px] italic"
            style={{ color: p.status === 'risk' ? 'var(--warn)' : 'var(--neg)' }}
          >
            {p.note}
          </span>
        ) : null}
      </span>
      <span className="mono text-right text-xs">{p.xgi.toFixed(2)}</span>
      <span className="mono text-right text-xs">{p.ep.toFixed(1)}</span>
      <span className="mono text-right text-xs">£{p.price.toFixed(1)}</span>
    </div>
  )
}

export function TeamSheetScreen({
  xi,
  bench,
  captainId,
  viceId,
  posAudit,
  onOpenPlayer,
}: {
  xi: Player[]
  bench: Player[]
  captainId: number | null
  viceId: number | null
  posAudit: PositionAuditRow[]
  onOpenPlayer: (id: number) => void
}) {
  const armbandFor = (id: number) =>
    id === captainId ? '(C)' : id === viceId ? '(V)' : ''

  return (
    <section className="h-full overflow-y-auto px-7.5 py-6.5">
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-8.5">
        <div>
          <h2 className="dsp m-0 mb-0.75 text-[46px] leading-[.98] font-bold">
            Team sheet
          </h2>
          <p className="m-0 mb-2.5 text-pretty text-[13px] text-(--fg3) italic">
            Fifteen names as picked. <span className="sp">P</span> takes
            penalties, <span className="sp">C</span> corners and indirect
            free kicks. EP is the game&apos;s own expected points for the
            coming round.
          </p>
          <div
            className="border-border grid gap-2.5 border-b px-1 pt-2 pb-1.25"
            style={{
              gridTemplateColumns: '20px minmax(0,1fr) 46px 46px 40px 46px',
            }}
          >
            <span className="lbl" />
            <span className="lbl">Player</span>
            <span className="lbl text-right">Trend</span>
            <span className="lbl text-right">xGI</span>
            <span className="lbl text-right">EP</span>
            <span className="lbl text-right">Price</span>
          </div>
          {xi.map((p, i) => (
            <XiRow
              key={p.id}
              p={p}
              n={i + 1}
              armband={armbandFor(p.id)}
              onOpen={() => onOpenPlayer(p.id)}
            />
          ))}
          <div className="lbl mt-5 mb-1.5">On the bench, in order</div>
          {bench.map((p, i) => (
            <BenchRow
              key={p.id}
              p={p}
              n={i + 12}
              onOpen={() => onOpenPlayer(p.id)}
            />
          ))}
        </div>

        <div className="border-border border-l pl-6.5">
          <div className="lbl mb-2.25">By position, against the field</div>
          {posAudit.map((l) => (
            <div key={l.pos} className="border-border border-b py-2.25">
              <div className="flex items-baseline justify-between gap-2.5">
                <span className="dsp text-[16.5px]">{l.pos}</span>
                <span className="mono text-xs" style={{ color: l.fg }}>
                  {l.v}
                </span>
              </div>
              <div className="mt-0.75 text-pretty text-xs text-(--fg3) italic">
                {l.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
