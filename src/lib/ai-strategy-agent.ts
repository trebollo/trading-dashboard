import { Strategy, Indicator, IndicatorType } from '@/types'
import { generatePineScript } from './pine-generator'
import { generateId } from './utils'

/**
 * AI Strategy Agent - Rule-based intelligent strategy builder
 * Interprets natural language prompts and generates PineScript strategies
 */

export interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
  strategy?: Strategy
  pineScript?: string
}

export interface ParsedIntent {
  indicators: { type: IndicatorType; params?: Record<string, number> }[]
  direction: 'long' | 'short' | 'both'
  timeframe?: string
  symbol?: string
  riskManagement: {
    stopLoss?: number
    takeProfit?: number
    riskPerTrade?: number
  }
  style: 'scalping' | 'daytrading' | 'swing' | 'position' | 'unknown'
  keywords: string[]
}

// Keyword mappings for indicator detection
const INDICATOR_KEYWORDS: Record<IndicatorType, string[]> = {
  sma: ['sma', 'simple moving average', 'media movil simple', 'media simple'],
  ema: ['ema', 'exponential moving average', 'media exponencial', 'exponential'],
  rsi: ['rsi', 'relative strength', 'sobrecompra', 'sobreventa', 'overbought', 'oversold', 'fuerza relativa'],
  macd: ['macd', 'convergence divergence', 'convergencia'],
  bollinger: ['bollinger', 'bands', 'bandas', 'bb'],
  atr: ['atr', 'average true range', 'rango verdadero', 'volatilidad', 'volatility'],
  stochastic: ['stochastic', 'estocastico', 'stoch'],
  adx: ['adx', 'average directional', 'direccional', 'tendencia fuerte', 'trend strength'],
  vwap: ['vwap', 'volume weighted', 'volumen ponderado'],
  volume: ['volume', 'volumen', 'vol'],
  supertrend: ['supertrend', 'super trend'],
}

// Style detection keywords
const STYLE_KEYWORDS: Record<string, string[]> = {
  scalping: ['scalp', 'scalping', 'quick', 'rapido', 'fast', '1m', '5m', 'tick'],
  daytrading: ['daytrading', 'intraday', 'day trade', 'intrad'],
  swing: ['swing', 'multiday', 'varios dias', 'days', 'daily'],
  position: ['position', 'largo plazo', 'long term', 'weekly', 'monthly'],
}

// Direction keywords
const DIRECTION_KEYWORDS = {
  long: ['long', 'buy', 'compra', 'alcista', 'bullish', 'subida', 'uptrend'],
  short: ['short', 'sell', 'venta', 'bajista', 'bearish', 'bajada', 'downtrend'],
}

// Symbol detection
const SYMBOL_KEYWORDS: Record<string, string[]> = {
  MNQ: ['mnq', 'micro nasdaq', 'micro nq'],
  MES: ['mes', 'micro sp', 'micro s&p', 'micro es'],
  MYM: ['mym', 'micro dow', 'micro ym'],
  M2K: ['m2k', 'micro russell'],
  NQ: ['nq', 'nasdaq', 'nas100'],
  ES: ['es', 's&p', 'sp500', 'sp 500'],
  YM: ['ym', 'dow', 'dow jones'],
  RTY: ['rty', 'russell', 'russell 2000'],
}

// Strategy templates for common patterns
const STRATEGY_TEMPLATES: Record<string, {
  name: string
  indicators: { type: IndicatorType; params: Record<string, number> }[]
  stopLoss: number
  takeProfit: number
  description: string
}> = {
  momentum: {
    name: 'Momentum Strategy',
    indicators: [
      { type: 'ema', params: { period: 9 } },
      { type: 'ema', params: { period: 21 } },
      { type: 'rsi', params: { period: 14 } },
      { type: 'atr', params: { period: 14 } },
    ],
    stopLoss: 1.5,
    takeProfit: 3,
    description: 'Momentum crossover strategy using EMA 9/21 with RSI filter',
  },
  meanReversion: {
    name: 'Mean Reversion Strategy',
    indicators: [
      { type: 'bollinger', params: { period: 20, stdDev: 2 } },
      { type: 'rsi', params: { period: 14 } },
      { type: 'stochastic', params: { k: 14, d: 3 } },
    ],
    stopLoss: 2,
    takeProfit: 2,
    description: 'Mean reversion using Bollinger Bands with RSI and Stochastic confirmation',
  },
  trendFollowing: {
    name: 'Trend Following Strategy',
    indicators: [
      { type: 'supertrend', params: { period: 10, multiplier: 3 } },
      { type: 'adx', params: { period: 14 } },
      { type: 'ema', params: { period: 50 } },
    ],
    stopLoss: 2.5,
    takeProfit: 5,
    description: 'Trend following using SuperTrend with ADX filter for strong trends',
  },
  breakout: {
    name: 'Breakout Strategy',
    indicators: [
      { type: 'atr', params: { period: 14 } },
      { type: 'bollinger', params: { period: 20, stdDev: 2 } },
      { type: 'volume', params: {} },
      { type: 'adx', params: { period: 14 } },
    ],
    stopLoss: 1.5,
    takeProfit: 4,
    description: 'Breakout detection using ATR expansion with volume confirmation',
  },
  scalping: {
    name: 'Scalping Strategy',
    indicators: [
      { type: 'ema', params: { period: 5 } },
      { type: 'ema', params: { period: 13 } },
      { type: 'rsi', params: { period: 7 } },
      { type: 'vwap', params: {} },
    ],
    stopLoss: 0.5,
    takeProfit: 1,
    description: 'Fast scalping with EMA crossover, RSI, and VWAP as anchor',
  },
  vwapBounce: {
    name: 'VWAP Bounce Strategy',
    indicators: [
      { type: 'vwap', params: {} },
      { type: 'ema', params: { period: 9 } },
      { type: 'rsi', params: { period: 14 } },
      { type: 'volume', params: {} },
    ],
    stopLoss: 1,
    takeProfit: 2,
    description: 'VWAP bounce strategy with EMA confirmation and volume filter',
  },
}

