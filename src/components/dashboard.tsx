'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { 
  LayoutGrid, Upload, BarChart3, GitCompare, 
  Sparkles, TrendingUp, TrendingDown, Activity
} from 'lucide-react'
import StrategyBuilder from './strategy-builder'
import BacktestImporter from './backtest-importer'
import ResultsViewer from './results-viewer'
import ComparisonView from './comparison-view'
import { BacktestResult } from '@/types'

export default function Dashboard() {
  const [backtests, setBacktests] = useState<BacktestResult[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load backtests from localStorage
    const stored = localStorage.getItem('trading_backtests')
    if (stored) {
      setBacktests(JSON.parse(stored))
    }
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
      {/* Hero Section */}
      <div className="border-b border-border/40 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Strategies</span>
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold">{totalStrategies}</div>
              <div className="text-xs text-muted-foreground mt-1">Analyzed</div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Avg Return</span>
                {avgReturn >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className={`text-2xl font-bold ${avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Average</div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Best Strategy</span>
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-lg font-bold truncate">
                {bestStrategy?.strategyName || '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {bestStrategy ? `${bestStrategy.metrics?.totalReturnPercent?.toFixed(1) || 0}% return` : 'No data'}
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Trades</span>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">
                {backtests.reduce((sum, b) => sum + (b.trades?.length || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Executed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl mb-6">
            <TabsTrigger value="builder" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Strategy Builder</span>
              <span className="sm:hidden">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import Results</span>
              <span className="sm:hidden">Import</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Results</span>
              {backtests.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                  {backtests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
              <GitCompare className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
              <span className="sm:hidden">Compare</span>
            </TabsTrigger>
          </TabsList>

          <div className="animate-fade-in">
            <TabsContent value="builder" className="mt-0">
              <StrategyBuilder />
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
