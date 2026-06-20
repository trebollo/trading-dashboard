import { Strategy, BacktestResult } from '@/types'

const STRATEGIES_KEY = 'trebollo-strategies'
const BACKTESTS_KEY = 'trebollo-backtests'

// Strategy Storage
export const StrategyStorage = {
  getAll(): Strategy[] {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STRATEGIES_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading strategies from storage:', error)
      return []
    }
  },

  save(strategy: Strategy): void {
    if (typeof window === 'undefined') return
    try {
      const strategies = this.getAll()
      const index = strategies.findIndex(s => s.id === strategy.id)
      
      if (index >= 0) {
        strategies[index] = { ...strategy, updatedAt: new Date().toISOString() }
      } else {
        strategies.push({
          ...strategy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      
      localStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies))
    } catch (error) {
      console.error('Error saving strategy to storage:', error)
    }
  },

  delete(id: string): void {
    if (typeof window === 'undefined') return
    try {
      const strategies = this.getAll()
      const filtered = strategies.filter(s => s.id !== id)
      localStorage.setItem(STRATEGIES_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error deleting strategy from storage:', error)
    }
  },

  getById(id: string): Strategy | undefined {
    const strategies = this.getAll()
    return strategies.find(s => s.id === id)
  },
}

// Backtest Storage
export const BacktestStorage = {
  getAll(): BacktestResult[] {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(BACKTESTS_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading backtests from storage:', error)
      return []
    }
  },

  save(backtest: BacktestResult): void {
    if (typeof window === 'undefined') return
    try {
      const backtests = this.getAll()
      const index = backtests.findIndex(b => b.id === backtest.id)
      
      if (index >= 0) {
        backtests[index] = backtest
      } else {
        backtests.push({
          ...backtest,
          createdAt: new Date().toISOString(),
        })
      }
      
      localStorage.setItem(BACKTESTS_KEY, JSON.stringify(backtests))
    } catch (error) {
      console.error('Error saving backtest to storage:', error)
    }
  },

  delete(id: string): void {
    if (typeof window === 'undefined') return
    try {
      const backtests = this.getAll()
      const filtered = backtests.filter(b => b.id !== id)
      localStorage.setItem(BACKTESTS_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error deleting backtest from storage:', error)
    }
  },

  getById(id: string): BacktestResult | undefined {
    const backtests = this.getAll()
    return backtests.find(b => b.id === id)
  },

  getByStrategyId(strategyId: string): BacktestResult[] {
    const backtests = this.getAll()
    return backtests.filter(b => b.strategyId === strategyId)
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(BACKTESTS_KEY)
  },
}

// Export all data
export function exportAllData(): string {
  const data = {
    strategies: StrategyStorage.getAll(),
    backtests: BacktestStorage.getAll(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

// Import all data
export function importAllData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData)
    
    if (data.strategies) {
      localStorage.setItem(STRATEGIES_KEY, JSON.stringify(data.strategies))
    }
    
    if (data.backtests) {
      localStorage.setItem(BACKTESTS_KEY, JSON.stringify(data.backtests))
    }
    
    return true
  } catch (error) {
    console.error('Error importing data:', error)
    return false
  }
}
