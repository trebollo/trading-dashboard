import { BacktestResult, Trade, EquityPoint } from '@/types'
import { calculateMetrics } from './metrics-calculator'
import { generateId } from './utils'

/**
 * TradingView Webhook Integration
 * 
 * TradingView can send webhook alerts when strategy conditions are met.
 * This module handles parsing webhook payloads and converting them into
 * backtest results that the dashboard can display.
 * 
 * Webhook payload format (JSON from TradingView alert):
 * {
 *   "strategy": "Strategy Name",
 *   "action": "buy" | "sell" | "close",
 *   "symbol": "MNQ",
 *   "price": 18500.25,
 *   "quantity": 1,
 *   "time": "2024-01-15T10:30:00Z",
 *   "pnl": 125.50,
 *   "position_size": 1,
 *   "initial_capital": 25000,
 *   "equity": 25125.50,
 *   "drawdown": 0.5
 * }
 */

export interface WebhookPayload {
  strategy: string
  action: 'buy' | 'sell' | 'close' | 'long' | 'short'
  symbol: string
  price: number
  quantity?: number
  time?: string
  timestamp?: string
  pnl?: number
  position_size?: number
  initial_capital?: number
  equity?: number
  drawdown?: number
  // Strategy performance fields
  net_profit?: number
  net_profit_percent?: number
  total_trades?: number
  win_rate?: number
  profit_factor?: number
  max_drawdown?: number
  sharpe_ratio?: number
  // Extended fields
  timeframe?: string
  interval?: string
  message?: string
}

export interface WebhookEvent {
  id: string
  payload: WebhookPayload
  receivedAt: string
  processed: boolean
  error?: string
}

export interface ConnectionStatus {
  isConnected: boolean
  lastReceived: string | null
  totalEvents: number
  webhookUrl: string
  secretToken: string
}

const WEBHOOK_EVENTS_KEY = 'trading_webhook_events'
const WEBHOOK_CONFIG_KEY = 'trading_webhook_config'

/**
 * Generate a unique webhook token for authentication
 */
export function generateWebhookToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = 'tv_'
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

/**
 * Get or create webhook configuration
 */
export function getWebhookConfig(): { url: string; token: string } {
  if (typeof window === 'undefined') return { url: '', token: '' }

  const stored = localStorage.getItem(WEBHOOK_CONFIG_KEY)
  if (stored) {
    return JSON.parse(stored)
  }

  const config = {
    url: `${window.location.origin}/api/webhook/tradingview`,
    token: generateWebhookToken(),
  }
  localStorage.setItem(WEBHOOK_CONFIG_KEY, JSON.stringify(config))
  return config
}

/**
 * Save a webhook event
 */
export function saveWebhookEvent(event: WebhookEvent): void {
  if (typeof window === 'undefined') return
  const events = getWebhookEvents()
  events.unshift(event) // newest first
  // Keep last 100 events
  const trimmed = events.slice(0, 100)
  localStorage.setItem(WEBHOOK_EVENTS_KEY, JSON.stringify(trimmed))
}

/**
 * Get all webhook events
 */
export function getWebhookEvents(): WebhookEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(WEBHOOK_EVENTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Get connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  const config = getWebhookConfig()
  const events = getWebhookEvents()
  const lastEvent = events[0]

  return {
    isConnected: events.length > 0 && lastEvent
      ? (Date.now() - new Date(lastEvent.receivedAt).getTime()) < 24 * 60 * 60 * 1000
      : false,
    lastReceived: lastEvent?.receivedAt || null,
    totalEvents: events.length,
    webhookUrl: config.url,
    secretToken: config.token,
  }
}

/**
 * Parse and validate a webhook payload
 */
