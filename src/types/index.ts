// Strategy Types
export interface Strategy {
  id: string
  name: string
  symbol: string
  timeframe: string
  description?: string
  indicators: Indicator[]
  stopLoss?: number
  takeProfit?: number
  riskPerTrade?: number
  createdAt: string
  updatedAt: string
}

export interface Indicator {
  id: string
  type: IndicatorType
  parameters: Record<string, number | string | boolean>
}

export type IndicatorType =
  | 'sma'
  | 'ema'
  | 'rsi'
  | 'macd'
  | 'bollinger'
  | 'atr'
  | 'stochastic'
  | 'adx'
  | 'vwap'
  | 'volume'
  | 'supertrend'

// Trade Types
export interface Trade {
  id: string
  strategyId: string
  symbol: string
  type: 'long' | 'short'
  entryPrice: number
  exitPrice: number
  entryTime: string
  exitTime: string
  quantity: number
  pnl: number
  pnlPercent: number
  commission: number
  fees: number
}

// Backtest Types
export interface BacktestResult {
  id: string
  strategyName: string
  strategyId?: string
  symbol: string
  timeframe: string
  initialCapital: number
  finalCapital: number
  trades: Trade[]
  metrics: Metrics
  equityCurve: EquityPoint[]
  createdAt: string
}

export interface EquityPoint {
  date: string
  value: number
  drawdown: number
}

// Metrics Types
export interface Metrics {
  // Returns
  totalReturn: number
  totalReturnPercent: number
  cagr: number
  avgAnnualReturn: number
  monthlyReturn: number
  dailyReturn: number

  // Risk
  maxDrawdown: number
  maxDrawdownPercent: number
  avgDrawdown: number
  volatility: number
  downsideDeviation: number

  // Risk-Adjusted
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  sterlingRatio: number
  burkeRatio: number

  // Trade Statistics
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  lossRate: number
  avgWin: number
  avgLoss: number
  avgTrade: number
  largestWin: number
  largestLoss: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number

  // Profitability
  profitFactor: number
  payoffRatio: number
  riskRewardRatio: number
  expectancy: number
  kellyPercent: number

  // Duration
  avgTradeDuration: number
  avgWinDuration: number
  avgLossDuration: number
  minTradeDuration: number
  maxTradeDuration: number

  // Performance
  bestMonth: number
  worstMonth: number
  bestDay: number
  worstDay: number
  avgMonthlyTrades: number
  avgDailyTrades: number
}

// Analysis Types
export interface StrategyAnalysis {
  score: number
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  strengths: string[]
  weaknesses: string[]
  recommendations: Recommendation[]
  warnings: Warning[]
}

export interface Recommendation {
  type: 'risk' | 'performance' | 'consistency' | 'optimization'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionable: string
}

export interface Warning {
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  suggestion: string
}

// Futures Contracts
export const FUTURES_CONTRACTS = [
  { symbol: 'MNQ', name: 'Micro E-mini Nasdaq-100', multiplier: 2, tickSize: 0.25 },
  { symbol: 'MES', name: 'Micro E-mini S&P 500', multiplier: 5, tickSize: 0.25 },
  { symbol: 'MYM', name: 'Micro E-mini Dow Jones', multiplier: 0.5, tickSize: 1 },
  { symbol: 'M2K', name: 'Micro E-mini Russell 2000', multiplier: 10, tickSize: 0.1 },
  { symbol: 'NQ', name: 'E-mini Nasdaq-100', multiplier: 20, tickSize: 0.25 },
  { symbol: 'ES', name: 'E-mini S&P 500', multiplier: 50, tickSize: 0.25 },
  { symbol: 'YM', name: 'E-mini Dow Jones', multiplier: 5, tickSize: 1 },
  { symbol: 'RTY', name: 'E-mini Russell 2000', multiplier: 50, tickSize: 0.1 },
] as const

export type FuturesContract = typeof FUTURES_CONTRACTS[number]
