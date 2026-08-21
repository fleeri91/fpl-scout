'use client'

import type { HeadToHeadCase } from '../mapFplData'

export function HeadToHeadScreen({
  cases,
}: {
  cases: HeadToHeadCase[]
}) {
  if (cases.length === 0) {
    return (
      <section className="flex h-full items-center justify-center px-7.5">
        <div className="text-center text-[13px] text-(--fg3) italic">
          No transfer cases right now — your squad looks efficient for its
          price.
        </div>
      </section>
    )
  }

  return (
    <section className="h-full overflow-y-auto px-7.5 py-6.5">
      <h2 className="dsp m-0 mb-0.75 text-[46px] leading-[.98] font-bold">
        Head to head
      </h2>
      <p className="m-0 mb-5.5 text-[13px] text-(--fg3) italic">
        The men under review, set against the men who would replace them.
        Green marks the better of the two.
      </p>

      {cases.map((t) => (
        <div key={t.outName} className="mb-8.5">
          <div className="border-border flex flex-wrap items-baseline justify-between gap-4.5 border-b-2 pb-2">
            <h3 className="dsp m-0 text-[27px]">
              The case against {t.outName}
            </h3>
            <span className="mono text-[11px] text-(--fg3)">
              {t.bank} in hand · {t.ft} · a hit costs four points
            </span>
          </div>
          <p className="my-2.5 max-w-[78ch] text-pretty text-sm leading-[1.62] text-(--fg2)">
            {t.rationale}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-border border-b">
                  <th className="lbl px-2.5 py-1.75 text-left font-normal">
                    Measure
                  </th>
                  {t.heads.map((h, i) => (
                    <th
                      key={i}
                      className="border-border border-l px-2.5 py-1.75 text-right"
                    >
                      <span className="dsp block text-[18px]" style={{ color: h.tagFg }}>
                        {h.name}
                      </span>
                      <span className="mono text-[10px] text-(--fg3)">
                        {h.sub}
                      </span>
                      <span
                        className="mt-0.75 block text-[9px] tracking-[.16em] uppercase"
                        style={{ color: h.tagFg }}
                      >
                        {h.tag}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.measures.map((m) => (
                  <tr key={m.k} className="border-border border-b">
                    <td className="px-2.5 py-2 text-[13px] text-(--fg3)">
                      {m.k}
                    </td>
                    {m.cells.map((c, i) => (
                      <td
                        key={i}
                        className="mono border-border border-l px-2.5 py-2 text-right text-[13.5px]"
                        style={{ color: c.fg }}
                      >
                        {c.v}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-border border-b">
                  <td className="lbl px-2.5 py-2.25">Next five</td>
                  {t.fixtureCells.map((fc, i) => (
                    <td key={i} className="border-border border-l px-2.5 py-2">
                      <div className="flex justify-end gap-0.75">
                        {fc.next.map((f, j) => (
                          <span
                            key={j}
                            data-d={f.d}
                            className="h-4.75 w-7.5 text-[10px]"
                          >
                            {f.label}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-border border-t">
                  <td className="lbl px-2.5 py-2.25">Verdict</td>
                  {t.verdicts.map((v, i) => (
                    <td
                      key={i}
                      className="border-border border-l px-2.5 py-2.25 text-right text-[12px] text-pretty italic"
                      style={{ color: v.fg }}
                    >
                      {v.text}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  )
}
