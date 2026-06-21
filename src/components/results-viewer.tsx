'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { BacktestResult } from '@/types'
import { analyzeStrategy } from '@/lib/strategy-analyzer'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'

interface ResultsViewerProps {
  backtests: BacktestResult[]
  onDelete: (id: string) => void
}

export default function ResultsViewer({ backtests, onDelete }: ResultsViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this backtest?')) {
      onDelete(id)
    }
  }

  if (backtests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No backtest results imported yet. Go to the "Import Results" tab to upload your TradingView CSV.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {backtests.map((backtest) => (
        <BacktestCard
          key={backtest.id}
          backtest={backtest}
          isExpanded={expandedId === backtest.id}
          onToggle={() => setExpandedId(expandedId === backtest.id ? null : backtest.id)}
          onDelete={() => handleDelete(backtest.id)}
        />
      ))}
    </div>
  )
}

function BacktestCard({
  backtest,
  isExpanded,
  onToggle,
  onDelete,
}: {
  backtest: BacktestResult
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const analysis = analyzeStrategy(backtest.metrics, backtest.trades)
  const isProfitable = backtest.metrics.totalReturn > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isProfitable ? 'bg-profit' : 'bg-loss'}`} />
            <div>
              <CardTitle className="text-lg">{backtest.strategyName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {backtest.symbol} • {backtest.timeframe} • {backtest.metrics.totalTrades} trades
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-4">
              <p className={`text-lg font-bold ${isProfitable ? 'text-profit' : 'text-loss'}`}>
                {formatPercent(backtest.metrics.totalReturnPercent)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(backtest.metrics.totalReturn)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onToggle}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-6">
            {/* Score & Grade */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Strategy Score</p>
                <p className="text-3xl font-bold">{analysis.score}/100</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Grade</p>
                <p className={`text-3xl font-bold ${
                  analysis.grade.startsWith('A') ? 'text-profit' :
                  analysis.grade.startsWith('B') ? 'text-profit/70' :
                  analysis.grade.startsWith('C') ? 'text-yellow-500' :
                  'text-loss'
                }`}>
                  {analysis.grade}
                </p>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Win Rate" value={`${backtest.metrics.winRate.toFixed(1)}%`} />
              <MetricCard label="Profit Factor" value={backtest.metrics.profitFactor.toFixed(2)} />
              <MetricCard label="Max Drawdown" value={`${backtest.metrics.maxDrawdownPercent.toFixed(1)}%`} isNegative />
              <MetricCard label="Sharpe Ratio" value={backtest.metrics.sharpeRatio.toFixed(2)} />
              <MetricCard label="Risk/Reward" value={backtest.metrics.riskRewardRatio.toFixed(2)} />
              <MetricCard label="Expectancy" value={formatCurrency(backtest.metrics.expectancy)} />
              <MetricCard label="Avg Trade" value={formatCurrency(backtest.metrics.avgTrade)} />
              <MetricCard label="CAGR" value={`${backtest.metrics.cagr.toFixed(1)}%`} />
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {analysis.strengths.map((strength, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {strength}</li>
                  ))}
                  {analysis.strengths.length === 0 && (
                    <li className="text-sm text-muted-foreground">No significant strengths identified</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-loss" />
                  Weaknesses
                </h4>
                <ul className="space-y-1">
                  {analysis.weaknesses.map((weakness, i) => (
                    <li key={i} className="text-sm text-muted-foreground">• {weakness}</li>
                  ))}
                  {analysis.weaknesses.length === 0 && (
                    <li className="text-sm text-muted-foreground">No significant weaknesses identified</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Warnings */}
            {analysis.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Warnings</h4>
                {analysis.warnings.map((warning, i) => (
                  <div key={i} className={`p-3 rounded-lg text-sm ${
                    warning.severity === 'critical' ? 'bg-loss/10 text-loss' :
                    warning.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}>
                    <strong>{warning.title}:</strong> {warning.description}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recommendations</h4>
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{rec.actionable}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Full Metrics Table */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                View All Metrics
              </summary>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(backtest.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium">
                      {typeof value === 'number' ? 
                        (key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate') ? 
                          `${value.toFixed(2)}%` : value.toFixed(2)) : 
                        value}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function MetricCard({ label, value, isNegative }: { label: string; value: string; isNegative?: boolean }) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${isNegative ? 'text-loss' : ''}`}>{value}</p>
    </div>
  )
}
