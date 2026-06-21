'use client'

import { useState, useEffect } from 'react'
import { Sidebar, NavSection } from './sidebar'
import { DashboardHome } from './dashboard-home'
import StrategyBuilder from './strategy-builder'
import AIStrategyBuilder from './ai-strategy-builder'
import BacktestImporter from './backtest-importer'
import ResultsViewer from './results-viewer'
import ComparisonView from './comparison-view'
import TradingViewConnector from './tradingview-connector'
import { BacktestResult } from '@/types'
import { loadDemoDataIfNeeded } from '@/lib/demo-data'

const ACTIVE_SECTION_KEY = 'dashboard_active_section'

export default function Dashboard() {
  const [backtests, setBacktests] = useState<BacktestResult[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeSection, setActiveSection] = useState<NavSection>('home')

  useEffect(() => {
    // Restore last active section
    const stored = localStorage.getItem(ACTIVE_SECTION_KEY)
    if (stored) {
      setActiveSection(stored as NavSection)
    }

    // Load backtests from localStorage
    const backtestData = localStorage.getItem('trading_backtests')
    let existingBacktests: BacktestResult[] = []
    if (backtestData) {
      existingBacktests = JSON.parse(backtestData)
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

  const handleSectionChange = (section: NavSection) => {
    setActiveSection(section)
    localStorage.setItem(ACTIVE_SECTION_KEY, section)
  }

  const handleBacktestImported = (backtest: BacktestResult) => {
    setBacktests(prev => [...prev, backtest])
  }

  const handleDeleteBacktest = (id: string) => {
    setBacktests(prev => prev.filter(b => b.id !== id))
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <DashboardHome backtests={backtests} />
      case 'ai-builder':
        return <AIStrategyBuilder />
      case 'builder':
        return <StrategyBuilder />
      case 'connector':
        return <TradingViewConnector onBacktestImported={handleBacktestImported} />
      case 'import':
        return <BacktestImporter onBacktestImported={handleBacktestImported} />
      case 'results':
        return <ResultsViewer backtests={backtests} onDelete={handleDeleteBacktest} />
      case 'compare':
        return <ComparisonView backtests={backtests} />
      default:
        return <DashboardHome backtests={backtests} />
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        backtestCount={backtests.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
