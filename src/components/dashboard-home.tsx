'use client'

import {
  Activity,
  TrendingUp,
  TrendingDown,
  Sparkles,
  BarChart3,
  Target,
  Zap,
  Clock,
} from 'lucide-react'
import { BacktestResult } from '@/types'
import { EquityCurveChart } from './charts/equity-curve-chart'
import { GaugeChart } from './charts/gauge-chart'
import { DistributionChart } from './charts/distribution-chart'
import { MiniSparkline } from './charts/mini-sparkline'
import { MonthlyHeatmap } from './charts/monthly-heatmap'

interface DashboardHomeProps {
  backtests: BacktestResult[]
}

export function DashboardHome({ backtests }: DashboardHomeProps) {
  // Calculate global stats
  const totalStrategies = backtests.length
  const allTrades = backtests.flatMap(b => b.trades || [])
  const totalTrades = allTrades.length

  const avgReturn = totalStrategies > 0
    ? backtests.reduce((sum, b) => sum + (b.metrics?.totalReturnPercent || 0), 0) / totalStrategies
    : 0

  const bestStrategy = totalStrategies > 0
    ? backtests.reduce((best, b) =>
        (b.metrics?.totalReturnPercent || 0) > (best.metrics?.totalReturnPercent || 0) ? b : best
      , backtests[0])
    : null

  const globalWinRate = totalTrades > 0
    ? (allTrades.filter(t => t.pnl > 0).length / totalTrades) * 100
    : 0

  const globalProfitFactor = (() => {
    const grossProfit = allTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0)
    const grossLoss = Math.abs(allTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0))
    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0
  })()

  const avgSharpe = totalStrategies > 0
    ? backtests.reduce((sum, b) => sum + (b.metrics?.sharpeRatio || 0), 0) / totalStrategies
    : 0

  // Best equity curve
  const bestEquityCurve = bestStrategy?.equityCurve || []

  // P&L distribution
  const pnlValues = allTrades.map(t => t.pnl)

  // Sparkline data from best strategy equity curve
  const sparklineData = bestEquityCurve.map(p => p.value).slice(0, 30)

  // Recent activity (last 10 trades across all strategies, sorted by date)
  const recentTrades = [...allTrades]
    .sort((a, b) => new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime())
    .slice(0, 6)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Strategies"
          value={totalStrategies.toString()}
          subtitle="Analyzed"
          icon={<Activity className="h-3.5 w-3.5 text-primary" />}
          iconBg="bg-primary/10 group-hover:bg-primary/20"
        />
        <KPICard
          title="Avg Return"
          value={`${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(1)}%`}
          subtitle="Average"
          icon={avgReturn >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-green-500" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          iconBg={avgReturn >= 0 ? 'bg-green-500/10 group-hover:bg-green-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}
          valueColor={avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}
          sparkline={sparklineData}
        />
        <KPICard
          title="Best Strategy"
          value={bestStrategy?.strategyName || '-'}
          subtitle={bestStrategy ? `${(bestStrategy.metrics?.totalReturnPercent || 0).toFixed(1)}% return` : 'No data'}
          icon={<Sparkles className="h-3.5 w-3.5 text-yellow-500" />}
          iconBg="bg-yellow-500/10 group-hover:bg-yellow-500/20"
          isTextValue
        />
        <KPICard
          title="Total Trades"
          value={totalTrades.toString()}
          subtitle="Executed"
          icon={<BarChart3 className="h-3.5 w-3.5 text-blue-500" />}
          iconBg="bg-blue-500/10 group-hover:bg-blue-500/20"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
        <div className="metric-card group flex flex-col items-center justify-center py-4">
          <GaugeChart value={globalWinRate} max={100} label="Win Rate" size={110} />
        </div>
        <div className="metric-card group flex flex-col items-center justify-center py-4">
          <GaugeChart
            value={Math.min(globalProfitFactor, 5)}
            max={5}
            label="Profit Factor"
            suffix=""
            size={110}
          />
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {globalProfitFactor > 5 ? `(${globalProfitFactor.toFixed(2)})` : ''}
          </span>
        </div>
        <div className="metric-card group flex flex-col items-center justify-center py-4">
          <GaugeChart
            value={Math.max(Math.min(avgSharpe + 2, 4), 0)}
            max={4}
            label="Sharpe Ratio"
            suffix=""
            size={110}
          />
          <span className="text-[10px] text-muted-foreground mt-0.5">
            Actual: {avgSharpe.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equity Curve */}
        <div className="metric-card group p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Best Strategy Equity Curve
            </h3>
            {bestStrategy && (
              <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                {bestStrategy.strategyName}
              </span>
            )}
          </div>
          <EquityCurveChart data={bestEquityCurve} height={200} />
        </div>

        {/* P&L Distribution */}
        <div className="metric-card group p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              P&L Distribution
            </h3>
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
              {pnlValues.length} trades
            </span>
          </div>
          <DistributionChart values={pnlValues} height={200} bins={25} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Heatmap */}
        <div className="metric-card group p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Monthly Returns Heatmap</h3>
          </div>
          <MonthlyHeatmap trades={allTrades} />
        </div>

        {/* Recent Activity */}
        <div className="metric-card group p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="space-y-2">
            {recentTrades.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-6">
                No trades yet
              </div>
            ) : (
              recentTrades.map((trade, i) => (
                <div
                  key={trade.id || i}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20 border border-border/20"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${trade.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <div className="text-xs font-medium text-foreground">
                        {trade.symbol} - {trade.type.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(trade.exitTime).toLocaleDateString('es-ES', { 
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  valueColor?: string
  isTextValue?: boolean
  sparkline?: number[]
}

function KPICard({ title, value, subtitle, icon, iconBg, valueColor, isTextValue, sparkline }: KPICardProps) {
  return (
    <div className="metric-card group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {title}
        </span>
        <div className={`p-1.5 rounded-lg transition-colors ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className={`${isTextValue ? 'text-base' : 'text-2xl'} font-bold tracking-tight truncate ${valueColor || ''}`}>
            {value}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">{subtitle}</div>
        </div>
        {sparkline && sparkline.length > 2 && (
          <MiniSparkline data={sparkline} width={60} height={24} />
        )}
      </div>
    </div>
  )
}
