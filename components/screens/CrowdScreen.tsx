'use client'

import type { CrowdView } from '../mapFplData'

export function CrowdScreen({
  crowd,
  onOpenPlayer,
}: {
  crowd: CrowdView
  onOpenPlayer: (id: number) => void
}) {
  return (
    <section className="h-full overflow-y-auto px-7.5 py-6.5">
      <h2 className="dsp m-0 mb-0.75 text-[46px] leading-[.98] font-bold">
        Crowd
      </h2>
      <p className="m-0 mb-5 text-[13px] text-(--fg3) italic">
        What everybody else is doing this week, from real transfer and
        ownership counts.
      </p>

      <div className="mb-5.5 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-2.5">
        {crowd.pulse.map((p) => (
          <div
            key={p.k}
            className="border-border rounded-(--r-card) border bg-(--card) px-4 pt-3.25 pb-3.5"
          >
            <div className="lbl">{p.k}</div>
            <div className="dsp mt-0.75 text-[26px] leading-[1.05]">
              {p.v}
            </div>
            <div className="mt-0.75 text-[11px] text-(--fg3) italic">
              {p.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))]">
        {crowd.lists.map((c) => (
          <div key={c.title} className="border-border mb-5 border-l pr-5.5 pb-2 pl-5.5">
            <div className="lbl">{c.title}</div>
            <p className="my-1.25 mb-3 text-[12px] leading-[1.5] text-(--fg3) italic">
              {c.blurb}
            </p>
            {c.items.map((i) => (
              <div
                key={i.id}
                data-row
                onClick={() => onOpenPlayer(i.id)}
                className="border-border grid cursor-pointer items-baseline gap-2.25 border-b py-1.75 hover:bg-(--card2)"
                style={{ gridTemplateColumns: '16px minmax(0,1fr) auto' }}
              >
                <span className="mono text-[10px] text-(--fg3)">{i.n}</span>
                <span>
                  <span className="text-[13.5px]">{i.name}</span>
                  <span
                    className="ml-1.75 text-[10px] italic"
                    style={{ color: i.ownedFg }}
                  >
                    {i.owned}
                  </span>
                </span>
                <span className="mono text-[12px] text-(--fg2)">{i.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="border-border mt-1.5 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6.5 border-t-2 pt-4">
        <div>
          <div className="lbl mb-1">Where you differ from the crowd</div>
          <p className="m-0 mb-2.5 text-[12px] text-(--fg3) italic">
            Your players owned by fewer than fifteen per cent. These are the
            holdings that move your rank.
          </p>
          {crowd.differentials.map((d) => (
            <div
              key={d.id}
              data-row
              onClick={() => onOpenPlayer(d.id)}
              className="border-border flex cursor-pointer items-baseline justify-between gap-3 border-b py-2 hover:bg-(--card2)"
            >
              <span className="text-[13.5px]">
                {d.name}
                <span className="mono ml-2 text-[10px] text-(--fg3)">
                  {d.team}
                </span>
              </span>
              <span className="mono text-primary text-[12px]">
                {d.own}% owned · xGI {d.xgi}
              </span>
            </div>
          ))}
          {crowd.differentials.length === 0 ? (
            <div className="py-3 text-[12px] text-(--fg3) italic">
              No under-owned differentials in your current XI.
            </div>
          ) : null}
        </div>
        <div>
          <div className="lbl mb-1">The template you are missing</div>
          <p className="m-0 mb-2.5 text-[12px] text-(--fg3) italic">
            Widely held players absent from your fifteen. Each one is a week
            where the field moves and you do not.
          </p>
          {crowd.missing.map((m) => (
            <div
              key={m.id}
              data-row
              onClick={() => onOpenPlayer(m.id)}
              className="border-border flex cursor-pointer items-baseline justify-between gap-3 border-b py-2 hover:bg-(--card2)"
            >
              <span className="text-[13.5px]">
                {m.name}
                <span className="mono ml-2 text-[10px] text-(--fg3)">
                  {m.team} · £{m.price}m
                </span>
              </span>
              <span className="mono text-[12px]" style={{ color: 'var(--neg)' }}>
                {m.own}% owned
              </span>
            </div>
          ))}
          {crowd.missing.length === 0 ? (
            <div className="py-3 text-[12px] text-(--fg3) italic">
              You already hold every widely-owned player.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
