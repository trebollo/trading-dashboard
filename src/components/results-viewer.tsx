'use client'

import { useState, useMemo } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, ArrowUpDown, ChevronLeft, ChevronRight,
  List, BarChart3
} from 'lucide-react'
import { BacktestResult, Trade } from '@/types'
import { analyzeStrategy } from '@/lib/strategy-analyzer'
import { formatCurrency, formatPercent, formatNumber, formatDate } from '@/lib/utils'

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
      <div className="flex flex-col items-center justify-center py-16">
        <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-center">
          No backtest results imported yet.
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Go to the &quot;Import CSV&quot; tab to upload your TradingView results.
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
  const [activeTab, setActiveTab] = useState<'metrics' | 'trades'>('metrics')
  const analysis = analyzeStrategy(backtest.metrics, backtest.trades)
  const isProfitable = backtest.metrics.totalReturn > 0

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-border/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isProfitable ? 'bg-green-500' : 'bg-red-500'} shadow-sm ${isProfitable ? 'shadow-green-500/30' : 'shadow-red-500/30'}`} />
            <div>
              <CardTitle className="text-lg">{backtest.strategyName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {backtest.symbol} &bull; {backtest.timeframe} &bull; {backtest.metrics.totalTrades} trades
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-4">
              <p className={`text-lg font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercent(backtest.metrics.totalReturnPercent)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(backtest.metrics.totalReturn)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 animate-fade-in">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg mb-6 w-fit">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'metrics'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'trades'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Trades
              {backtest.trades.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                  {backtest.trades.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'metrics' ? (
            <MetricsPanel backtest={backtest} analysis={analysis} />
          ) : (
            <TradesList trades={backtest.trades} />
          )}
        </CardContent>
      )}
    </Card>
  )
}

