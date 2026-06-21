import { BacktestResult, Trade, EquityPoint, Metrics } from '@/types'
import { calculateMetrics } from './metrics-calculator'
import { generateId } from './utils'

const DEMO_DATA_KEY = 'trading_demo_loaded'

/**
 * Generate realistic trade data for a given strategy profile
 */
function generateTrades(
  strategyId: string,
  symbol: string,
  numTrades: number,
  winRate: number,
  avgWinAmount: number,
  avgLossAmount: number,
  startDate: Date,
  avgDurationMinutes: number
): Trade[] {
  const trades: Trade[] = []
  let currentDate = new Date(startDate)

  for (let i = 0; i < numTrades; i++) {
    const isWin = Math.random() < winRate
    const isLong = Math.random() > 0.4 // slight long bias

    // Add some variability
    const winVariance = 0.3 + Math.random() * 1.4 // 0.3x to 1.7x
    const lossVariance = 0.4 + Math.random() * 1.2 // 0.4x to 1.6x

    const pnl = isWin
      ? avgWinAmount * winVariance
      : -(avgLossAmount * lossVariance)

    const entryPrice = getBasePrice(symbol) * (1 + (Math.random() - 0.5) * 0.02)
    const pnlPercent = (pnl / (entryPrice * getMultiplier(symbol))) * 100
    const exitPrice = isLong
      ? entryPrice * (1 + pnlPercent / 100)
      : entryPrice * (1 - pnlPercent / 100)

    // Duration variance
    const duration = avgDurationMinutes * (0.3 + Math.random() * 2)
    const entryTime = new Date(currentDate)
    const exitTime = new Date(currentDate.getTime() + duration * 60 * 1000)

    trades.push({
      id: generateId() + '-' + i,
      strategyId,
      symbol,
      type: isLong ? 'long' : 'short',
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: Math.round(exitPrice * 100) / 100,
      entryTime: entryTime.toISOString(),
      exitTime: exitTime.toISOString(),
      quantity: 1,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 100) / 100,
      commission: 2.5,
      fees: 1.5,
    })

    // Gap between trades (1-8 hours)
    const gap = (1 + Math.random() * 7) * 60 * 60 * 1000
    currentDate = new Date(exitTime.getTime() + gap)
  }

  return trades
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    MNQ: 18500,
    MES: 5200,
    MYM: 38800,
    M2K: 2050,
    NQ: 18500,
    ES: 5200,
    YM: 38800,
    RTY: 2050,
  }
  return prices[symbol] || 5000
}

function getMultiplier(symbol: string): number {
  const multipliers: Record<string, number> = {
    MNQ: 2,
    MES: 5,
    MYM: 0.5,
    M2K: 10,
    NQ: 20,
    ES: 50,
    YM: 5,
    RTY: 50,
  }
  return multipliers[symbol] || 1
}

/**
 * Generate equity curve from trades
 */
function generateEquityCurve(trades: Trade[], initialCapital: number): EquityPoint[] {
  const curve: EquityPoint[] = []
  let equity = initialCapital
  let peak = initialCapital

  // Start point
  curve.push({
    date: trades[0]?.entryTime || new Date().toISOString(),
    value: initialCapital,
    drawdown: 0,
  })

  for (const trade of trades) {
    equity += trade.pnl
    peak = Math.max(peak, equity)
    const drawdown = ((peak - equity) / peak) * 100

    curve.push({
      date: trade.exitTime,
      value: Math.round(equity * 100) / 100,
      drawdown: Math.round(drawdown * 100) / 100,
    })
  }

  return curve
}

/**
 * Create a demo backtest result
 */
function createDemoBacktest(
  name: string,
  symbol: string,
  timeframe: string,
  initialCapital: number,
  numTrades: number,
  winRate: number,
  avgWin: number,
  avgLoss: number,
  startDate: Date,
  avgDurationMinutes: number
): BacktestResult {
  const id = generateId()
  const trades = generateTrades(
    id, symbol, numTrades, winRate, avgWin, avgLoss, startDate, avgDurationMinutes
  )
  const equityCurve = generateEquityCurve(trades, initialCapital)
  const finalCapital = equityCurve[equityCurve.length - 1]?.value || initialCapital
  const metrics = calculateMetrics(trades, initialCapital, equityCurve)

  return {
    id,
    strategyName: name,
    strategyId: id,
    symbol,
    timeframe,
    initialCapital,
    finalCapital,
    trades,
    metrics,
    equityCurve,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Generate all demo backtest data
 */
export function generateDemoData(): BacktestResult[] {
  const backtests: BacktestResult[] = []

  // Strategy 1: Profitable momentum strategy - MNQ 5m
  backtests.push(createDemoBacktest(
    'Momentum Scalper MNQ',
    'MNQ',
    '5m',
    25000,
    120,
    0.62,
    85,
    55,
    new Date('2024-01-15'),
    25
  ))

  // Strategy 2: High win rate mean reversion - MES 15m
  backtests.push(createDemoBacktest(
    'Mean Reversion MES',
    'MES',
    '15m',
    50000,
    95,
    0.72,
    120,
    180,
    new Date('2024-02-01'),
    45
  ))

  // Strategy 3: Breakout strategy (mixed results) - NQ 1h
  backtests.push(createDemoBacktest(
    'Breakout Hunter NQ',
    'NQ',
    '1h',
    100000,
    68,
    0.45,
    450,
    200,
    new Date('2024-01-20'),
    120
  ))

  // Strategy 4: Losing strategy for contrast - M2K 5m
  backtests.push(createDemoBacktest(
    'Scalper Aggressive M2K',
    'M2K',
    '5m',
    15000,
    150,
    0.38,
    45,
    65,
    new Date('2024-03-01'),
    15
  ))

  // Strategy 5: Trend following (moderate, consistent) - ES 4h
  backtests.push(createDemoBacktest(
    'Trend Follower ES',
    'ES',
    '4h',
    75000,
    55,
    0.55,
    650,
    350,
    new Date('2024-01-05'),
    480
  ))

  return backtests
}

/**
 * Check if demo data has already been loaded
 */
export function isDemoDataLoaded(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(DEMO_DATA_KEY) === 'true'
}

/**
 * Mark demo data as loaded
 */
export function markDemoDataLoaded(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_DATA_KEY, 'true')
}

/**
 * Load demo data into the app if not already loaded
 * Returns the demo backtests or null if already loaded
 */
export function loadDemoDataIfNeeded(): BacktestResult[] | null {
  if (isDemoDataLoaded()) return null

  const demoData = generateDemoData()
  markDemoDataLoaded()
  return demoData
}