export function parseWebhookPayload(body: unknown): { valid: boolean; payload?: WebhookPayload; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid payload: expected JSON object' }
  }

  const data = body as Record<string, unknown>

  // Required fields
  if (!data.strategy || typeof data.strategy !== 'string') {
    return { valid: false, error: 'Missing or invalid "strategy" field' }
  }

  if (!data.action || typeof data.action !== 'string') {
    return { valid: false, error: 'Missing or invalid "action" field' }
  }

  const validActions = ['buy', 'sell', 'close', 'long', 'short']
  if (!validActions.includes(data.action as string)) {
    return { valid: false, error: `Invalid action: ${data.action}. Must be one of: ${validActions.join(', ')}` }
  }

  if (!data.symbol || typeof data.symbol !== 'string') {
    return { valid: false, error: 'Missing or invalid "symbol" field' }
  }

  if (typeof data.price !== 'number' || data.price <= 0) {
    return { valid: false, error: 'Missing or invalid "price" field' }
  }

  const payload: WebhookPayload = {
    strategy: data.strategy as string,
    action: data.action as WebhookPayload['action'],
    symbol: (data.symbol as string).toUpperCase(),
    price: data.price as number,
    quantity: typeof data.quantity === 'number' ? data.quantity : 1,
    time: (data.time as string) || (data.timestamp as string) || new Date().toISOString(),
    pnl: typeof data.pnl === 'number' ? data.pnl : undefined,
    position_size: typeof data.position_size === 'number' ? data.position_size : undefined,
    initial_capital: typeof data.initial_capital === 'number' ? data.initial_capital : undefined,
    equity: typeof data.equity === 'number' ? data.equity : undefined,
    drawdown: typeof data.drawdown === 'number' ? data.drawdown : undefined,
    net_profit: typeof data.net_profit === 'number' ? data.net_profit : undefined,
    net_profit_percent: typeof data.net_profit_percent === 'number' ? data.net_profit_percent : undefined,
    total_trades: typeof data.total_trades === 'number' ? data.total_trades : undefined,
    win_rate: typeof data.win_rate === 'number' ? data.win_rate : undefined,
    profit_factor: typeof data.profit_factor === 'number' ? data.profit_factor : undefined,
    max_drawdown: typeof data.max_drawdown === 'number' ? data.max_drawdown : undefined,
    sharpe_ratio: typeof data.sharpe_ratio === 'number' ? data.sharpe_ratio : undefined,
    timeframe: (data.timeframe as string) || (data.interval as string) || undefined,
    message: typeof data.message === 'string' ? data.message : undefined,
  }

  return { valid: true, payload }
}

/**
 * Process a webhook event and convert to a trade/backtest update
 */
export function processWebhookEvent(payload: WebhookPayload): WebhookEvent {
  const event: WebhookEvent = {
    id: generateId(),
    payload,
    receivedAt: new Date().toISOString(),
    processed: true,
  }

  return event
}

/**
 * Convert accumulated webhook events into a BacktestResult
 */
