'use client'

import { Trade } from '@/types'

interface MonthlyHeatmapProps {
  trades: Trade[]
  className?: string
}

export function MonthlyHeatmap({ trades, className = '' }: MonthlyHeatmapProps) {
  if (!trades || trades.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-muted-foreground text-sm ${className}`}>
        No trade data
      </div>
    )
  }

  // Group trades by month
  const monthlyPnL: Record<string, number> = {}
  trades.forEach(trade => {
    const date = new Date(trade.exitTime)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyPnL[key] = (monthlyPnL[key] || 0) + trade.pnl
  })

  const months = Object.keys(monthlyPnL).sort()
  const values = Object.values(monthlyPnL)
  const maxAbs = Math.max(Math.abs(Math.min(...values)), Math.abs(Math.max(...values))) || 1

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Get unique years
  const years = [...new Set(months.map(m => m.split('-')[0]))].sort()

  return (
    <div className={`space-y-2 ${className}`}>
      {years.map(year => {
        const yearMonths = Array.from({ length: 12 }, (_, i) => {
          const key = `${year}-${String(i + 1).padStart(2, '0')}`
          return { month: i, key, pnl: monthlyPnL[key] || null }
        })

        return (
          <div key={year}>
            <div className="text-[10px] text-muted-foreground mb-1 font-medium">{year}</div>
            <div className="grid grid-cols-12 gap-1">
              {yearMonths.map(({ month, key, pnl }) => {
                if (pnl === null) {
                  return (
                    <div key={key} className="aspect-square rounded-sm bg-muted/20" title={`${monthNames[month]} - No data`} />
                  )
                }

                const intensity = Math.abs(pnl) / maxAbs
                const opacity = 0.3 + intensity * 0.7
                const bgColor = pnl >= 0 ? `rgba(34, 197, 94, ${opacity})` : `rgba(239, 68, 68, ${opacity})`

                return (
                  <div
                    key={key}
                    className="aspect-square rounded-sm flex items-center justify-center cursor-default transition-transform hover:scale-110"
                    style={{ backgroundColor: bgColor }}
                    title={`${monthNames[month]} ${year}: $${pnl.toFixed(0)}`}
                  >
                    <span className="text-[7px] font-bold text-white/80">
                      {monthNames[month].charAt(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-500/70" />
          <span className="text-[9px] text-muted-foreground">Loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <span className="text-[9px] text-muted-foreground">No data</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-500/70" />
          <span className="text-[9px] text-muted-foreground">Profit</span>
        </div>
      </div>
    </div>
  )
}
