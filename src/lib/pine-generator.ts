import { Strategy, Indicator, IndicatorType } from '@/types'
import { generateId } from './utils'

const INDICATOR_TEMPLATES: Record<IndicatorType, (params: Record<string, number | string | boolean>) => string> = {
  sma: (params) => `sma(close, ${params.period || 20})`,
  ema: (params) => `ema(close, ${params.period || 20})`,
  rsi: (params) => `rsi(close, ${params.period || 14})`,
  macd: (params) => {
    const fast = params.fastPeriod || 12
    const slow = params.slowPeriod || 26
    const signal = params.signalPeriod || 9
    return `[request.macd(close, ${fast}, ${slow}, ${signal})]`
  },
  bollinger: (params) => {
    const period = params.period || 20
    const std = params.stdDev || 2
    return `[ta.bb(close, ${period}, ${std})]`
  },
  atr: (params) => `ta.atr(${params.period || 14})`,
  stochastic: (params) => {
    const k = params.kPeriod || 14
    const d = params.dPeriod || 3
    return `[ta.stoch(close, high, low, ${k}, ${d})]`
  },
  adx: (params) => `ta.adx(${params.period || 14})`,
  vwap: () => `ta.vwap(hlc3)`,
  volume: () => `volume`,
  supertrend: (params) => {
    const factor = params.factor || 3
    const period = params.atrPeriod || 10
    return `[ta.supertrend(${factor}, ${period})]`
  },
}

const INDICATOR_VARIABLES: Record<IndicatorType, string[]> = {
  sma: ['sma'],
  ema: ['ema'],
  rsi: ['rsi'],
  macd: ['macdLine', 'signalLine', 'histogram'],
  bollinger: ['middle', 'upper', 'lower'],
  atr: ['atr'],
  stochastic: ['k', 'd'],
  adx: ['adx', 'plusDi', 'minusDi'],
  vwap: ['vwap'],
  volume: ['volume'],
  supertrend: ['supertrend', 'direction'],
}

function generateIndicatorDeclarations(indicators: Indicator[]): string {
  let declarations = ''
  
  indicators.forEach((indicator, index) => {
    const template = INDICATOR_TEMPLATES[indicator.type]
    const variables = INDICATOR_VARIABLES[indicator.type]
    
    if (template) {
      if (indicator.type === 'macd') {
        declarations += `\n// MACD Indicator
[macdLine${index}, signalLine${index}, histogram${index}] = ta.macd(close, ${indicator.parameters.fastPeriod || 12}, ${indicator.parameters.slowPeriod || 26}, ${indicator.parameters.signalPeriod || 9})`
      } else if (indicator.type === 'bollinger') {
        declarations += `\n// Bollinger Bands
[middle${index}, upper${index}, lower${index}] = ta.bb(close, ${indicator.parameters.period || 20}, ${indicator.parameters.stdDev || 2})`
      } else if (indicator.type === 'stochastic') {
        declarations += `\n// Stochastic
[k${index}, d${index}] = ta.stoch(close, high, low, ${indicator.parameters.kPeriod || 14}, ${indicator.parameters.dPeriod || 3})`
      } else if (indicator.type === 'adx') {
        declarations += `\n// ADX
[adx${index}, plusDi${index}, minusDi${index}] = ta.adx(${indicator.parameters.period || 14})`
      } else if (indicator.type === 'supertrend') {
        declarations += `\n// SuperTrend
[supertrend${index}, direction${index}] = ta.supertrend(${indicator.parameters.factor || 3}, ${indicator.parameters.atrPeriod || 10})`
      } else {
        const varName = `${indicator.type}${index}`
        declarations += `\n// ${indicator.type.toUpperCase()} Indicator\n${varName} = ${template(indicator.parameters)}`
      }
    }
  })
  
  return declarations
}