/**
 * Parse a natural language prompt into structured intent
 */
export function parsePrompt(prompt: string): ParsedIntent {
  const lower = prompt.toLowerCase()
  const words = lower.split(/\s+/)

  // Detect indicators
  const indicators: { type: IndicatorType; params?: Record<string, number> }[] = []
  for (const [type, keywords] of Object.entries(INDICATOR_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      const params = extractIndicatorParams(lower, type as IndicatorType)
      indicators.push({ type: type as IndicatorType, params })
    }
  }

  // Detect direction
  let direction: 'long' | 'short' | 'both' = 'both'
  const hasLong = DIRECTION_KEYWORDS.long.some(kw => lower.includes(kw))
  const hasShort = DIRECTION_KEYWORDS.short.some(kw => lower.includes(kw))
  if (hasLong && !hasShort) direction = 'long'
  else if (hasShort && !hasLong) direction = 'short'

  // Detect trading style
  let style: ParsedIntent['style'] = 'unknown'
  for (const [s, keywords] of Object.entries(STYLE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      style = s as ParsedIntent['style']
      break
    }
  }

  // Detect symbol
  let symbol: string | undefined
  for (const [sym, keywords] of Object.entries(SYMBOL_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      symbol = sym
      break
    }
  }

  // Detect timeframe
  const timeframe = extractTimeframe(lower)

  // Detect risk params
  const riskManagement = extractRiskParams(lower)

  // Extract meaningful keywords
  const keywords = words.filter(w => w.length > 3)

  return {
    indicators,
    direction,
    timeframe,
    symbol,
    riskManagement,
    style,
    keywords,
  }
}

function extractIndicatorParams(text: string, type: IndicatorType): Record<string, number> | undefined {
  const params: Record<string, number> = {}

  // Look for period numbers near the indicator keyword
  const periodMatch = text.match(new RegExp(`${type}\\s*(?:de\\s*)?(?:periodo\\s*)?(?:period\\s*)?(\\d+)`, 'i'))
  if (periodMatch) {
    params.period = parseInt(periodMatch[1])
  }

  // EMA/SMA with specific periods (e.g., "ema 9 y 21")
  if (type === 'ema' || type === 'sma') {
    const crossMatch = text.match(/(?:ema|sma)\s*(\d+)\s*(?:y|and|\/|,)\s*(\d+)/i)
    if (crossMatch) {
      params.period = parseInt(crossMatch[1])
    }
  }

  return Object.keys(params).length > 0 ? params : undefined
}

function extractTimeframe(text: string): string | undefined {
  const tfPatterns: [RegExp, string][] = [
    [/\b1\s*m(?:in(?:ute)?)?(?:s)?\b/, '1m'],
    [/\b5\s*m(?:in(?:ute)?)?(?:s)?\b/, '5m'],
    [/\b15\s*m(?:in(?:ute)?)?(?:s)?\b/, '15m'],
    [/\b30\s*m(?:in(?:ute)?)?(?:s)?\b/, '30m'],
    [/\b1\s*h(?:our)?(?:s)?\b/, '1h'],
    [/\b4\s*h(?:our)?(?:s)?\b/, '4h'],
    [/\b1?\s*d(?:aily|ay)?\b/, '1D'],
    [/\bweekly\b|\bsemanal\b/, '1W'],
  ]

  for (const [pattern, tf] of tfPatterns) {
    if (pattern.test(text)) return tf
  }

  return undefined
}

