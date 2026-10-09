// xGI per gameweek, last five.
export function Sparkline({
  hist,
  width = 62,
  height = 20,
}: {
  hist: number[]
  width?: number
  height?: number
}) {
  if (hist.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} />
    )
  }

  const max = Math.max(...hist, 0.1)
  const pts = hist.map((v, i): [number, number] => [
    (i / Math.max(hist.length - 1, 1)) * (width - 3) + 1.5,
    height - 2 - (v / max) * (height - 4),
  ])
  const last = pts[pts.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`xGI last five gameweeks: ${hist.map((v) => v.toFixed(2)).join(', ')}`}
    >
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill="var(--accent)" />
    </svg>
  )
}