export function webhookEventsToBacktest(
  events: WebhookEvent[],
  strategyName: string,
  initialCapital: number = 25000
): BacktestResult | null {
  if (events.length === 0) return null

  // Filter only trade-related events for this strategy
  const strategyEvents = events.filter(
    e => e.payload.strategy === strategyName && e.processed
  )

  if (strategyEvents.length === 0) return null

  // Build trades from events
  const trades: Trade[] = []
  let openTrade: Partial<Trade> | null = null

  for (const event of strategyEvents) {
    const p = event.payload

    if (p.action === 'buy' || p.action === 'long') {
      if (openTrade === null) {
        openTrade = {
          id: generateId(),
          strategyId: strategyName,
          symbol: p.symbol,
          type: 'long',
          entryPrice: p.price,
          entryTime: p.time || event.receivedAt,
          quantity: p.quantity || 1,
        }
      }
    } else if (p.action === 'sell' || p.action === 'short') {
      if (openTrade === null) {
        openTrade = {
          id: generateId(),
          strategyId: strategyName,
          symbol: p.symbol,
          type: 'short',
          entryPrice: p.price,
          entryTime: p.time || event.receivedAt,
          quantity: p.quantity || 1,
        }
      }
    } else if (p.action === 'close' && openTrade) {
      const pnl = p.pnl || calculatePnl(openTrade, p.price)
      const trade: Trade = {
        id: openTrade.id || generateId(),
        strategyId: openTrade.strategyId || strategyName,
        symbol: openTrade.symbol || p.symbol,
        type: openTrade.type || 'long',
        entryPrice: openTrade.entryPrice || p.price,
        exitPrice: p.price,
        entryTime: openTrade.entryTime || event.receivedAt,
        exitTime: p.time || event.receivedAt,
        quantity: openTrade.quantity || 1,
        pnl,
        pnlPercent: (pnl / (openTrade.entryPrice || p.price)) * 100,
        commission: 2.5,
        fees: 1.5,
      }
      trades.push(trade)
      openTrade = null
    }
  }

  if (trades.length === 0) return null

  // Build equity curve
  const equityCurve: EquityPoint[] = []
  let equity = initialCapital
  let peak = initialCapital

  equityCurve.push({ date: trades[0].entryTime, value: initialCapital, drawdown: 0 })

  for (const trade of trades) {
    equity += trade.pnl
    peak = Math.max(peak, equity)
    const dd = ((peak - equity) / peak) * 100
    equityCurve.push({ date: trade.exitTime, value: equity, drawdown: dd })
  }

  const metrics = calculateMetrics(trades, initialCapital, equityCurve)
  const symbol = strategyEvents[0].payload.symbol

  return {
    id: generateId(),
    strategyName,
    symbol,
    timeframe: strategyEvents[0].payload.timeframe || '5m',
    initialCapital,
    finalCapital: equity,
    trades,
    metrics,
    equityCurve,
    createdAt: new Date().toISOString(),
  }
}

function calculatePnl(openTrade: Partial<Trade>, exitPrice: number): number {
  const entry = openTrade.entryPrice || 0
  const qty = openTrade.quantity || 1
  if (openTrade.type === 'long') {
    return (exitPrice - entry) * qty
  } else {
    return (entry - exitPrice) * qty
  }
}

/**
 * Generate TradingView alert message template
 * This is what users put in TradingView's alert message field
 */
export function generateAlertTemplate(token: string): string {
  return `{
  "strategy": "{{strategy.order.alert_message}}",
  "action": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": {{close}},
  "quantity": {{strategy.order.contracts}},
  "time": "{{time}}",
  "pnl": {{strategy.order.pnl}},
  "position_size": {{strategy.position_size}},
  "equity": {{strategy.equity}},
  "initial_capital": {{strategy.initial_capital}},
  "net_profit": {{strategy.netprofit}},
  "net_profit_percent": {{strategy.netprofit_percent}},
  "total_trades": {{strategy.closedtrades}},
  "win_rate": {{strategy.wintrades_percent}},
  "profit_factor": {{strategy.profit_factor}},
  "max_drawdown": {{strategy.max_drawdown}},
  "timeframe": "{{interval}}",
  "token": "${token}"
}`
}

/**
 * Generate Pine Script alert setup code
 */
export function generateWebhookPineScript(strategyName: string): string {
  return `//@version=5
// Add this to your strategy for automatic webhook alerts

// Strategy alert setup - add these lines to your strategy:
// After each strategy.entry() or strategy.exit() call, the alerts will fire automatically

// To enable webhooks:
// 1. Right-click on your strategy in the chart
// 2. Select "Add Alert..."
// 3. Condition: Select your strategy name
// 4. Set "Webhook URL" to your dashboard URL
// 5. In "Message", paste the JSON template from the connector panel
// 6. Check "Webhook URL" option
// 7. Click "Create"

// The strategy will now automatically send trade data to your dashboard
// whenever a new trade is executed.

// Note: TradingView webhooks require a TradingView Pro, Pro+, or Premium plan.
`
}
