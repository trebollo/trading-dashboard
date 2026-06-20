import { Trade, Metrics, EquityPoint } from '@/types'
import { roundTo } from './utils'

/**
 * Calculate comprehensive metrics from trades and equity curve
 */
export function calculateMetrics(
  trades: Trade[],
  initialCapital: number,
  equityCurve: EquityPoint[]
): Metrics {
  if (trades.length === 0) {
    return getEmptyMetrics()
  }

  const winningTrades = trades.filter(t => t.pnl > 0)
  const losingTrades = trades.filter(t => t.pnl < 0)
  const breakevenTrades = trades.filter(t => t.pnl === 0)

  // Calculate basic stats
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0)
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))

  // Returns
  const finalCapital = initialCapital + totalPnL
  const totalReturnPercent = (totalPnL / initialCapital) * 100

  // Win/Loss rates
  const winRate = (winningTrades.length / trades.length) * 100
  const lossRate = (losingTrades.length / trades.length) * 100

  // Average trade values
  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0
  const avgTrade = totalPnL / trades.length

  // Largest win/loss
  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0

  // Profit Factor
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0

  // Risk/Reward Ratio
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0

  // Expectancy
  const expectancy = (winRate / 100 * avgWin) - (lossRate / 100 * avgLoss)

  // Kelly Criterion
  const kellyPercent = calculateKellyPercent(winRate / 100, avgWin, avgLoss)

  // Consecutive wins/losses
  const { maxWins, maxLosses } = calculateMaxConsecutive(trades)

  // Duration calculations
  const durations = trades.map(t => {
    const entry = new Date(t.entryTime).getTime()
    const exit = new Date(t.exitTime).getTime()
    return (exit - entry) / (1000 * 60) // in minutes
  })

  const avgTradeDuration = durations.reduce((a, b) => a + b, 0) / durations.length
  const winDurations = winningTrades.map(t => {
    const entry = new Date(t.entryTime).getTime()
    const exit = new Date(t.exitTime).getTime()
    return (exit - entry) / (1000 * 60)
  })
  const lossDurations = losingTrades.map(t => {
    const entry = new Date(t.entryTime).getTime()
    const exit = new Date(t.exitTime).getTime()
    return (exit - entry) / (1000 * 60)
  })

  // Drawdown calculations
  const { maxDrawdown, maxDrawdownPercent, avgDrawdown } = calculateDrawdowns(equityCurve)

  // Volatility
  const volatility = calculateVolatility(equityCurve)
  const downsideDeviation = calculateDownsideDeviation(equityCurve, initialCapital)

  // Risk-adjusted metrics
  const sharpeRatio = calculateSharpeRatio(totalReturnPercent, volatility, trades.length)
  const sortinoRatio = calculateSortinoRatio(totalReturnPercent, downsideDeviation, trades.length)
  const calmarRatio = maxDrawdownPercent > 0 ? totalReturnPercent / maxDrawdownPercent : 0
  const sterlingRatio = calculateSterlingRatio(totalReturnPercent, equityCurve)
  const burkeRatio = calculateBurkeRatio(totalReturnPercent, equityCurve)

  // CAGR
  const cagr = calculateCAGR(initialCapital, finalCapital, trades)

  // Time-based metrics
  const { bestMonth, worstMonth, bestDay, worstDay, avgMonthlyTrades, avgDailyTrades, avgAnnualReturn, monthlyReturn, dailyReturn } = 
    calculateTimeBasedMetrics(trades, totalPnL)

  return {
    // Returns
    totalReturn: totalPnL,
    totalReturnPercent,
    cagr,
    avgAnnualReturn,
    monthlyReturn,
    dailyReturn,

    // Risk
    maxDrawdown,
    maxDrawdownPercent,
    avgDrawdown,
    volatility,
    downsideDeviation,

    // Risk-Adjusted
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    sterlingRatio,
    burkeRatio,

    // Trade Statistics
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    lossRate,
    avgWin,
    avgLoss,
    avgTrade,
    largestWin,
    largestLoss,
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,

    // Profitability
    profitFactor,
    payoffRatio: riskRewardRatio,
    riskRewardRatio,
    expectancy,
    kellyPercent,

    // Duration
    avgTradeDuration,
    avgWinDuration: winDurations.length > 0 ? winDurations.reduce((a, b) => a + b, 0) / winDurations.length : 0,
    avgLossDuration: lossDurations.length > 0 ? lossDurations.reduce((a, b) => a + b, 0) / lossDurations.length : 0,
    minTradeDuration: Math.min(...durations),
    maxTradeDuration: Math.max(...durations),

    // Performance
    bestMonth,
    worstMonth,
    bestDay,
    worstDay,
    avgMonthlyTrades,
    avgDailyTrades,
  }
}

