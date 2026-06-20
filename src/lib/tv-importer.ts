import { BacktestResult, Trade, EquityPoint } from '@/types'
import { generateId, parseCSVLine } from './utils'
import { calculateMetrics } from './metrics-calculator'

interface TradingViewTrade {
  type: string
  date: string
  price: number
  contracts: number
  profit: number
  cumProfit: number
  drawdown: number
}

/**
 * Import TradingView CSV export and convert to BacktestResult
 */
export function importTradingViewCSV(
  csvContent: string,
  strategyName: string,
  initialCapital: number = 10000
): BacktestResult | null {
  try {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows')
    }

    // Parse header to find column indices
    const header = parseCSVLine(lines[0])
    const columnIndices = findColumnIndices(header)

    // Parse trades
    const trades: Trade[] = []
    const tvTrades: TradingViewTrade[] = []
    let currentTrade: Partial<TradingViewTrade> | null = null

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length < header.length) continue

      const row: Record<string, string> = {}
      header.forEach((col, idx) => {
        row[col.toLowerCase().trim()] = values[idx]
      })

      // Determine trade type (entry or exit)
      const type = row[columnIndices.type]?.toLowerCase() || ''
      const isEntry = type.includes('entry') || type.includes('buy') || type.includes('long')
      const isExit = type.includes('exit') || type.includes('sell') || type.includes('short')

      const tradeData: TradingViewTrade = {
        type: row[columnIndices.type] || '',
        date: row[columnIndices.date] || row['time'] || '',
        price: parseFloat(row[columnIndices.price] || row['price'] || '0'),
        contracts: parseFloat(row[columnIndices.contracts] || row['qty'] || row['quantity'] || '1'),
        profit: parseFloat(row[columnIndices.profit] || row['pnl'] || '0'),
        cumProfit: parseFloat(row[columnIndices.cumProfit] || row['cum. profit'] || row['cumulative'] || '0'),
        drawdown: parseFloat(row[columnIndices.drawdown] || row['dd'] || '0'),
      }

      tvTrades.push(tradeData)
    }

    // Process trades into pairs (entry + exit)
    const processedTrades = processTradingViewTrades(tvTrades, initialCapital)
    
    // Generate equity curve
    const equityCurve = generateEquityCurve(tvTrades, initialCapital)

    // Calculate metrics
    const metrics = calculateMetrics(processedTrades, initialCapital, equityCurve)

    // Determine symbol and timeframe from data or defaults
    const symbol = detectSymbol(csvContent) || 'UNKNOWN'
    const timeframe = detectTimeframe(csvContent) || '1D'

    const backtest: BacktestResult = {
      id: generateId(),
      strategyName,
      symbol,
      timeframe,
      initialCapital,
      finalCapital: initialCapital + metrics.totalReturn,
      trades: processedTrades,
      metrics,
      equityCurve,
      createdAt: new Date().toISOString(),
    }

    return backtest
  } catch (error) {
    console.error('Error importing TradingView CSV:', error)
    return null
  }
}

function findColumnIndices(header: string[]): Record<string, string> {
  const mapping: Record<string, string> = {
    type: '',
    date: '',
    price: '',
    contracts: '',
    profit: '',
    cumProfit: '',
    drawdown: '',
  }

  header.forEach((col, idx) => {
    const colLower = col.toLowerCase().trim()
    
    if (colLower.includes('type') || colLower.includes('action')) {
      mapping.type = colLower
    } else if (colLower.includes('date') || colLower.includes('time')) {
      mapping.date = colLower
    } else if (colLower.includes('price') || colLower.includes('avg price')) {
      mapping.price = colLower
    } else if (colLower.includes('contract') || colLower.includes('qty') || colLower.includes('quantity')) {
      mapping.contracts = colLower
    } else if (colLower.includes('profit') && !colLower.includes('cum')) {
      mapping.profit = colLower
    } else if (colLower.includes('cum') && colLower.includes('profit')) {
      mapping.cumProfit = colLower
    } else if (colLower.includes('drawdown') || colLower.includes('dd')) {
      mapping.drawdown = colLower
    }
  })

  return mapping
}

function processTradingViewTrades(tvTrades: TradingViewTrade[], initialCapital: number): Trade[] {
  const trades: Trade[] = []
  let runningCapital = initialCapital

  for (let i = 0; i < tvTrades.length - 1; i += 2) {
    const entry = tvTrades[i]
    const exit = tvTrades[i + 1]

    if (!entry || !exit) continue

    const pnl = exit.profit
    runningCapital += pnl

    const trade: Trade = {
      id: generateId(),
      strategyId: '',
      symbol: '',
      type: entry.type.toLowerCase().includes('short') ? 'short' : 'long',
      entryPrice: entry.price,
      exitPrice: exit.price,
      entryTime: entry.date,
      exitTime: exit.date,
      quantity: entry.contracts,
      pnl,
      pnlPercent: (pnl / runningCapital) * 100,
      commission: 0,
      fees: 0,
    }

    trades.push(trade)
  }

  return trades
}

function generateEquityCurve(tvTrades: TradingViewTrade[], initialCapital: number): EquityPoint[] {
  const curve: EquityPoint[] = []
  let capital = initialCapital
  let peak = initialCapital

  // Create equity points from cumulative profit data
  tvTrades.forEach((trade, index) => {
    if (trade.cumProfit !== undefined && trade.date) {
      capital = initialCapital + trade.cumProfit
      peak = Math.max(peak, capital)
      const drawdown = peak - capital

      curve.push({
        date: trade.date,
        value: capital,
        drawdown: drawdown,
      })
    }
  })

  // If no cumulative profit data, generate from individual trades
  if (curve.length === 0) {
    capital = initialCapital
    peak = initialCapital
    let cumulativePnL = 0

    tvTrades.forEach(trade => {
      cumulativePnL += trade.profit
      capital = initialCapital + cumulativePnL
      peak = Math.max(peak, capital)
      const drawdown = peak - capital

      curve.push({
        date: trade.date,
        value: capital,
        drawdown,
      })
    })
  }

  return curve
}

function detectSymbol(content: string): string | null {
  // Try to find symbol in header or first few lines
  const symbolPatterns = [
    /symbol[:\s]+([A-Z]+)/i,
    /ticker[:\s]+([A-Z]+)/i,
    /\b([A-Z]{1,5})\b/,
  ]

  for (const pattern of symbolPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

function detectTimeframe(content: string): string | null {
  // Try to detect timeframe from content
  const timeframePatterns = [
    /timeframe[:\s]+(\d+[mhdwM])/i,
    /interval[:\s]+(\d+[mhdwM])/i,
  ]

  for (const pattern of timeframePatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return '1D'
}

/**
 * Validate CSV content before import
 */
export function validateCSV(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const lines = content.trim().split('\n')

  if (lines.length < 2) {
    errors.push('CSV must have at least a header and one data row')
    return { valid: false, errors }
  }

  const header = parseCSVLine(lines[0])
  const requiredColumns = ['type', 'date', 'price']
  const headerLower = header.map(h => h.toLowerCase())

  for (const col of requiredColumns) {
    if (!headerLower.some(h => h.includes(col))) {
      errors.push(`Missing required column: ${col}`)
    }
  }

  // Check if at least some numeric data exists
  let hasNumericData = false
  for (let i = 1; i < Math.min(lines.length, 5); i++) {
    const values = parseCSVLine(lines[i])
    if (values.some(v => !isNaN(parseFloat(v)))) {
      hasNumericData = true
      break
    }
  }

  if (!hasNumericData) {
    errors.push('No numeric data found in CSV')
  }

  return { valid: errors.length === 0, errors }
}
