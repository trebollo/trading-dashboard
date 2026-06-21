'use client'

interface GaugeChartProps {
  value: number
  max?: number
  label?: string
  suffix?: string
  size?: number
  className?: string
}

export function GaugeChart({ value, max = 100, label, suffix = '%', size = 120, className = '' }: GaugeChartProps) {
  const normalizedValue = Math.min(Math.max(value, 0), max)
  const percentage = normalizedValue / max
  
  const centerX = size / 2
  const centerY = size * 0.6
  const radius = size * 0.4
  const strokeWidth = size * 0.08

  // Arc from -180deg to 0deg (semi-circle)
  const startAngle = Math.PI
  const endAngle = 0
  const valueAngle = startAngle - (startAngle - endAngle) * percentage

  const startX = centerX + radius * Math.cos(startAngle)
  const startY = centerY - radius * Math.sin(startAngle)
  const endX = centerX + radius * Math.cos(endAngle)
  const endY = centerY - radius * Math.sin(endAngle)
  const valueX = centerX + radius * Math.cos(valueAngle)
  const valueY = centerY - radius * Math.sin(valueAngle)

  // Background arc (full semi-circle)
  const bgArc = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`
  
  // Value arc
  const largeArcFlag = percentage > 0.5 ? 1 : 0
  const valueArc = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${valueX} ${valueY}`

  // Color based on value percentage
  const getColor = () => {
    if (percentage >= 0.6) return '#22c55e'
    if (percentage >= 0.4) return '#eab308'
    return '#ef4444'
  }

  const color = getColor()
  const gradientId = `gauge-gradient-${Math.random().toString(36).slice(2, 8)}`

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={bgArc}
          fill="none"
          stroke="hsl(217 33% 18%)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        {percentage > 0 && (
          <path
            d={valueArc}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* Center value text */}
        <text
          x={centerX}
          y={centerY - 2}
          textAnchor="middle"
          fill="hsl(210 40% 98%)"
          fontSize={size * 0.18}
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          {value.toFixed(1)}{suffix}
        </text>
      </svg>
      {label && (
        <span className="text-[11px] text-muted-foreground mt-1 font-medium uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  )
}