function getEmptyMetrics(): Metrics {
  return {
    totalReturn: 0,
    totalReturnPercent: 0,
    cagr: 0,
    avgAnnualReturn: 0,
    monthlyReturn: 0,
    dailyReturn: 0,
    maxDrawdown: 0,
    maxDrawdownPercent: 0,
    avgDrawdown: 0,
    volatility: 0,
    downsideDeviation: 0,
    sharpeRatio: 0,
    sortinoRatio: 0,
    calmarRatio: 0,
    sterlingRatio: 0,
    burkeRatio: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    lossRate: 0,
    avgWin: 0,
    avgLoss: 0,
    avgTrade: 0,
    largestWin: 0,
    largestLoss: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    profitFactor: 0,
    payoffRatio: 0,
    riskRewardRatio: 0,
    expectancy: 0,
    kellyPercent: 0,
    avgTradeDuration: 0,
    avgWinDuration: 0,
    avgLossDuration: 0,
    minTradeDuration: 0,
    maxTradeDuration: 0,
    bestMonth: 0,
    worstMonth: 0,
    bestDay: 0,
    worstDay: 0,
    avgMonthlyTrades: 0,
    avgDailyTrades: 0,
  }
}

function calculateKellyPercent(winRate: number, avgWin: number, avgLoss: number): number {
  if (avgLoss === 0) return 0
  const kelly = winRate - ((1 - winRate) / (avgWin / avgLoss))
  return roundTo(kelly * 100, 2)
}

function calculateMaxConsecutive(trades: Trade[]): { maxWins: number; maxLosses: number } {
  let maxWins = 0
  let maxLosses = 0
  let currentWins = 0
  let currentLosses = 0

  trades.forEach(trade => {
    if (trade.pnl > 0) {
      currentWins++
      currentLosses = 0
      maxWins = Math.max(maxWins, currentWins)
    } else if (trade.pnl < 0) {
      currentLosses++
      currentWins = 0
      maxLosses = Math.max(maxLosses, currentLosses)
    }
  })

  return { maxWins, maxLosses }
}

function calculateDrawdowns(equityCurve: EquityPoint[]): {
  maxDrawdown: number
  maxDrawdownPercent: number
  avgDrawdown: number
} {
  if (equityCurve.length === 0) {
    return { maxDrawdown: 0, maxDrawdownPercent: 0, avgDrawdown: 0 }
  }

  let peak = equityCurve[0].value
  let maxDrawdown = 0
  let maxDrawdownPercent = 0
  const drawdowns: number[] = []

  equityCurve.forEach(point => {
    if (point.value > peak) {
      peak = point.value
    }
    const drawdown = peak - point.value
    const drawdownPercent = (drawdown / peak) * 100
    drawdowns.push(drawdown)
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
      maxDrawdownPercent = drawdownPercent
    }
  })

  const avgDrawdown = drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length

  return { maxDrawdown, maxDrawdownPercent, avgDrawdown }
}

function calculateVolatility(equityCurve: EquityPoint[]): number {
  if (equityCurve.length < 2) return 0

  const returns: number[] = []
  for (let i = 1; i < equityCurve.length; i++) {
    const returnVal = (equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value
    returns.push(returnVal)
  }

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  return Math.sqrt(variance) * Math.sqrt(252) // Annualized
}

function calculateDownsideDeviation(equityCurve: EquityPoint[], targetReturn: number): number {
  if (equityCurve.length < 2) return 0

  const returns: number[] = []
  for (let i = 1; i < equityCurve.length; i++) {
    const returnVal = (equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value
    returns.push(returnVal)
  }

  const negativeReturns = returns.filter(r => r < targetReturn)
  if (negativeReturns.length === 0) return 0

  const variance = negativeReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn, 2), 0) / negativeReturns.length
  return Math.sqrt(variance) * Math.sqrt(252)
}

