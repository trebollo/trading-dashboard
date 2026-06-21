'use client'

interface DistributionChartProps {
  values: number[]
  height?: number
  bins?: number
  className?: string
}

export function DistributionChart({ values, height = 160, bins = 20, className = '' }: DistributionChartProps) {
  if (!values || values.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] text-muted-foreground text-sm ${className}`}>
        No data available
      </div>
    )
  }

  const padding = { top: 15, right: 15, bottom: 25, left: 15 }
  const width = 500
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate histogram bins
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const binWidth = range / bins

  const histogram: number[] = new Array(bins).fill(0)
  values.forEach(v => {
    const binIndex = Math.min(Math.floor((v - min) / binWidth), bins - 1)
    histogram[binIndex]++
  })

  const maxCount = Math.max(...histogram)
  const barWidth = chartWidth / bins - 2

  // Zero line position
  const zeroPosition = min >= 0 ? -1 : max <= 0 ? bins : Math.floor((0 - min) / binWidth)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Bars */}
      {histogram.map((count, i) => {
        const barHeight = maxCount > 0 ? (count / maxCount) * chartHeight : 0
        const x = padding.left + (i / bins) * chartWidth + 1
        const y = padding.top + chartHeight - barHeight
        const binCenter = min + (i + 0.5) * binWidth
        const isProfit = binCenter >= 0

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={Math.max(barWidth, 1)}
            height={barHeight}
            rx="2"
            fill={isProfit ? '#22c55e' : '#ef4444'}
            opacity={0.7 + (count / maxCount) * 0.3}
          />
        )
      })}

      {/* Zero line */}
      {min < 0 && max > 0 && (
        <line
          x1={padding.left + (zeroPosition / bins) * chartWidth}
          y1={padding.top}
          x2={padding.left + (zeroPosition / bins) * chartWidth}
          y2={padding.top + chartHeight}
          stroke="hsl(215 20% 55%)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}

      {/* X-axis labels */}
      <text
        x={padding.left}
        y={height - 5}
        fill="hsl(215 20% 55%)"
        fontSize="9"
        fontFamily="sans-serif"
      >
        ${min.toFixed(0)}
      </text>
      <text
        x={width - padding.right}
        y={height - 5}
        textAnchor="end"
        fill="hsl(215 20% 55%)"
        fontSize="9"
        fontFamily="sans-serif"
      >
        ${max.toFixed(0)}
      </text>
      {min < 0 && max > 0 && (
        <text
          x={padding.left + (zeroPosition / bins) * chartWidth}
          y={height - 5}
          textAnchor="middle"
          fill="hsl(215 20% 65%)"
          fontSize="9"
          fontFamily="sans-serif"
          fontWeight="bold"
        >
          $0
        </text>
      )}
    </svg>
  )
}
