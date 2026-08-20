export interface BarChartPoint {
  label: string
  value: number
}

export function PlayerBarChart({ data }: { data: BarChartPoint[] }) {
  const w = 360
  const h = 120
  const max = Math.max(...data.map((d) => d.value), 0.1)
  const bw = w / data.length

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((d, i) => {
        const bh = (d.value / max) * (h - 24)
        return (
          <g key={i}>
            <rect
              x={i * bw + 8}
              y={h - 20 - bh}
              width={bw - 16}
              height={bh}
              rx={3}
              fill="var(--accent)"
              opacity={0.55 + 0.09 * i}
            />
            <text
              x={i * bw + bw / 2}
              y={h - 6}
              fill="var(--fg3)"
              fontSize={10}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {d.label}
            </text>
            <text
              x={i * bw + bw / 2}
              y={h - 26 - bh}
              fill="var(--fg2)"
              fontSize={10}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {d.value.toFixed(0)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
