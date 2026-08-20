export function Sparkline({
  hist,
  width = 52,
  height = 18,
}: {
  hist: number[]
  width?: number
  height?: number
}) {
  const max = Math.max(...hist, 0.1)
  const min = 0
  const pts = hist.map((v, i): [number, number] => [
    (i / (hist.length - 1)) * (width - 2) + 1,
    height - 1 - ((v - min) / (max - min)) * (height - 2),
  ])
  const last = pts[pts.length - 1]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2} fill="var(--accent)" />
    </svg>
  )
}
