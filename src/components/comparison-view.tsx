'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select } from './ui/select'
import { BacktestResult } from '@/types'
import { BacktestStorage } from '@/lib/storage'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface ComparisonMetric {
  key: string
  label: string
  format: 'currency' | 'percent' | 'number' | 'ratio'
  higherIsBetter: boolean
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  { key: 'totalReturnPercent', label: 'Total Return', format: 'percent', higherIsBetter: true },
  { key: 'cagr', label: 'CAGR', format: 'percent', higherIsBetter: true },
  { key: 'maxDrawdownPercent', label: 'Max Drawdown', format: 'percent', higherIsBetter: false },
  { key: 'sharpeRatio', label: 'Sharpe Ratio', format: 'ratio', higherIsBetter: true },
  { key: 'sortinoRatio', label: 'Sortino Ratio', format: 'ratio', higherIsBetter: true },
  { key: 'calmarRatio', label: 'Calmar Ratio', format: 'ratio', higherIsBetter: true },
  { key: 'winRate', label: 'Win Rate', format: 'percent', higherIsBetter: true },
  { key: 'profitFactor', label: 'Profit Factor', format: 'ratio', higherIsBetter: true },
  { key: 'riskRewardRatio', label: 'Risk/Reward', format: 'ratio', higherIsBetter: true },
  { key: 'expectancy', label: 'Expectancy', format: 'currency', higherIsBetter: true },
  { key: 'totalTrades', label: 'Total Trades', format: 'number', higherIsBetter: true },
  { key: 'avgTrade', label: 'Avg Trade', format: 'currency', higherIsBetter: true },
  { key: 'largestWin', label: 'Largest Win', format: 'currency', higherIsBetter: true },
  { key: 'largestLoss', label: 'Largest Loss', format: 'currency', higherIsBetter: false },
  { key: 'maxConsecutiveLosses', label: 'Max Consec. Losses', format: 'number', higherIsBetter: false },
]

export default function ComparisonView() {
  const [availableBacktests, setAvailableBacktests] = useState<BacktestResult[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedBacktests, setSelectedBacktests] = useState<BacktestResult[]>([])

  useEffect(() => {
    const stored = BacktestStorage.getAll()
    setAvailableBacktests(stored)
  }, [])

  useEffect(() => {
    setSelectedBacktests(
      selectedIds
        .map(id => availableBacktests.find(b => b.id === id))
        .filter((b): b is BacktestResult => b !== undefined)
    )
  }, [selectedIds, availableBacktests])

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, id])
    }
  }

  const formatValue = (value: number, format: ComparisonMetric['format']): string => {
    switch (format) {
      case 'currency':
        return formatCurrency(value)
      case 'percent':
        return `${value.toFixed(2)}%`
      case 'ratio':
        return value.toFixed(2)
      default:
        return value.toLocaleString()
    }
  }

  const getBestValue = (metric: ComparisonMetric, backtests: BacktestResult[]): number | null => {
    if (backtests.length === 0) return null
    const values = backtests.map(b => b.metrics[metric.key as keyof typeof b.metrics] as number)
    return metric.higherIsBetter ? Math.max(...values) : Math.min(...values)
  }

  if (availableBacktests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No backtest results available for comparison. Import some backtests first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selection */}
      <div>
        <h3 className="text-sm font-medium mb-3">Select Strategies to Compare (up to 5)</h3>
        <div className="flex flex-wrap gap-2">
          {availableBacktests.map((backtest) => (
            <button
              key={backtest.id}
              onClick={() => toggleSelection(backtest.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedIds.includes(backtest.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {backtest.strategyName}
            </button>
          ))}
        </div>
      </div>

      {selectedBacktests.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {selectedBacktests.map((backtest) => (
              <Card key={backtest.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{backtest.strategyName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${backtest.metrics.totalReturn > 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatPercent(backtest.metrics.totalReturnPercent)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {backtest.symbol} • {backtest.timeframe}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Metric</th>
                  {selectedBacktests.map((b) => (
                    <th key={b.id} className="text-right py-3 px-4 font-medium">
                      {b.strategyName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_METRICS.map((metric) => {
                  const bestValue = getBestValue(metric, selectedBacktests)
                  
                  return (
                    <tr key={metric.key} className="border-b">
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {metric.label}
                      </td>
                      {selectedBacktests.map((backtest) => {
                        const value = backtest.metrics[metric.key as keyof typeof backtest.metrics] as number
                        const isBest = value === bestValue && selectedBacktests.length > 1
                        
                        return (
                          <td 
                            key={backtest.id} 
                            className={`text-right py-3 px-4 text-sm ${isBest ? 'font-bold text-profit' : ''}`}
                          >
                            {formatValue(value, metric.format)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Radar Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Radar chart visualization coming soon
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedBacktests.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Click on strategies above to add them to the comparison
        </div>
      )}
    </div>
  )
}
