'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  LayoutGrid, Upload, BarChart3, GitCompare,
  Sparkles, TrendingUp, TrendingDown, Activity,
  Brain, Wifi
} from 'lucide-react'
import StrategyBuilder from './strategy-builder'
import AIStrategyBuilder from './ai-strategy-builder'
import BacktestImporter from './backtest-importer'
import ResultsViewer from './results-viewer'
import ComparisonView from './comparison-view'
import TradingViewConnector from './tradingview-connector'
import { BacktestResult } from '@/types'
import { loadDemoDataIfNeeded } from '@/lib/demo-data'

export default function Dashboard() {
  const [backtests, setBacktests] = useState<BacktestResult[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load backtests from localStorage
    const stored = localStorage.getItem('trading_backtests')
    let existingBacktests: BacktestResult[] = []
    if (stored) {
      existingBacktests = JSON.parse(stored)
    }

    // Load demo data on first visit
    const demoData = loadDemoDataIfNeeded()
    if (demoData) {
      existingBacktests = [...demoData, ...existingBacktests]
      localStorage.setItem('trading_backtests', JSON.stringify(existingBacktests))
    }

    setBacktests(existingBacktests)
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    // Save to localStorage whenever backtests change
    if (isLoaded) {
      localStorage.setItem('trading_backtests', JSON.stringify(backtests))
    }
  }, [backtests, isLoaded])

  const handleBacktestImported = (backtest: BacktestResult) => {
    setBacktests(prev => [...prev, backtest])
  }

  const handleDeleteBacktest = (id: string) => {
    setBacktests(prev => prev.filter(b => b.id !== id))
  }

  // Calculate summary stats
  const totalStrategies = backtests.length
  const avgReturn = backtests.length > 0
    ? backtests.reduce((sum, b) => sum + (b.metrics?.totalReturnPercent || 0), 0) / backtests.length
    : 0
  const bestStrategy = backtests.length > 0
    ? backtests.reduce((best, b) =>
        (b.metrics?.totalReturnPercent || 0) > (best.metrics?.totalReturnPercent || 0) ? b : best
      , backtests[0])
    : null

  return (
    <div className="min-h-screen bg-background">
      {/* Stats Overview */}
      <div className="border-b border-border/30 bg-gradient-to-b from-background to-muted/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
            <div className="metric-card group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Strategies</span>
                <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">{totalStrategies}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Analyzed</div>
            </div>

            <div className="metric-card group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Avg Return</span>
                <div className={`p-1.5 rounded-lg transition-colors ${avgReturn >= 0 ? 'bg-green-500/10 group-hover:bg-green-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`}>
                  {avgReturn >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                </div>
              </div>
              <div className={`text-2xl font-bold tracking-tight ${avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Average</div>
            </div>

            <div className="metric-card group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Best Strategy</span>
                <div className="p-1.5 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                </div>
              </div>
              <div className="text-base font-bold truncate tracking-tight">
                {bestStrategy?.strategyName || '-'}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {bestStrategy ? `${bestStrategy.metrics?.totalReturnPercent?.toFixed(1) || 0}% return` : 'No data'}
              </div>
            </div>

            <div className="metric-card group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Total Trades</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {backtests.reduce((sum, b) => sum + (b.trades?.length || 0), 0)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">Executed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="ai-builder" className="w-full">
          <div className="sticky top-16 z-40 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-lg border-b border-border/20 mb-6">
            <TabsList className="inline-flex h-auto p-1 bg-muted/40 rounded-xl flex-wrap gap-0.5 border border-border/30">
              <TabsTrigger value="ai-builder" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">AI Builder</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="builder" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Manual Builder</span>
                <span className="sm:hidden">Builder</span>
              </TabsTrigger>
              <TabsTrigger value="connector" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                <Wifi className="w-4 h-4" />
                <span className="hidden sm:inline">TradingView</span>
                <span className="sm:hidden">TV</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Results</span>
                {backtests.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary font-semibold">
                    {backtests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                <GitCompare className="w-4 h-4" />
                <span className="hidden sm:inline">Compare</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="animate-fade-in">
            <TabsContent value="ai-builder" className="mt-0">
              <AIStrategyBuilder />
            </TabsContent>

            <TabsContent value="builder" className="mt-0">
              <StrategyBuilder />
            </TabsContent>

            <TabsContent value="connector" className="mt-0">
              <TradingViewConnector onBacktestImported={handleBacktestImported} />
            </TabsContent>

            <TabsContent value="import" className="mt-0">
              <BacktestImporter onBacktestImported={handleBacktestImported} />
            </TabsContent>

            <TabsContent value="results" className="mt-0">
              <ResultsViewer backtests={backtests} onDelete={handleDeleteBacktest} />
            </TabsContent>

            <TabsContent value="compare" className="mt-0">
              <ComparisonView backtests={backtests} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