function MetricsPanel({ backtest, analysis }: { backtest: BacktestResult; analysis: ReturnType<typeof analyzeStrategy> }) {
  return (
    <div className="space-y-6">
      {/* Score & Grade */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/30">
        <div>
          <p className="text-sm text-muted-foreground">Strategy Score</p>
          <p className="text-3xl font-bold">{analysis.score}/100</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Grade</p>
          <p className={`text-3xl font-bold ${
            analysis.grade.startsWith('A') ? 'text-green-500' :
            analysis.grade.startsWith('B') ? 'text-green-500/70' :
            analysis.grade.startsWith('C') ? 'text-yellow-500' :
            'text-red-500'
          }`}>
            {analysis.grade}
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Strengths
          </h4>
          <ul className="space-y-1.5">
            {analysis.strengths.map((strength, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-green-500 mt-0.5">+</span>
                {strength}
              </li>
            ))}
            {analysis.strengths.length === 0 && (
              <li className="text-sm text-muted-foreground">No significant strengths identified</li>
            )}
          </ul>
        </div>
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Weaknesses
          </h4>
          <ul className="space-y-1.5">
            {analysis.weaknesses.map((weakness, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-red-500 mt-0.5">-</span>
                {weakness}
              </li>
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
            <div key={i} className={`p-3 rounded-lg text-sm border ${
              warning.severity === 'critical' ? 'bg-red-500/5 border-red-500/20 text-red-400' :
              warning.severity === 'high' ? 'bg-orange-500/5 border-orange-500/20 text-orange-400' :
              'bg-yellow-500/5 border-yellow-500/20 text-yellow-400'
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
            <div key={i} className="p-3 bg-muted/50 rounded-lg border border-border/30">
              <p className="font-medium text-sm">{rec.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{rec.actionable}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full Metrics Table */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          View All Metrics
        </summary>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(backtest.metrics).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm p-2 bg-muted/30 rounded border border-border/20">
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
  )
}

// Trades List Component with sorting and pagination
type SortKey = 'entryTime' | 'type' | 'pnl' | 'pnlPercent' | 'entryPrice' | 'exitPrice' | 'duration'
type SortDir = 'asc' | 'desc'

function TradesList({ trades }: { trades: Trade[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('entryTime')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const sortedTrades = useMemo(() => {
    const sorted = [...trades].sort((a, b) => {
      let comparison = 0

      switch (sortKey) {
        case 'entryTime':
          comparison = new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'pnl':
          comparison = a.pnl - b.pnl
          break
        case 'pnlPercent':
          comparison = a.pnlPercent - b.pnlPercent
          break
        case 'entryPrice':
          comparison = a.entryPrice - b.entryPrice
          break
        case 'exitPrice':
          comparison = a.exitPrice - b.exitPrice
          break
        case 'duration':
          const durA = new Date(a.exitTime).getTime() - new Date(a.entryTime).getTime()
          const durB = new Date(b.exitTime).getTime() - new Date(b.entryTime).getTime()
          comparison = durA - durB
          break
      }

      return sortDir === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [trades, sortKey, sortDir])

  const totalPages = Math.ceil(sortedTrades.length / pageSize)
  const paginatedTrades = sortedTrades.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const formatDuration = (entryTime: string, exitTime: string): string => {
    const ms = new Date(exitTime).getTime() - new Date(entryTime).getTime()
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
  }

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <List className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No individual trade data available.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Import a detailed backtest to see trade-by-trade results.</p>
      </div>
    )
  }

  // Summary stats
  const winTrades = trades.filter(t => t.pnl > 0)
  const lossTrades = trades.filter(t => t.pnl <= 0)
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)

  return (
    <div className="space-y-4">
      {/* Trade Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
          <p className="text-xs text-muted-foreground">Total Trades</p>
          <p className="text-lg font-semibold">{trades.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
          <p className="text-xs text-green-400">Winners</p>
          <p className="text-lg font-semibold text-green-500">{winTrades.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-xs text-red-400">Losers</p>
          <p className="text-lg font-semibold text-red-500">{lossTrades.length}</p>
        </div>
        <div className={`p-3 rounded-lg ${totalPnl >= 0 ? 'bg-green-500/5 border border-green-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
          <p className="text-xs text-muted-foreground">Total P&L</p>
          <p className={`text-lg font-semibold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(totalPnl)}
          </p>
        </div>
      </div>

      {/* Trades Table */}
      <div className="rounded-xl border border-border/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border/30">
                <SortableHeader label="Date" sortKey="entryTime" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortableHeader label="Type" sortKey="type" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortableHeader label="Entry" sortKey="entryPrice" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortableHeader label="Exit" sortKey="exitPrice" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortableHeader label="P&L" sortKey="pnl" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortableHeader label="P&L %" sortKey="pnlPercent" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortableHeader label="Duration" sortKey="duration" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(trade.entryTime)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      trade.type === 'long'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {trade.type === 'long' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {trade.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {formatNumber(trade.entryPrice)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {formatNumber(trade.exitPrice)}
                  </td>
                  <td className={`px-3 py-2.5 font-semibold text-xs ${
                    trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                  </td>
                  <td className={`px-3 py-2.5 text-xs ${
                    trade.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {formatDuration(trade.entryTime, trade.exitTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sortedTrades.length)} of {sortedTrades.length} trades
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'ghost'}
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum + 1}
                  </Button>
                )
              })}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  direction,
  onSort,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  direction: SortDir
  onSort: (key: SortKey) => void
}) {
  const isActive = sortKey === currentKey

  return (
    <th
      className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${isActive ? 'text-primary' : 'opacity-30'}`} />
        {isActive && (
          <span className="text-[10px] text-primary">
            {direction === 'asc' ? '\u2191' : '\u2193'}
          </span>
        )}
      </div>
    </th>
  )
}

function MetricCard({ label, value, isNegative }: { label: string; value: string; isNegative?: boolean }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg border border-border/20">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${isNegative ? 'text-red-500' : ''}`}>{value}</p>
    </div>
  )
}