function calculateSharpeRatio(returnPercent: number, volatility: number, numTrades: number): number {
  if (volatility === 0 || numTrades < 2) return 0
  const riskFreeRate = 0.02 // 2% annual risk-free rate
  const excessReturn = returnPercent - riskFreeRate
  return excessReturn / (volatility * 100)
}

function calculateSortinoRatio(returnPercent: number, downsideDeviation: number, numTrades: number): number {
  if (downsideDeviation === 0 || numTrades < 2) return 0
  const riskFreeRate = 0.02
  const excessReturn = returnPercent - riskFreeRate
  return excessReturn / (downsideDeviation * 100)
}

function calculateSterlingRatio(returnPercent: number, equityCurve: EquityPoint[]): number {
  if (equityCurve.length === 0) return 0
  
  // Calculate average of largest 5 drawdowns
  const drawdowns = equityCurve.map(p => p.drawdown).sort((a, b) => b - a)
  const topDrawdowns = drawdowns.slice(0, 5)
  const avgTopDrawdown = topDrawdowns.reduce((a, b) => a + b, 0) / topDrawdowns.length
  
  if (avgTopDrawdown === 0) return 0
  return returnPercent / avgTopDrawdown
}

function calculateBurkeRatio(returnPercent: number, equityCurve: EquityPoint[]): number {
  if (equityCurve.length === 0) return 0
  
  const drawdownsSquared = equityCurve.reduce((sum, p) => sum + Math.pow(p.drawdown, 2), 0)
  const drawdownRM = Math.sqrt(drawdownsSquared / equityCurve.length)
  
  if (drawdownRM === 0) return 0
  return returnPercent / drawdownRM
}

function calculateCAGR(initialCapital: number, finalCapital: number, trades: Trade[]): number {
  if (trades.length < 2) return 0
  
  const startDate = new Date(trades[0].entryTime)
  const endDate = new Date(trades[trades.length - 1].exitTime)
  const years = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  
  if (years <= 0) return 0
  
  return (Math.pow(finalCapital / initialCapital, 1 / years) - 1) * 100
}

function calculateTimeBasedMetrics(trades: Trade[], totalPnL: number): {
  bestMonth: number
  worstMonth: number
  bestDay: number
  worstDay: number
  avgMonthlyTrades: number
  avgDailyTrades: number
  avgAnnualReturn: number
  monthlyReturn: number
  dailyReturn: number
} {
  // Group trades by month and day
  const monthlyPnL: Record<string, number> = {}
  const dailyPnL: Record<string, number> = {}
  
  trades.forEach(trade => {
    const date = new Date(trade.exitTime)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const dayKey = date.toISOString().split('T')[0]
    
    monthlyPnL[monthKey] = (monthlyPnL[monthKey] || 0) + trade.pnl
    dailyPnL[dayKey] = (dailyPnL[dayKey] || 0) + trade.pnl
  })

  const monthlyValues = Object.values(monthlyPnL)
  const dailyValues = Object.values(dailyPnL)

  const bestMonth = monthlyValues.length > 0 ? Math.max(...monthlyValues) : 0
  const worstMonth = monthlyValues.length > 0 ? Math.min(...monthlyValues) : 0
  const bestDay = dailyValues.length > 0 ? Math.max(...dailyValues) : 0
  const worstDay = dailyValues.length > 0 ? Math.min(...dailyValues) : 0

  // Calculate averages
  const totalDays = Object.keys(dailyPnL).length
  const totalMonths = Object.keys(monthlyPnL).length

  return {
    bestMonth,
    worstMonth,
    bestDay,
    worstDay,
    avgMonthlyTrades: totalMonths > 0 ? trades.length / totalMonths : 0,
    avgDailyTrades: totalDays > 0 ? trades.length / totalDays : 0,
    avgAnnualReturn: totalPnL,
    monthlyReturn: totalMonths > 0 ? totalPnL / totalMonths : 0,
    dailyReturn: totalDays > 0 ? totalPnL / totalDays : 0,
  }
}