function extractRiskParams(text: string): ParsedIntent['riskManagement'] {
  const params: ParsedIntent['riskManagement'] = {}

  // Stop loss
  const slMatch = text.match(/stop\s*(?:loss)?\s*(?:de\s*|of\s*|:?\s*)(\d+(?:\.\d+)?)\s*%?/i)
  if (slMatch) params.stopLoss = parseFloat(slMatch[1])

  // Take profit
  const tpMatch = text.match(/take\s*(?:profit)?\s*(?:de\s*|of\s*|:?\s*)(\d+(?:\.\d+)?)\s*%?/i)
  if (tpMatch) params.takeProfit = parseFloat(tpMatch[1])

  // Risk per trade
  const riskMatch = text.match(/risk(?:o)?\s*(?:per\s*trade|por\s*operacion)?\s*(?:de\s*|of\s*|:?\s*)(\d+(?:\.\d+)?)\s*%?/i)
  if (riskMatch) params.riskPerTrade = parseFloat(riskMatch[1])

  return params
}

/**
 * Detect which template best matches the user intent
 */
function detectTemplate(intent: ParsedIntent, prompt: string): string {
  const lower = prompt.toLowerCase()

  // Direct template matches
  if (lower.includes('momentum') || lower.includes('impulso')) return 'momentum'
  if (lower.includes('mean reversion') || lower.includes('reversion') || lower.includes('rango')) return 'meanReversion'
  if (lower.includes('trend') || lower.includes('tendencia')) return 'trendFollowing'
  if (lower.includes('breakout') || lower.includes('ruptura') || lower.includes('rotura')) return 'breakout'
  if (lower.includes('scalp') || lower.includes('quick') || lower.includes('rapido')) return 'scalping'
  if (lower.includes('vwap') && (lower.includes('bounce') || lower.includes('rebote'))) return 'vwapBounce'

  // Infer from style
  if (intent.style === 'scalping') return 'scalping'
  if (intent.style === 'swing' || intent.style === 'position') return 'trendFollowing'

  // Infer from indicators
  if (intent.indicators.some(i => i.type === 'bollinger') && intent.indicators.some(i => i.type === 'rsi')) {
    return 'meanReversion'
  }
  if (intent.indicators.some(i => i.type === 'supertrend') || intent.indicators.some(i => i.type === 'adx')) {
    return 'trendFollowing'
  }
  if (intent.indicators.some(i => i.type === 'vwap')) {
    return 'vwapBounce'
  }

  // Default to momentum
  return 'momentum'
}

/**
 * Build a strategy from parsed intent
 */
function buildStrategy(intent: ParsedIntent, templateKey: string): Strategy {
  const template = STRATEGY_TEMPLATES[templateKey]
  const now = new Date().toISOString()

  // Use template indicators, but override with user-specified ones if provided
  let indicators: Indicator[] = []

  if (intent.indicators.length > 0) {
    indicators = intent.indicators.map(ind => ({
      id: generateId(),
      type: ind.type,
      parameters: ind.params || getDefaultParams(ind.type),
    }))
  } else {
    indicators = template.indicators.map(ind => ({
      id: generateId(),
      type: ind.type,
      parameters: ind.params,
    }))
  }

  return {
    id: generateId(),
    name: template.name,
    symbol: intent.symbol || 'MNQ',
    timeframe: intent.timeframe || getDefaultTimeframe(intent.style),
    description: template.description,
    indicators,
    stopLoss: intent.riskManagement.stopLoss || template.stopLoss,
    takeProfit: intent.riskManagement.takeProfit || template.takeProfit,
    riskPerTrade: intent.riskManagement.riskPerTrade || 2,
    createdAt: now,
    updatedAt: now,
  }
}

function getDefaultParams(type: IndicatorType): Record<string, number> {
  const defaults: Record<IndicatorType, Record<string, number>> = {
    sma: { period: 20 },
    ema: { period: 20 },
    rsi: { period: 14 },
    macd: { fast: 12, slow: 26, signal: 9 },
    bollinger: { period: 20, stdDev: 2 },
    atr: { period: 14 },
    stochastic: { k: 14, d: 3 },
    adx: { period: 14 },
    vwap: {},
    volume: {},
    supertrend: { period: 10, multiplier: 3 },
  }
  return defaults[type]
}

function getDefaultTimeframe(style: ParsedIntent['style']): string {
  switch (style) {
    case 'scalping': return '1m'
    case 'daytrading': return '5m'
    case 'swing': return '4h'
    case 'position': return '1D'
    default: return '5m'
  }
}

/**
 * Generate improvement suggestions for a strategy
 */
