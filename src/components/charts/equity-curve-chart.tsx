'use client'

import { EquityPoint } from '@/types'

interface EquityCurveChartProps {
  data: EquityPoint[]
  height?: number
  showGrid?: boolean
  className?: string
}

export function EquityCurveChart({ data, height = 200, showGrid = true, className = '' }: EquityCurveChartProps) {
  if (!data || data.length < 2) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] text-muted-foreground text-sm ${className}`}>
        No data available
      </div>
    )
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 60 }
  const width = 600
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = data.map(d => d.value)
  const minValue = Math.min(...values) * 0.98
  const maxValue = Math.max(...values) * 1.02
  const valueRange = maxValue - minValue || 1

  const scaleX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth
  const scaleY = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight

  // Build path
  const linePath = data.map((point, i) => {
    const x = scaleX(i)
    const y = scaleY(point.value)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  // Area path (fill under line)
  const areaPath = `${linePath} L ${scaleX(data.length - 1).toFixed(1)} ${(padding.top + chartHeight).toFixed(1)} L ${padding.left.toFixed(1)} ${(padding.top + chartHeight).toFixed(1)} Z`

  // Determine if profitable
  const isProfit = data[data.length - 1].value >= data[0].value
  const strokeColor = isProfit ? '#22c55e' : '#ef4444'
  const gradientId = `equity-gradient-${Math.random().toString(36).slice(2, 8)}`

  // Grid lines
  const gridLines = 4
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => minValue + (valueRange * i) / gridLines)

  // Format currency
  const formatValue = (v: number) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`
    return `$${v.toFixed(0)}`
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full ${className}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {showGrid && gridValues.map((val, i) => {
        const y = scaleY(val)
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="hsl(217 33% 20%)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fill="hsl(215 20% 55%)"
              fontSize="10"
              fontFamily="sans-serif"
            >
              {formatValue(val)}
            </text>
          </g>
        )
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Start and end dots */}
      <circle cx={scaleX(0)} cy={scaleY(data[0].value)} r="3" fill={strokeColor} />
      <circle cx={scaleX(data.length - 1)} cy={scaleY(data[data.length - 1].value)} r="4" fill={strokeColor} />
      <circle cx={scaleX(data.length - 1)} cy={scaleY(data[data.length - 1].value)} r="7" fill={strokeColor} opacity="0.2" />
    </svg>
  )
}