function generateEntryConditions(indicators: Indicator[]): string {
  if (indicators.length === 0) {
    return `// No indicators configured - basic entry
longCondition = close > open
shortCondition = close < open`
  }

  let longConditions: string[] = []
  let shortConditions: string[] = []
  
  indicators.forEach((indicator, index) => {
    switch (indicator.type) {
      case 'sma':
      case 'ema':
        const varName = `${indicator.type}${index}`
        longConditions.push(`close > ${varName}`)
        shortConditions.push(`close < ${varName}`)
        break
      case 'rsi':
        const rsiVar = `rsi${index}`
        longConditions.push(`${rsiVar} < ${indicator.parameters.oversold || 30}`)
        shortConditions.push(`${rsiVar} > ${indicator.parameters.overbought || 70}`)
        break
      case 'macd':
        longConditions.push(`macdLine${index} > signalLine${index}`)
        shortConditions.push(`macdLine${index} < signalLine${index}`)
        break
      case 'bollinger':
        longConditions.push(`close < lower${index}`)
        shortConditions.push(`close > upper${index}`)
        break
      case 'stochastic':
        longConditions.push(`k${index} < ${indicator.parameters.oversold || 20}`)
        shortConditions.push(`k${index} > ${indicator.parameters.overbought || 80}`)
        break
      case 'supertrend':
        longConditions.push(`direction${index} < 0`)
        shortConditions.push(`direction${index} > 0`)
        break
    }
  })

  const longCondition = longConditions.length > 0 ? longConditions.join(' and ') : 'true'
  const shortCondition = shortConditions.length > 0 ? shortConditions.join(' and ') : 'true'

  return `// Entry Conditions
longCondition = ${longCondition}
shortCondition = ${shortCondition}`
}

function generateExitLogic(strategy: Strategy): string {
  let exitLogic = ''
  
  if (strategy.stopLoss) {
    exitLogic += `
// Stop Loss
stopLossPrice = strategy.position_size > 0 ? strategy.entryprice * (1 - ${strategy.stopLoss / 100}) : strategy.entryprice * (1 + ${strategy.stopLoss / 100})
if strategy.position_size > 0 and close <= stopLossPrice
    strategy.exit("Stop Loss", stop=stopLossPrice)
if strategy.position_size < 0 and close >= stopLossPrice
    strategy.exit("Stop Loss", stop=stopLossPrice)`
  }

  if (strategy.takeProfit) {
    exitLogic += `
// Take Profit
takeProfitPrice = strategy.position_size > 0 ? strategy.entryprice * (1 + ${strategy.takeProfit / 100}) : strategy.entryprice * (1 - ${strategy.takeProfit / 100})
if strategy.position_size > 0 and close >= takeProfitPrice
    strategy.exit("Take Profit", limit=takeProfitPrice)
if strategy.position_size < 0 and close <= takeProfitPrice
    strategy.exit("Take Profit", limit=takeProfitPrice)`
  }

  return exitLogic
}

export function generatePineScript(strategy: Strategy): string {
  const indicatorDeclarations = generateIndicatorDeclarations(strategy.indicators)
  const entryConditions = generateEntryConditions(strategy.indicators)
  const exitLogic = generateExitLogic(strategy)

  return `//@version=5
strategy("${strategy.name}", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=${strategy.riskPerTrade || 10})

// Input Parameters
symbol = "${strategy.symbol}"
timeframe = "${strategy.timeframe}"
${indicatorDeclarations}

${entryConditions}

// Execute Trades
if longCondition and strategy.position_size == 0
    strategy.entry("Long", strategy.long)

if shortCondition and strategy.position_size == 0
    strategy.entry("Short", strategy.short)
${exitLogic}

// Plot Indicators
// Add your plot statements here for visual confirmation
`
}

// Generate a strategy object from form inputs
export function createStrategyFromForm(
  name: string,
  symbol: string,
  timeframe: string,
  indicators: Indicator[],
  stopLoss?: number,
  takeProfit?: number,
  riskPerTrade?: number,
  description?: string
): Strategy {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    name,
    symbol,
    timeframe,
    description,
    indicators,
    stopLoss,
    takeProfit,
    riskPerTrade,
    createdAt: now,
    updatedAt: now,
  }
}