function generateImprovements(strategy: Strategy, intent: ParsedIntent): string[] {
  const suggestions: string[] = []

  // Check for missing risk management
  if (!strategy.stopLoss || strategy.stopLoss === 0) {
    suggestions.push('Add a stop loss to manage risk. A 1-2% stop is recommended for futures.')
  }

  // Risk/reward ratio check
  if (strategy.stopLoss && strategy.takeProfit) {
    const rr = strategy.takeProfit / strategy.stopLoss
    if (rr < 1.5) {
      suggestions.push(`Risk/Reward ratio is ${rr.toFixed(1)}:1. Consider increasing take profit for at least 2:1.`)
    }
  }

  // Suggest additional confirmation indicators
  const hasVolume = strategy.indicators.some(i => i.type === 'volume' || i.type === 'vwap')
  if (!hasVolume) {
    suggestions.push('Consider adding volume analysis (VWAP or Volume) to confirm entries.')
  }

  const hasTrendFilter = strategy.indicators.some(i => i.type === 'adx' || i.type === 'supertrend')
  if (!hasTrendFilter && intent.style !== 'scalping') {
    suggestions.push('Adding a trend filter (ADX or SuperTrend) can reduce false signals in choppy markets.')
  }

  // Timeframe suggestions
  if (intent.style === 'scalping' && strategy.indicators.some(i => {
    const period = i.parameters.period as number
    return period && period > 20
  })) {
    suggestions.push('For scalping, consider using shorter indicator periods (5-14) for faster signals.')
  }

  if (strategy.indicators.length < 2) {
    suggestions.push('Using multiple indicators for confluence increases win rate. Consider adding a second confirmation.')
  }

  if (strategy.indicators.length > 5) {
    suggestions.push('Too many indicators can cause analysis paralysis. Consider removing conflicting signals.')
  }

  return suggestions
}

/**
 * Main agent function - process a user prompt and return a response
 */
export function processAgentPrompt(
  prompt: string,
  conversationHistory: AgentMessage[]
): AgentMessage {
  const intent = parsePrompt(prompt)
  const templateKey = detectTemplate(intent, prompt)
  const strategy = buildStrategy(intent, templateKey)
  const pineScript = generatePineScript(strategy)
  const improvements = generateImprovements(strategy, intent)

  // Build agent response
  let response = ''

  // Opening analysis
  response += `**Strategy Analysis Complete**\n\n`
  response += `I analyzed your request and built a **${strategy.name}** strategy.\n\n`

  // Detected parameters
  response += `**Detected Parameters:**\n`
  response += `- Symbol: ${strategy.symbol}\n`
  response += `- Timeframe: ${strategy.timeframe}\n`
  response += `- Style: ${intent.style !== 'unknown' ? intent.style : 'day trading'}\n`
  response += `- Direction: ${intent.direction === 'both' ? 'Long & Short' : intent.direction}\n\n`

  // Indicators used
  response += `**Indicators Applied:**\n`
  strategy.indicators.forEach(ind => {
    const params = Object.entries(ind.parameters)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')
    response += `- ${ind.type.toUpperCase()}${params ? ` (${params})` : ''}\n`
  })
  response += '\n'

  // Risk management
  response += `**Risk Management:**\n`
  response += `- Stop Loss: ${strategy.stopLoss}%\n`
  response += `- Take Profit: ${strategy.takeProfit}%\n`
  response += `- Risk/Reward: ${strategy.stopLoss ? (strategy.takeProfit! / strategy.stopLoss).toFixed(1) : '-'}:1\n`
  response += `- Risk per Trade: ${strategy.riskPerTrade}%\n\n`

  // Strategy logic explanation
  response += `**Strategy Logic:**\n`
  response += `${strategy.description}\n\n`

  // Improvements
  if (improvements.length > 0) {
    response += `**Suggestions for Improvement:**\n`
    improvements.forEach(imp => {
      response += `- ${imp}\n`
    })
    response += '\n'
  }

  response += `The Pine Script code has been generated and is ready to copy to TradingView.`

  return {
    id: generateId(),
    role: 'agent',
    content: response,
    timestamp: new Date().toISOString(),
    strategy,
    pineScript,
  }
}

/**
 * Get greeting message for the AI agent
 */
export function getAgentGreeting(): AgentMessage {
  return {
    id: generateId(),
    role: 'agent',
    content: `**AI Strategy Builder**\n\nDescribe the trading strategy you want to build. I can understand:\n\n- Indicator combinations (EMA, RSI, MACD, Bollinger, SuperTrend, etc.)\n- Trading style (scalping, day trading, swing, position)\n- Symbols (MNQ, MES, NQ, ES, etc.)\n- Risk parameters (stop loss, take profit)\n- Entry/exit conditions\n\n**Examples:**\n- "Build a momentum scalping strategy for MNQ using EMA 9/21 crossover with RSI filter"\n- "I want a mean reversion strategy with Bollinger Bands on ES 15min"\n- "Trend following strategy using SuperTrend and ADX for NQ 1hour"\n\nDescribe your strategy and I will analyze, build, and optimize it for you.`,
    timestamp: new Date().toISOString(),
  }
}
