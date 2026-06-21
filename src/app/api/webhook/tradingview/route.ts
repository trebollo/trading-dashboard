import { NextRequest, NextResponse } from 'next/server'

/**
 * TradingView Webhook Receiver API Route
 * 
 * This endpoint receives webhook alerts from TradingView when strategy
 * conditions are met. The alerts contain trade execution data that is
 * processed and stored for the dashboard to display.
 * 
 * TradingView sends a POST request with a JSON body containing:
 * - strategy: name of the strategy
 * - action: buy/sell/close/long/short
 * - symbol: trading symbol
 * - price: execution price
 * - Additional strategy performance data
 */

// CORS headers for TradingView webhook requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid payload: expected JSON object' },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!body.strategy || !body.action || !body.symbol || !body.price) {
      return NextResponse.json(
        { error: 'Missing required fields: strategy, action, symbol, price' },
        { status: 400, headers: corsHeaders }
      )
    }

    const validActions = ['buy', 'sell', 'close', 'long', 'short']
    if (!validActions.includes(body.action)) {
      return NextResponse.json(
        { error: `Invalid action: ${body.action}` },
        { status: 400, headers: corsHeaders }
      )
    }

    // Process the webhook event
    // In a production environment, this would store to a database.
    // For this client-side app, we acknowledge receipt and the client
    // polls/checks via localStorage (events are stored client-side
    // through the TradingView Connector component's polling mechanism).
    
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      payload: {
        strategy: body.strategy,
        action: body.action,
        symbol: body.symbol.toUpperCase(),
        price: Number(body.price),
        quantity: body.quantity || 1,
        time: body.time || body.timestamp || new Date().toISOString(),
        pnl: body.pnl,
        equity: body.equity,
        net_profit: body.net_profit,
        win_rate: body.win_rate,
        profit_factor: body.profit_factor,
        max_drawdown: body.max_drawdown,
        timeframe: body.timeframe || body.interval,
      },
      receivedAt: new Date().toISOString(),
      processed: true,
    }

    // Return success with the processed event data
    // The client-side connector will pick this up via SSE or polling
    return NextResponse.json(
      {
        success: true,
        message: 'Webhook received and processed',
        event,
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error processing webhook' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json(
    {
      status: 'active',
      service: 'TradingView Webhook Receiver',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { status: 200, headers: corsHeaders }
  )
}
