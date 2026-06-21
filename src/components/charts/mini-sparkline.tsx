'use client'

interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}

export function MiniSparkline({ data, width = 80, height = 30, color, className = '' }: MiniSparklineProps) {
  if (!data || data.length < 2) return null

  const padding = 2
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / range) * chartHeight
    return { x, y }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  const isPositive = data[data.length - 1] >= data[0]
  const lineColor = color || (isPositive ? '#22c55e' : '#ef4444')

  return (
    <svg width={width} height={height} className={className}>
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2"
        fill={lineColor}
      />
    </svg>
  )
}
